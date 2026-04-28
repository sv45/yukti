# Yukti — Build Progress

**Last updated:** 2026-04-28
**Status:** Design system complete. EPL pathway component live. RAG pipeline built. No clinical documents ingested yet.

---

## What Has Been Built

### 1. Project Scaffold
Full-stack monorepo with `/client` (React) and `/server` (FastAPI). Root-level `.gitignore`, `.env.example`, and `README.md` in place. API key file deleted from repo root; `*.rtf` blocked in `.gitignore`.

### 2. Backend — FastAPI (`/server`)

**`server/main.py`**
- FastAPI app, version 0.1.0
- CORS configured for `http://localhost:3000`
- `GET /api/health` → `{"status": "ok", "app": "Yukti"}` — tested and confirmed working
- `POST /api/chat` — full RAG pipeline wired:
  1. Calls `retrieve()` with message, pathway, institution
  2. If no chunks returned → returns exact no-context fallback string (no Anthropic API call made)
  3. If chunks found → builds numbered context block, calls Anthropic API with strict system prompt, returns response + sources list
- Model: `claude-sonnet-4-6`, max_tokens: 1024
- System prompt (exact, do not change without clinical review):
  > "You are Yukti, a clinical decision support assistant for emergency medicine physicians. You may ONLY answer using the context passages provided. Do not use your training data. Do not extrapolate beyond what the context explicitly states. If the answer is not in the provided context, say so. Every response must cite the specific source document it drew from."
- No-context fallback (exact string, used by frontend to trigger amber warning box):
  > "I don't have a vetted guideline for this specific question. Please consult the source directly or contact OB/GYN."
- `ANTHROPIC_API_KEY` loaded from `.env` via `python-dotenv`

**`server/requirements.txt`**
```
fastapi
uvicorn
anthropic
python-dotenv
pypdf
chromadb
sentence-transformers
```
All installed to system Python 3.11.

**`server/data/institutions.json`**
Institution configuration. Currently contains one institution:
- `id: "nypq"` — NewYork-Presbyterian Queens
- `protocols: ["epl", "contraception"]`
- `rhogam_policy`: "NOT indicated for EPL less than 12 weeks per OB/GYN departmental guidance 2025"

### 3. RAG Pipeline (`/server/knowledge_base/`)

**`ingest.py`** — CLI ingestion script
- Reads `.pdf` and `.txt` files from `documents/`
- Chunks by word count: 500-word chunks, 50-word overlap
- Embeds with `sentence-transformers` model `all-MiniLM-L6-v2`
- Stores in ChromaDB (`chroma_db/`) with cosine distance space
- ChromaDB collection name: `yukti_knowledge_base`
- Metadata stored per chunk: `source_filename`, `source_type`, `institution`, `pathways` (comma-joined string), `date_ingested` (UTC ISO), `chunk_index`
- Valid `source_type` values: `national_guideline`, `institutional_protocol`
- Valid `pathway` values: `epl`, `ectopic`, `mab`, `ec`, `contraception`
- CLI usage:
  ```bash
  # From /server directory:
  python knowledge_base/ingest.py --source-type national_guideline --pathway epl ectopic
  python knowledge_base/ingest.py --source-type institutional_protocol --institution nypq --pathway epl
  ```
- `--institution` is required when `source-type` is `institutional_protocol`

**`retrieve.py`** — Query module (imported by `main.py`)
- Lazy singleton pattern: model and ChromaDB client loaded once on first request, reused
- Accepts: `query` (str), `pathway` (str), `institution` (str)
- Returns top-5 chunks, sorted by similarity descending
- **Anti-hallucination gate:** chunks with `similarity < 0.3` are discarded; if all chunks fall below threshold, returns `[]`
- ChromaDB distance → similarity conversion: `similarity = 1 - distance`
- Filter logic:
  - `pathway` filter: uses `$contains` on stored `pathways` string
  - `institution` filter: matches exact institution OR empty string (national guidelines)
  - If filtered query fails (e.g. no matching docs), falls back to unfiltered query

