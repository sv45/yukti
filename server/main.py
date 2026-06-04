import os
import re
import sys
import json
import ssl
import urllib.request
import urllib.parse
import certifi

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Make knowledge_base importable
sys.path.insert(0, os.path.dirname(__file__))
from knowledge_base.retrieve import retrieve

app = FastAPI(title="Yukti API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""
    pathway: Optional[str] = ""
    institution: Optional[str] = ""


class ChatResponse(BaseModel):
    response: str
    sources: list


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Yukti"}


@app.get("/api/debug-kb")
def debug_kb():
    import chromadb
    from pathlib import Path
    base = Path(__file__).parent / "knowledge_base" / "chroma_db"
    exists = base.exists()
    collections = []
    count = 0
    try:
        client = chromadb.PersistentClient(path=str(base))
        collections = [c.name for c in client.list_collections()]
        if collections:
            col = client.get_collection(collections[0])
            count = col.count()
    except Exception as e:
        return {"chroma_dir": str(base), "exists": exists, "error": str(e)}
    return {"chroma_dir": str(base), "exists": exists, "collections": collections, "count": count}


MANAGEMENT_QUERIES = {
    "expectant": "expectant management early pregnancy loss watchful waiting natural expulsion",
    "medical":   "mifepristone misoprostol medical management early pregnancy loss emergency department",
    "surgical":  "surgical management MVA uterine aspiration D&C early pregnancy loss procedure",
}

@app.get("/api/management-guidance")
def management_guidance(type: str = Query(..., description="expectant | medical | surgical")):
    if type not in MANAGEMENT_QUERIES:
        raise HTTPException(status_code=400, detail=f"type must be one of {list(MANAGEMENT_QUERIES)}")
    chunks = retrieve(query=MANAGEMENT_QUERIES[type], pathway="epl")
    return {"management_type": type, "chunks": chunks}


@app.get("/api/test-anthropic")
def test_anthropic():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    try:
        client = anthropic.Anthropic(api_key=api_key)
        result = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=64,
            messages=[{"role": "user", "content": "say hello"}],
        )
        return {"response": result.content[0].text, "key_prefix": api_key[:16]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


GOOGLE_PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"

ABORTION_STATUS_FILE = os.path.join(os.path.dirname(__file__), "data", "abortion_legal_status.json")
ABORTION_STATUS_SOURCES = [
    "https://www.kff.org/womens-health-policy/abortion-in-the-u-s-dashboard/",
    "https://www.guttmacher.org/state-policy/explore/overview-abortion-laws",
    "https://reproductiverights.org/maps/abortion-laws-by-state/",
]

STATE_NAMES = {
    "AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California",
    "CO":"Colorado","CT":"Connecticut","DC":"District of Columbia","DE":"Delaware",
    "FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois",
    "IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana",
    "ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota",
    "MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada",
    "NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York",
    "NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon",
    "PA":"Pennsylvania","PR":"Puerto Rico","RI":"Rhode Island","SC":"South Carolina",
    "SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont",
    "VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming",
}


STATE_NAME_TO_ABBR = {v.lower(): k for k, v in STATE_NAMES.items()}
LEGALITY_KEYWORDS = {"legal", "illegal", "legal in", "allowed", "permit", "ban", "banned",
                     "restrict", "can i", "can we", "is it", "available", "access", "law",
                     "abortion law", "medication abortion in", "mifepristone in"}

def _get_state_law_context(message: str) -> str | None:
    """Return formatted state law context if query appears to be about abortion legality in a state."""
    msg_lower = message.lower()
    if not any(kw in msg_lower for kw in LEGALITY_KEYWORDS):
        return None
    # Find mentioned state — full name match first, then uppercase abbreviation only
    found_abbr = None
    import re as _re
    for abbr, name in STATE_NAMES.items():
        if name.lower() in msg_lower:
            found_abbr = abbr
            break
    if not found_abbr:
        # Match abbreviation only when it appears as uppercase in original message
        for abbr in STATE_NAMES:
            if _re.search(rf'\b{abbr}\b', message):
                found_abbr = abbr
                break
    if not found_abbr:
        return None
    try:
        with open(ABORTION_STATUS_FILE, "r") as f:
            data = json.load(f)
        state_data = data.get("states", {}).get(found_abbr)
        if not state_data:
            return None
        status = state_data.get("status", "unknown")
        state_name = STATE_NAMES.get(found_abbr, found_abbr)
        limit = state_data.get("gestational_limit_weeks")
        summary = state_data.get("summary", "")
        last_verified = state_data.get("last_verified", "")
        sources = data.get("meta", {}).get("sources", [])
        source_names = [
            "KFF" if "kff.org" in s else
            "Guttmacher Institute" if "guttmacher" in s else
            "Center for Reproductive Rights" if "reproductiverights" in s else s
            for s in sources
        ]
        law_text = f"ABORTION LEGAL STATUS — {state_name} (as of {last_verified}):\n"
        if status == "legal":
            law_text += f"Medication abortion is LEGAL in {state_name}."
        elif status == "banned":
            law_text += f"Medication abortion is NOT PERMITTED in {state_name}."
        elif status == "restricted":
            law_text += f"Medication abortion is LEGAL WITH RESTRICTIONS in {state_name}."
            if limit:
                law_text += f" Gestational limit: {limit} weeks."
        if summary:
            law_text += f" {summary}"
        law_text += f"\nSources: {', '.join(source_names)}. Last verified: {last_verified}."
        return law_text
    except Exception:
        return None


@app.get("/api/abortion-status")
def get_abortion_status(state: str = Query(..., description="Two-letter state abbreviation")):
    state = state.upper().strip()
    try:
        with open(ABORTION_STATUS_FILE, "r") as f:
            data = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not read abortion status data.")

    state_data = data.get("states", {}).get(state)
    if state_data is None:
        raise HTTPException(status_code=404, detail=f"No status found for state: {state}")

    return {
        "state": state,
        "state_name": STATE_NAMES.get(state, state),
        "status": state_data.get("status"),
        "gestational_limit_weeks": state_data.get("gestational_limit_weeks"),
        "waiting_period_hours": state_data.get("waiting_period_hours"),
        "in_person_required": state_data.get("in_person_required"),
        "summary": state_data.get("summary"),
        "last_verified": state_data.get("last_verified"),
        "sources": data.get("meta", {}).get("sources", ABORTION_STATUS_SOURCES),
    }
GOOGLE_PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


@app.get("/api/places/clinics")
def get_places_clinics(
    zip: str = Query(..., description="ZIP code"),
):
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_API_KEY not configured")

    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())

    # Step 1: Geocode the zip to lat/lng via Nominatim (no API key required)
    try:
        geo_params = urllib.parse.urlencode({
            "postalcode": zip, "countrycodes": "us", "format": "json", "limit": 1
        })
        geo_req = urllib.request.Request(
            f"https://nominatim.openstreetmap.org/search?{geo_params}",
            headers={"User-Agent": "yukti-cds/1.0"},
        )
        with urllib.request.urlopen(geo_req, timeout=5, context=_ssl_ctx) as resp:
            geo_data = json.loads(resp.read())
    except Exception:
        raise HTTPException(status_code=503, detail="Could not reach geocoding API.")

    if not geo_data:
        raise HTTPException(status_code=404, detail="ZIP code not found.")

    lat, lng = geo_data[0]["lat"], geo_data[0]["lon"]

    # Step 2: Text Search anchored to geocoded lat/lng with radius=8000 m (~5 miles)
    params = {
        "query": "family planning reproductive health gynecology women's health",
        "location": f"{lat},{lng}",
        "radius": 8000,
        "type": "health",
        "key": api_key,
    }

    try:
        encoded = urllib.parse.urlencode(params)
        with urllib.request.urlopen(f"{GOOGLE_PLACES_TEXT_SEARCH_URL}?{encoded}", timeout=10, context=_ssl_ctx) as resp:
            data = json.loads(resp.read())
    except Exception:
        raise HTTPException(status_code=503, detail="Could not reach Google Places API.")

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=503, detail=f"Google Places API error: {data.get('status')}")

    top5 = data.get("results", [])[:5]

    # Step 3: Place Details for each result to retrieve phone number
    clinics = []
    for p in top5:
        phone = None
        hours = None
        place_id = p.get("place_id")
        if place_id:
            try:
                det_params = urllib.parse.urlencode({
                    "place_id": place_id,
                    "fields": "name,formatted_phone_number,formatted_address,opening_hours",
                    "key": api_key,
                })
                with urllib.request.urlopen(
                    f"{GOOGLE_PLACES_DETAILS_URL}?{det_params}", timeout=5, context=_ssl_ctx
                ) as det_resp:
                    det_data = json.loads(det_resp.read())
                result = det_data.get("result", {})
                phone = result.get("formatted_phone_number")
                hours = result.get("opening_hours", {}).get("weekday_text") or None
            except Exception:
                pass  # phone/hours are best-effort

        clinics.append({
            "name": p.get("name"),
            "address": p.get("formatted_address"),
            "place_id": place_id,
            "phone": phone,
            "hours": hours,
        })

    return {"clinics": clinics}


