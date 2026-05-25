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
        params = urllib.parse.urlencode({
            "input": f"{name} {city} {state}",
            "inputtype": "textquery",
            "fields": "formatted_phone_number,opening_hours,url",
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
        c = candidates[0]
        return {
            "phone": c.get("formatted_phone_number"),
            "hours": c.get("opening_hours", {}).get("weekday_text") or None,
            "url": c.get("url"),
        }
    except Exception:
        return {}


BASE_SYSTEM_PROMPT = (
    "You are Yukti, a clinical decision support assistant for emergency medicine physicians. "
    "You may ONLY answer using the approved guideline passages provided in the user message. "
    "Do not use your training data or any knowledge not present in those passages. "
    "Do not extrapolate beyond what the passages explicitly state. "
    "If the answer is not clearly supported by the provided passages, say so explicitly. "
    "Every response must cite the specific source document it drew from."
)

NO_CONTEXT_RESPONSE = (
    "I cannot find a source in the approved guidelines for that recommendation. "
    "Please consult the relevant guideline directly or contact OB/GYN for guidance."
)


def _build_system_prompt(pathway: str) -> str:
    pathway_line = f" The active clinical pathway is: {pathway}." if pathway else ""
    return BASE_SYSTEM_PROMPT + pathway_line


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
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

    sources = [
        {
            "filename": chunk["source_filename"],
            "source_type": chunk["source_type"],
            "institution": chunk["institution"],
            "pathways": chunk["pathways"],
            "score": chunk["score"],
        }
        for chunk in chunks
    ]

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
Given a free-text ultrasound report, do TWO things:

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