**`knowledge_base/documents/`** — Empty; awaiting clinical documents
**`knowledge_base/chroma_db/`** — Does not exist yet (created on first ingestion run)

### 4. Frontend — React (`/client`)

**Stack:** React 18, react-scripts 5, custom CSS design token system (no Tailwind), Inter + IBM Plex Mono fonts via Google Fonts

**Key config files:**
- `package.json` — proxy `http://localhost:8000` (routes `/api/*` to FastAPI in dev, no hardcoded URLs in components)
- `public/assets/yukti-logo.png` — Source logo asset (540×456 RGBA PNG)
- `src/assets/yukti-logo.png` — Webpack-bundled copy for ES module import

#### Design Token System (`src/styles/`)

**`src/styles/tokens.css`** — CSS custom properties, ported verbatim from design handoff:
- Sage palette: `--yk-sage-50` through `--yk-sage-900`, anchored on `--yk-sage-500: #96A695`
- Ink neutrals: `--yk-ink-100` through `--yk-ink-900`
- Risk colors: `--yk-risk-low` (green), `--yk-risk-mod` (amber), `--yk-risk-high` (red), `--yk-risk-info` (blue)
- Layout vars: `--yk-header-h: 60px`, `--yk-tabs-h: 44px`, `--yk-rail-w: 360px`
- Typography: `--yk-font-sans: "Inter"`, `--yk-font-mono: "IBM Plex Mono"`
- Radius, shadow, transition tokens

**`src/styles/app.css`** — Component styles, ported verbatim from design handoff:
- `.app` — CSS grid, `grid-template-rows: var(--yk-header-h) var(--yk-tabs-h) 1fr`, full viewport height
- `.header`, `.tabs`, `.tab`, `.tab__badge` — header + tab bar
- `.body` — `grid-template-columns: 1fr var(--yk-rail-w)`
- `.cds`, `.rail` — left CDS column and right Ask Yukti rail (sticky, `height: calc(100vh - 104px)`)
- `.section`, `.section__hd`, `.section__num`, `.section__title` — pathway section wrappers
- `.row`, `.row__label`, `.row__right`, `.pts`, `.pts--flag` — input row grid
- `.seg`, `.seg__opt` — segmented control buttons
- `.num-input`, `.num-input__unit` — numeric input with unit label
- `.rec`, `.rec__bullet`, `.rec__ask` — recommendation cards
- `.risk-band`, `.risk-band--low/mod/high/info` — colored risk pills
- `.result`, `.result__primary`, `.result__detail` — result display blocks
- `.alert`, `.alert__body`, `.alert__btn` — red emergent consult banner
- `.branch`, `.branch__row`, `.branch__cond`, `.branch__action` — disposition table
- `.local-banner`, `.tag-local`, `.tag--info` — institution/local tags
- `.refs`, `.refs__item`, `.refs__item--target` — reference list + scroll-highlight animation
- `.rail__hd`, `.rail__body`, `.rail__form`, `.msg`, `.msg--user`, `.msg--bot`, `.msg__chip` — Ask Yukti rail
- `.institution`, `.institution__name`, `.institution__caret` — institution picker chip
- `.disclaimer`, `.hcg-toggle`, `.ga-input`, `.cite-group`, `.row__cite` — miscellaneous

**`src/index.css`**
```css
@import './styles/tokens.css';
@import './styles/app.css';
```

#### Data Layer

**`src/data/refs.js`** — Citations registry (single source of truth), ES module export:
- 10 refs with stable IDs: `doubilet-2013`, `acog-200-2018`, `acog-tubal-2018`, `acep-2023`, `schreiber-pregloss-2018`, `rcog-gtg17`, `smfm-rh-2024`, `yukti-local-epl`, `yukti-local-rh`, `yukti-local-referral`
- `local: true` on the three NYP Queens refs (drives "Locally adapted" badge count in header banner)
- Institution name: "NYP Queens" throughout (adapted from "Memorial Regional" in design handoff)