@app.get("/api/geocode/zip")
def geocode_zip(zip: str = Query(...)):
    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    try:
        geo_params = urllib.parse.urlencode({
            "postalcode": zip, "countrycodes": "us", "format": "json",
            "limit": 1, "addressdetails": 1
        })
        geo_req = urllib.request.Request(
            f"https://nominatim.openstreetmap.org/search?{geo_params}",
            headers={"User-Agent": "yukti-cds/1.0"},
        )
        with urllib.request.urlopen(geo_req, timeout=5, context=_ssl_ctx) as resp:
            geo_data = json.loads(resp.read())
    except Exception:
        raise HTTPException(status_code=503, detail="Could not reach geocoding API.")
    if not geo_data:
        raise HTTPException(status_code=404, detail="ZIP code not found.")
    state_name = geo_data[0].get("address", {}).get("state", "")
    abbrev = next((k for k, v in STATE_NAMES.items() if v == state_name), None)
    if not abbrev:
        raise HTTPException(status_code=404, detail="State not found for ZIP.")
    return {"state": abbrev, "state_name": state_name}


@app.get("/api/places/pharmacies")
def get_places_pharmacies(zip: str = Query(..., description="ZIP code")):
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_API_KEY not configured")

    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())

    # Geocode zip via Nominatim
    try:
        geo_params = urllib.parse.urlencode({
            "postalcode": zip, "countrycodes": "us", "format": "json", "limit": 1
        })
        geo_req = urllib.request.Request(
            f"https://nominatim.openstreetmap.org/search?{geo_params}",
            headers={"User-Agent": "yukti-cds/1.0"},
        )
        with urllib.request.urlopen(geo_req, timeout=5, context=_ssl_ctx) as resp:
            geo_data = json.loads(resp.read())
    except Exception:
        raise HTTPException(status_code=503, detail="Could not reach geocoding API.")

    if not geo_data:
        raise HTTPException(status_code=404, detail="ZIP code not found.")

    lat, lng = geo_data[0]["lat"], geo_data[0]["lon"]

    def _haversine_miles(lat1, lon1, lat2, lon2):
        import math
        R = 3959.0
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
        return round(R * 2 * math.asin(math.sqrt(a)), 1)

    seen_ids = {}
    params = {
        "query": "pharmacy",
        "location": f"{lat},{lng}",
        "radius": 16093,
        "type": "pharmacy",
        "key": api_key,
    }
    try:
        encoded = urllib.parse.urlencode(params)
        with urllib.request.urlopen(f"{GOOGLE_PLACES_TEXT_SEARCH_URL}?{encoded}", timeout=10, context=_ssl_ctx) as resp:
            data = json.loads(resp.read())
    except Exception:
        raise HTTPException(status_code=503, detail="Could not reach Google Places API.")

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=503, detail=f"Google Places API error: {data.get('status')}")

    for p in data.get("results", [])[:10]:
        place_id = p.get("place_id")
        if not place_id or place_id in seen_ids:
            continue
        geo_loc = p.get("geometry", {}).get("location", {})
        dist = _haversine_miles(lat, lng, geo_loc.get("lat", lat), geo_loc.get("lng", lng))
        seen_ids[place_id] = {
            "name": p.get("name"),
            "address": p.get("formatted_address"),
            "place_id": place_id,
            "distance_miles": dist,
            "phone": None,
            "hours": None,
        }

    # Fetch phone/hours for each result
    for place_id, entry in seen_ids.items():
        try:
            det_params = urllib.parse.urlencode({
                "place_id": place_id,
                "fields": "formatted_phone_number,opening_hours",
                "key": api_key,
            })
            with urllib.request.urlopen(
                f"{GOOGLE_PLACES_DETAILS_URL}?{det_params}", timeout=5, context=_ssl_ctx
            ) as det_resp:
                det_data = json.loads(det_resp.read())
            result = det_data.get("result", {})
            entry["phone"] = result.get("formatted_phone_number")
            entry["hours"] = result.get("opening_hours", {}).get("weekday_text") or None
        except Exception:
            pass

    results = sorted(seen_ids.values(), key=lambda x: x["distance_miles"])[:10]
    return {"results": results}


