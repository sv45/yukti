# Yukti — Reproductive Health Clinical Decision Support for Emergency Medicine

Yukti is a clinical decision support web application designed for emergency medicine physicians managing reproductive health cases in the ED. All AI responses are grounded exclusively in an approved knowledge base of clinical guidelines — eliminating hallucinations and ensuring every recommendation is traceable to a vetted source.

**Live app:** https://yukti-blue.vercel.app  
**API:** https://yukti-api.onrender.com

---

## Clinical Pathways

- **Early Pregnancy Loss (EPL)** — gestational age, ultrasound findings (SRU 2013 criteria), Rh status, management selection (expectant / medical / surgical), aftercare
- **Pregnancy of Unknown Location & Ectopic** — rupture risk, hCG interpretation, discriminatory zone assessment, ectopic workup
- **Medication Abortion (MAB)** — eligibility, contraindications, Rh status, PUL management (Goldberg 2022)
- **Contraception & Emergency Contraception** — same-day initiation, CDC US MEC, weight-based EC recommendation
- **REMS Certification** — mifepristone REMS workflow

**Ask Yukti** — RAG-based AI chat grounded in 15+ clinical guidelines (ACOG, ACCESS-Bridge, CDC, SRU 2013, SMFM). Will not answer outside approved sources.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Create React App), Vercel |
| Backend | FastAPI + Uvicorn, Render |
| AI | Claude Sonnet (Anthropic API) |
| Vector DB | ChromaDB + sentence-transformers (all-MiniLM-L6-v2) |
| State law | KFF / Guttmacher data |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key
- Google Places API key

### Backend

```bash
cd server
pip install -r requirements.txt
# create .env with ANTHROPIC_API_KEY and GOOGLE_PLACES_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
npm start   # runs on http://localhost:3000 (proxies /api to port 8000)
```

---

## Testing

### Backend (pytest)
```bash
cd server
python3 -m pytest tests/ -v
# 22 tests: 12 API endpoint tests + 10 knowledge base retrieval tests
```

### Frontend (Jest)
```bash
cd client
CI=true npm test -- --watchAll=false
# 22 tests: SRU 2013 criteria, hCG thresholds, EC weight logic
```

---

## Project Structure

```
yukti/
  client/                   React frontend
    src/
      components/           Clinical pathway components
      data/refs.js          Citations registry
      __tests__/            Jest test suite
  server/                   FastAPI backend
    main.py                 API routes
    knowledge_base/
      ingest.py             Document ingestion pipeline
      retrieve.py           Semantic retrieval
      chroma_db/            Vector database
      documents/            Source PDFs
    tests/                  pytest test suite
    data/                   Institution config, state law data
  render.yaml               Render deployment config
  DESIGN_AND_TESTING.md     Design and testing documentation
```

---

## Deployment

- **Backend**: Render Web Service — auto-deploys on push to `main`
- **Frontend**: Vercel — auto-deploys on push to `main`, proxies `/api/*` to Render

---

## Limitations

- Not clinically validated for patient care
- Knowledge base limited to ingested guideline documents
- No EHR integration
- Intended as a decision support aid — does not replace clinical judgment