#### Shared Component Library

**`src/components/primitives.jsx`** — ES module port of design handoff primitives:
- `Cite` — superscript citation links with smooth scroll to `#ref-<id>`, flash animation on target
- `Segmented` — segmented control (radio group), `aria-pressed` on active option
- `NumInput` — number input with inline unit label
- `Row` — input row grid: label + hint + citation + control + points pill; pill shown only for clinical flags (`→ consult OB`, `+RhIG`, `type & screen`, `incomplete`)
- `Section` — section wrapper with numbered header, optional right slot
- `RiskBand` — colored risk pill (low/mod/high/info variants)
- `ResultBlock` — computed result display with label, primary value, detail text, risk band
- `Recommendation` — recommendation card with bullet index, title, body, block quote, citation, tags, "Ask Yukti" button

#### Application Shell

**`src/App.js`** — Root component:
- Tabs: Early Pregnancy Loss (live), PUL/Ectopic, Medication Abortion, Contraception & EC (all three `live: false`, show "Soon" badge)
- Institution picker: NYP Queens (default) + Other; dropdown chip in header
- App-level pathway state object: `gaWeeks`, `gaDays`, `rhStatus`, `hemoStatus`, `bleedSeverity`, `signsOfInfection`, `pocOs`, `usIUPSeen`, `usCardiac`, `usCrlBand`, `usMsdBand`, `usSinceNoYS`, `usSinceWithYS`, `freeFluid`, `hcgOpen`, `hcg`, `hcg48`
- `pendingPrompt` / `onPromptConsumed` pattern: "Ask Yukti" buttons on recommendations pre-fill the right rail without prop drilling
- Logo: `import logoUrl from './assets/yukti-logo.png'` (ES module import, webpack-bundled)
- Local protocol banner: shows institution name + count of locally adapted refs
- Left column: EPLPathway + References section + disclaimer
- Right rail: AskYukti (sticky)

**`src/components/EPLPathway.jsx`** — Full EPL clinical pathway, ported from design handoff:
- 6 sections, all rendered via `Section` / `Row` / `Segmented` / `NumInput` / `Recommendation` / `RiskBand` / `ResultBlock` primitives
- **Section 01 — Patient Context:** GA (weeks + days numeric inputs), Rh(D) status segmented control; GA band computed (`<6w / 6–10w / 10–14w / ≥14w`); Rh-negative → `+RhIG` pill, unknown → `type & screen`
- **Section 02 — Clinical Findings:** Hemodynamic status, vaginal bleeding severity, signs of infection, POC at os; unstable/heavy/infection → `→ consult OB` pill
- **Section 03 — TVUS:** IUP seen, cardiac activity, CRL band, MSD band, serial sac timing (no YS, with YS); SRU 2013 logic computed: `usViable`, `usDefinitive`, `usSuggestive`, `usNoIUP`; ResultBlock shows computed interpretation + risk band
- **Section 04 — β-hCG (optional):** Collapsed by default; toggle button to expand; initial + 48h hCG inputs; trend computed: ≤−21% falling (low), ≥49% rising (info), else abnormal (mod)
- **Section 05 — Diagnosis & Management:** Diagnosis tag in section header computed from TVUS state; Rec A (confirm diagnosis / SRU criteria), Rec B (expectant/medical/surgical), Rec C (RhoGAM — only shown when Rh-negative, NYP Queens 300mcg IM protocol); wrong-pathway warning if no IUP seen
- **Section 06 — Disposition:** Branch table for confirmed EPL / suspected EPL / viable IUP / return precautions; "Per NYP Queens pathway"
- Red-flag alert: fires at top of component if any of: unstable, heavy bleeding, large free fluid, signs of infection; includes "Stabilization steps" button → pre-fills Ask Yukti
- All "Ask Yukti" buttons on recommendations use `onAsk(prompt)` → `pendingPrompt` → rail
- Clinical logic preserved verbatim from design handoff source