@app.get("/api/places/pharmacy-details")
def get_pharmacy_details(
    name: str = Query(...),
    city: str = Query(...),
    state: str = Query(...),
):
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        return {}
    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    try:
        # Step 1: find place_id
        params = urllib.parse.urlencode({
            "input": f"{name} pharmacy {city} {state}",
            "inputtype": "textquery",
            "fields": "place_id",
            "key": api_key,
        })
        with urllib.request.urlopen(
            f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?{params}",
            timeout=6, context=_ssl_ctx
        ) as resp:
            data = json.loads(resp.read())
        candidates = data.get("candidates", [])
        if not candidates:
            return {}
        place_id = candidates[0].get("place_id")
        if not place_id:
            return {}
        # Step 2: fetch place details including phone
        detail_params = urllib.parse.urlencode({
            "place_id": place_id,
            "fields": "formatted_phone_number,opening_hours",
            "key": api_key,
        })
        with urllib.request.urlopen(
            f"https://maps.googleapis.com/maps/api/place/details/json?{detail_params}",
            timeout=6, context=_ssl_ctx
        ) as resp:
            detail = json.loads(resp.read())
        result = detail.get("result", {})
        return {
            "phone": result.get("formatted_phone_number"),
            "hours": result.get("opening_hours", {}).get("weekday_text") or None,
        }
    except Exception:
        return {}


