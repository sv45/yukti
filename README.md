# Yukti

**Reproductive Health Clinical Decision Support for Emergency Medicine**

Yukti is a clinical decision support tool for emergency department clinicians managing
early pregnancy presentations. A clinician enters what they know about a patient (dating,
ultrasound findings, clinical picture), and Yukti guides them through the relevant
clinical pathway, surfacing guideline-based recommendations with their sources attached.

> **Disclaimer:** Yukti is a decision-support prototype for educational/demonstration
> purposes. It is **not clinically validated**, is not an approved clinical device, and is
> not a substitute for clinical judgment.

## Live application

- **App:** https://yukti-blue.vercel.app
- **Backend API:** https://yukti-api.onrender.com

## What it does

Five clinical decision support pathways for early pregnancy management in the ED:

1. Early Pregnancy Loss (EPL)
2. Pregnancy of Unknown Location & Ectopic
3. Medication Abortion (MAB)
4. Contraception & Emergency Contraception
5. REMS Certification

Key capabilities:

- **Ask Yukti** — a retrieval-augmented (RAG) assistant grounded in ACOG, ACCESS-Bridge,
  CDC, SRU 2013 and other guidelines; it will not answer outside its approved sources.
- **SRU 2013 nonviability criteria** derived automatically from ultrasound measurements.
- **hCG interpretation** using validated thresholds (Barnhart 2004, ACCESS-Bridge).
- **State-law integration** — abortion legality status by state, pulled into the clinical
  context.
- **Mobile-optimized wizard flow** — one step at a time on small screens.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Create React App), Vercel |
| Backend | FastAPI + Uvicorn (Python), Render |
| AI assistant | Claude (Anthropic API), RAG architecture |
| Vector database | ChromaDB + sentence-transformers (all-MiniLM-L6-v2) |
| Knowledge base | 15+ clinical guidelines, 552 document chunks |

## Running locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key
- Google Places API key

### Backend

```bash
cd server
pip install -r requirements.txt
# create a .env file with ANTHROPIC_API_KEY and GOOGLE_PLACES_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
npm start   # runs on http://localhost:3000, proxies /api/* to port 8000
```

## Testing

44 automated tests, all passing:

```bash
# Backend (pytest)
cd server
python3 -m pytest tests/test_api.py        # 12 API endpoint tests
python3 -m pytest tests/test_retrieve.py   # 10 knowledge-base retrieval tests

# Frontend (Jest)
cd client
CI=true npm test -- --watchAll=false       # 22 clinical-logic unit tests
```

See `DESIGN_AND_TESTING.md` for the full design rationale and testing methodology.

## Project structure

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

## Deployment

- **Backend**: Render Web Service — auto-deploys on push to `main`
- **Frontend**: Vercel — auto-deploys on push to `main`, proxies `/api/*` to Render

## Known limitations

- Not clinically validated.
- Knowledge base limited to ingested documents.
- No EHR integration.
- No multi-provider workflow.