**`src/components/AskYukti.jsx`** — Right rail chat panel:
- Context strip shows current GA, Rh status, hemo status from App-level pathway state
- 4 suggested questions rendered as chip buttons (visible when thread is empty)
- Mock RAG responses keyed on prompt keywords (RhoGAM, expectant/medical/surgical, hCG, SRU, red flags); replaces with real `/api/chat` call when backend is wired to frontend
- Citation chips scroll-jump to `#ref-<id>` in the references section with flash animation
- `pendingPrompt` effect: fires when "Ask Yukti" button clicked on a recommendation

---

## Complete Folder Structure

```
yukti/
├── .env                          # Real API key (gitignored)
├── .env.example                  # Template: ANTHROPIC_API_KEY, ENVIRONMENT
├── .gitignore                    # Ignores: .env, *.rtf, node_modules, __pycache__, .DS_Store, *.pyc
├── PROGRESS.md                   # This file
├── README.md                     # Project overview + setup instructions
│
├── client/
│   ├── package.json              # React 18, react-scripts 5; proxy → localhost:8000
│   ├── public/
│   │   ├── index.html            # CRA HTML shell
│   │   └── assets/
│   │       └── yukti-logo.png    # Source logo (540×456 RGBA PNG)
│   └── src/
│       ├── index.js              # ReactDOM.createRoot entry point
│       ├── index.css             # @import tokens.css + app.css
│       ├── App.js                # Root: header, tabs, EPLPathway, AskYukti rail, refs
│       ├── assets/
│       │   └── yukti-logo.png    # Webpack-bundled copy (ES module import)
│       ├── styles/
│       │   ├── tokens.css        # CSS custom properties (sage palette, risk colors, layout vars)
│       │   └── app.css           # All component styles
│       ├── components/
│       │   ├── primitives.jsx    # Cite, Segmented, NumInput, Row, Section, RiskBand, ResultBlock, Recommendation
│       │   ├── EPLPathway.jsx    # Full EPL pathway: 6 sections, SRU logic, hCG trend, red-flag alert
│       │   └── AskYukti.jsx      # Right rail chat: context strip, suggestions, mock RAG, citation chips
│       └── data/
│           └── refs.js           # 10-entry citations registry (ES module export)
│
└── server/
    ├── main.py                   # FastAPI app: /api/health, /api/chat
    ├── requirements.txt          # Python dependencies
    ├── data/
    │   └── institutions.json     # Institution config (NYPQ + RhoGAM policy)
    └── knowledge_base/
        ├── README.md             # KB overview + ingestion instructions
        ├── ingest.py             # PDF/TXT → chunk → embed → ChromaDB
        ├── retrieve.py           # Query ChromaDB, threshold filter, return chunks
        ├── documents/            # DROP APPROVED CLINICAL PDFs HERE
        │   └── README.md         # Rules: clinician approval required, approved sources only
        └── chroma_db/            # Auto-created on first ingest run (gitignored)
```

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Embedding model | `all-MiniLM-L6-v2` | Fast, runs locally, good semantic similarity for medical text, no API cost |
| Vector store | ChromaDB (local persistent) | Zero infrastructure, file-based, easy to inspect and reset |
| Distance metric | Cosine | Standard for semantic similarity; similarity = 1 − distance |
| Similarity threshold | 0.3 | Primary anti-hallucination gate — below this, no answer is given |
| Chunk size | 500 words / 50 overlap | Balances context richness vs. retrieval precision |
| LLM | Claude Sonnet 4.6 | Best instruction-following for constrained prompts |
| System prompt | Hardcoded, strict | "ONLY answer from context" — zero-hallucination requirement |
| No-context response | Exact hardcoded string | Frontend detects this string to trigger amber UI warning |
| Institution filter | Matches institution OR empty string | Ensures national guidelines always surface alongside institutional protocols |
| Pathway filter fallback | Falls back to unfiltered if no results | Prevents silent failures when KB is sparse |
| Frontend proxy | CRA `"proxy"` in package.json | No hardcoded API URLs in components; works in dev without CORS issues |
| CSS system | Custom token system (no Tailwind) | Matches design handoff exactly; sage palette + risk colors defined as CSS vars |
| Component library | Custom primitives in primitives.jsx | Section/Row/Segmented/Recommendation pattern from design handoff; reused across all pathways |
| State management | App-level `pathway` object + prop drilling | Simple; single source of truth for all clinical inputs; Ask Yukti reads same state |
| Ask Yukti pre-fill | `pendingPrompt` + `onPromptConsumed` | Lets recommendation cards fire prompts into the rail without an event bus |
| Logo import | ES module import (`import logoUrl from ...`) | CRA webpack bundles and fingerprints the asset; `src="/assets/..."` public-folder path did not resolve |