BASE_SYSTEM_PROMPT = (
    "You are Yukti, a clinical decision support assistant for emergency medicine physicians. "
    "You may ONLY answer using the approved guideline passages and state law information provided in the user message. "
    "Do not use your training data or any knowledge not present in those passages. "
    "Do not extrapolate beyond what the passages explicitly state. "
    "If the answer is not clearly supported by the provided passages, say so explicitly. "
    "If state law information is provided in the message, you may use it to answer questions about abortion legality in that state — cite the sources (KFF, Guttmacher Institute, Center for Reproductive Rights) and the last verified date. "
    "Do not include source filenames or document names anywhere in your response."
)

CITATION_MAP = {
    "acog_contraception_206.pdf":  "ACOG Practice Bulletin No. 206 (2016)",
    "acog_ec_112.pdf":             "ACOG Practice Bulletin No. 112 (2015)",
    "acog_ec_152.pdf":             "ACOG Practice Bulletin No. 152 (2015, reaffirmed 2025)",
    "acog_ectopic_193.pdf":        "ACOG Practice Bulletin No. 193 (2018)",
    "acog_epl_200.pdf":            "American College of Obstetricians and Gynecologists. (2018, reaffirmed 2025). Early pregnancy loss (Practice Bulletin No. 200). Obstetrics & Gynecology, 132(5), e197–e207.",
    "acog_mab_225.pdf":            "ACOG Practice Bulletin No. 225 (2020)",
    "acog_prepregnancy_762.pdf":   "ACOG Committee Opinion No. 762 (2019)",
    "cdc-mec-summary-chart-2024.pdf": "CDC U.S. MEC Summary Chart (2024)",
    "acep_pregnancy.pdf":          "ACEP Clinical Policy: Early Pregnancy (2012)",
    "goldberg_2022_pul_mab.pdf":   "Goldberg et al. (2022)",
    "clinical_obgyn_contraception_abortion.pdf": "Rivlin & Davis (2022). Contraception and abortion. In Comprehensive Gynecology (8th ed., pp. 238–254). Elsevier.",
    "mua_2011.pdf": "Allison, Sherwood & Schust (2011). Management of first trimester pregnancy loss can be safely moved into the office. Reviews in Obstetrics & Gynecology, 4(1), 5–14.",
    "acep_pregnancy_2017.pdf": "Hahn, Promes & Brown (2017). Clinical policy: Critical issues in the initial evaluation and management of patients presenting to the ED in early pregnancy. Annals of Emergency Medicine, 69(2), 241–250.",
    "menon_ectopic.pdf":       "Menon S et al. (2007). Methotrexate treatment of ectopic pregnancy. Fertil Steril, 87(3), 481–484.",
    "access-bridge-ectopic-restricted.pdf":   "ACCESS-Bridge. PUL & Ectopic Pregnancy in the ED (Restricted states). April 2025.",
    "access-bridge-ectopic-unrestricted.pdf": "ACCESS-Bridge. PUL & Ectopic Pregnancy in the ED (Unrestricted states). April 2025.",
    "fda_mifepristone.pdf": "U.S. Food and Drug Administration. Mifepristone (Mifeprex) prescribing information and REMS program. FDA.",
    "rems_overview.txt":   "Mifepristone REMS Program Overview. Yukti clinical reference.",
}

NO_CONTEXT_RESPONSE = (
    "I cannot find a source in the approved guidelines for that recommendation. "
    "Please consult the relevant guideline directly or contact OB/GYN for guidance."
)


def _build_system_prompt(pathway: str) -> str:
    pathway_line = f" The active clinical pathway is: {pathway}." if pathway else ""
    return BASE_SYSTEM_PROMPT + pathway_line


FAREWELL_WORDS = {"bye", "goodbye", "see you", "later", "ttyl", "cya", "take care", "good night", "night"}
GREETING_WORDS = {"hi", "hello", "hey", "howdy", "hiya", "sup", "what's up", "whats up", "good morning", "good afternoon", "good evening", "hello?", "hi?"}
FILLER_WORDS = {"thanks", "thank you", "ty", "thx", "cheers", "ok", "okay", "cool", "great", "nice", "awesome", "got it", "sounds good", "lol", "haha", "test", "testing"}

UI_HELP_RESPONSE = (
    "To change your state or look up guidelines for a different state, click the state name "
    "in the top-right corner of the header — it will open a dropdown where you can select "
    "a different state. The legal status banners and state-specific guidance will update automatically."
)

CLINICAL_TERMS = {"hcg", "epl", "iup", "pul", "mab", "rems", "ectopic", "misoprostol",
                   "mifepristone", "methotrexate", "ultrasound", "pregnancy", "bleeding",
                   "abortion", "contraception", "ectopic", "placenta", "gestational", "fetal"}