---

## Design Token Quick Reference

| Token | Value | Used for |
|---|---|---|
| `--yk-sage-500` | `#96A695` | Primary brand, header bg, active tab underline |
| `--yk-sage-600` | `#6E8270` | Hover states |
| `--yk-sage-700` | `#4D5E4F` | Selected institution text |
| `--yk-risk-low` | green | Reassuring / falling hCG / viable IUP |
| `--yk-risk-mod` | amber | Suggestive / abnormal trend / ectopic concern |
| `--yk-risk-high` | red | Definitive nonviability / diagnostic |
| `--yk-risk-info` | blue | Rising hCG / reference only / informational |
| `--yk-header-h` | `60px` | Header row height |
| `--yk-tabs-h` | `44px` | Tab bar height |
| `--yk-rail-w` | `360px` | Ask Yukti rail width |

---

## What Needs to Be Built Next

### Immediate — Required before clinical use

1. **Wire AskYukti to the real `/api/chat` endpoint**
   - Replace `mockAnswer()` in `AskYukti.jsx` with `POST /api/chat`
   - Pass `context` (pathway state), `pathway: "epl"`, `institution: institutionId`
   - Handle no-context fallback response (display amber warning box, matching original ChatPanel behavior)

2. **Ingest clinical documents**
   - Obtain approved PDFs (ACOG Practice Bulletins, ACEP guidelines, SMFM consult series, NYP Queens protocols)
   - Place in `server/knowledge_base/documents/`
   - Run `python knowledge_base/ingest.py` with appropriate flags
   - Test retrieval with representative clinical questions

3. **Tune similarity threshold**
   - After ingestion, test with real queries to validate 0.3 is the right cutoff

### Near-term — UX and safety

4. **Disclaimer / onboarding modal**
   - On first load, show a modal requiring acknowledgment
   - Store acknowledgment in `sessionStorage`

5. **Mobile layout**
   - On narrow viewports, collapse the two-column body into a tab-switched single column
   - "Pathway" / "Ask Yukti" toggle

6. **Conversation reset**
   - "Clear" button in AskYukti rail

7. **Remaining pathway tabs**
   - PUL / Ectopic, Medication Abortion, Contraception & EC — currently show "Soon" badge
   - Each needs its own `*Pathway.jsx` component following the same primitives pattern

### Later — Infrastructure

8. **Authentication** — restrict access to verified clinical staff

9. **Deployment**
   - Backend: Railway or Render (FastAPI + persistent ChromaDB volume)
   - Frontend: Vercel (`REACT_APP_API_URL` env var)

10. **Audit logging** — log every query + response (no PHI) for clinical governance

11. **Knowledge base versioning** — track document versions, support re-ingestion

---

## How to Run

```bash
# Terminal 1 — Backend (from /server)
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (from /client)
npm start

# Ingest documents (from /server, after placing PDFs in knowledge_base/documents/)
python knowledge_base/ingest.py --source-type national_guideline --pathway epl
python knowledge_base/ingest.py --source-type institutional_protocol --institution nypq --pathway epl contraception
```

Backend: http://localhost:8000
Frontend: http://localhost:3000
API docs (auto-generated): http://localhost:8000/docs