GREETING_RESPONSE = (
    "Hi — I'm Yukti, a clinical decision support tool for reproductive health in the ED. "
    "Ask me a clinical question and I'll search the approved guidelines to help."
)
FAREWELL_RESPONSE = "Take care."
FILLER_RESPONSE = "Happy to help — ask me a clinical question anytime."

UI_KEYWORDS = {"change state", "change the state", "switch state", "select state", "update state",
               "how do i change", "how to change", "where do i change", "change my state",
               "change location", "state input", "change state input",
               "different state", "look up guidelines", "guidelines for a different", "another state",
               "how do i use", "how do i navigate", "how does this tool", "how to use this"}

def _off_topic_response(message: str):
    cleaned = message.strip().lower().rstrip("!.,?")
    if any(term in cleaned for term in CLINICAL_TERMS):
        return None
    if any(phrase in cleaned for phrase in UI_KEYWORDS):
        return UI_HELP_RESPONSE
    if cleaned in FAREWELL_WORDS or any(w in cleaned for w in FAREWELL_WORDS):
        return FAREWELL_RESPONSE
    if cleaned in GREETING_WORDS:
        return GREETING_RESPONSE
    if cleaned in FILLER_WORDS:
        return FILLER_RESPONSE
    if len(cleaned.split()) <= 2:
        return FILLER_RESPONSE
    return None


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    off_topic = _off_topic_response(request.message)
    if off_topic is not None:
        return ChatResponse(response=off_topic, sources=[])

    chunks = retrieve(
        query=request.message,
        pathway=request.pathway or "",
        institution=request.institution or "",
    )

    if not chunks:
        return ChatResponse(response=NO_CONTEXT_RESPONSE, sources=[])

    # Build context block from retrieved chunks
    context_parts = []
    for i, chunk in enumerate(chunks, start=1):
        context_parts.append(
            f"[{i}] Source: {chunk['source_filename']} (score: {chunk['score']})\n"
            f"{chunk['text']}"
        )
    context_block = "\n\n".join(context_parts)

    # Build user message: clinical question + active pathway + patient context + guideline passages
    message_parts = [f"Clinical question: {request.message}"]

    if request.pathway:
        message_parts.append(f"Active pathway: {request.pathway}")

    # Inject state law context if query is about abortion legality in a specific state
    state_law = _get_state_law_context(request.message)
    if state_law:
        message_parts.append(f"State law information (from KFF, Guttmacher Institute, Center for Reproductive Rights):\n{state_law}")

    if request.context:
        try:
            ctx = json.loads(request.context)
            if ctx:
                message_parts.append(
                    f"Patient context (current form state):\n{json.dumps(ctx, indent=2)}"
                )
        except (json.JSONDecodeError, TypeError):
            if request.context.strip():
                message_parts.append(f"Patient context: {request.context}")

    message_parts.append(f"Approved guideline passages:\n{context_block}")

    user_message = "\n\n".join(message_parts)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    claude = anthropic.Anthropic(api_key=api_key)
    result = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_build_system_prompt(request.pathway or ""),
        messages=[{"role": "user", "content": user_message}],
    )

    response_text = result.content[0].text

    sources = []
    seen = set()
    for chunk in chunks:
        fname = chunk["source_filename"]
        citation = CITATION_MAP.get(fname, fname)
        if citation in seen:
            continue
        seen.add(citation)
        sources.append({
            "citation": citation,
            "source_type": chunk["source_type"],
            "institution": chunk["institution"],
            "score": chunk["score"],
        })

    return ChatResponse(response=response_text, sources=sources)


# ── US Interpretation endpoint ────────────────────────────────────────────────

class USInterpretRequest(BaseModel):
    report: str

class USRawFields(BaseModel):
    gestational_sac: Optional[str] = None
    msd_mm: Optional[float] = None
    yolk_sac: Optional[str] = None
    embryo: Optional[str] = None
    crl_mm: Optional[float] = None
    cardiac_activity: Optional[str] = None
    free_fluid: Optional[str] = None
    adnexal_findings: Optional[str] = None
    endometrial_stripe_mm: Optional[float] = None

class USClassification(BaseModel):
    category: str
    impression_key: str
    criteria: list

class USInterpretResponse(BaseModel):
    raw_fields: USRawFields
    classification: USClassification

US_INTERPRET_SYSTEM_PROMPT = """You are a clinical ultrasound interpretation assistant for emergency medicine.
Given a free-text ultrasound report (and optionally a baseline hCG), do TWO things:

STEP 1 — EXTRACT raw fields:
  gestational_sac (present/absent/not seen), msd_mm (float or null),
  yolk_sac (present/absent/null), embryo (present/absent/null), crl_mm (float or null),
  cardiac_activity (present/absent/null), free_fluid (none/small/moderate/large/null),
  adnexal_findings (descriptive string or null), endometrial_stripe_mm (float or null).
  Use null for any field not mentioned.

STEP 2 — CLASSIFY into exactly one of these categories using Doubilet 2013 / ACOG criteria:
  confirmed_viable_iup      → impression_key: "iup"
  incomplete_abortion       → impression_key: "definitive-epl"
  complete_abortion         → impression_key: "definitive-epl"
  missed_abortion           → impression_key: "definitive-epl"
  anembryonic_pregnancy     → impression_key: "definitive-epl"
  definitive_epl_doubilet   → impression_key: "definitive-epl"
  probable_epl              → impression_key: "pul"
  indeterminate_pul         → impression_key: "pul"
  high_suspicion_ectopic    → impression_key: "ectopic"
  confirmed_ectopic         → impression_key: "ectopic"

IMPORTANT classification rules:
- If the report states "intrauterine pregnancy", "IUP", "IUGS confirmed", "intrauterine gestational sac", or any equivalent phrasing that explicitly confirms an intrauterine location, classify as confirmed_viable_iup (impression_key: "iup") — even if detailed sonographic measurements are not listed.
- If a baseline hCG is provided, use 3,500 mIU/mL as the discriminatory zone (not 1,500–2,000). Above this threshold without a visible IUP on ultrasound raises ectopic concern.
- Do not classify as PUL solely because detailed measurements are absent — if the report impression clearly states IUP, classify as IUP.
- hCG alone is never sufficient to classify as PUL or ectopic without an ultrasound impression to support it.

Provide criteria as short bullet strings listing the specific finding(s) that led to the classification.

Return ONLY valid JSON — no markdown fences, no extra keys:
{
  "raw_fields": { "gestational_sac":..., "msd_mm":..., "yolk_sac":...,
                  "embryo":..., "crl_mm":..., "cardiac_activity":...,
                  "free_fluid":..., "adnexal_findings":..., "endometrial_stripe_mm":... },
  "classification": { "category":"...", "impression_key":"...", "criteria":["...","..."] }
}"""


@app.post("/api/interpret-us", response_model=USInterpretResponse)
async def interpret_us(req: USInterpretRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    # Retrieve relevant EPL chunks to ground classification
    try:
        chunks = retrieve(query=req.report, pathway="epl")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"retrieve() failed: {e}")

    guideline_text = ""
    if chunks:
        passages = "\n\n".join(
            f"[{i+1}] ({c['source_filename']}, score={c['score']})\n{c['text']}"
            for i, c in enumerate(chunks)
        )
        guideline_text = f"\n\n--- RELEVANT GUIDELINE PASSAGES ---\n{passages}\n--- END PASSAGES ---"

    try:
        claude = anthropic.Anthropic(api_key=api_key)
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=US_INTERPRET_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": req.report + guideline_text}]
        )
        raw = response.content[0].text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API failed: {e}")

    try:
        stripped = re.sub(r"^```[a-z]*\n?", "", raw.strip())
        stripped = re.sub(r"\n?```$", "", stripped).strip()
        data = json.loads(stripped)
        return USInterpretResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON parse/validation failed: {e} | raw: {raw[:300]}")
