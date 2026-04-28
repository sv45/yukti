# Yukti — Reproductive Health Clinical Decision Support for Emergency Medicine

Yukti is a clinical decision support web application designed for emergency medicine physicians managing reproductive health cases in the ED. All AI responses are grounded exclusively in an approved, institution-specific knowledge base — eliminating hallucinations and ensuring every recommendation is traceable to a vetted clinical source.

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic API key

### Backend

```bash
cd server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env      # then fill in your API key
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
npm start                        # runs on http://localhost:3000
```

---

## Deployment

> Deployment instructions to be added. Planned targets: Railway (backend), Vercel (frontend).

---

## Project Structure

```
yukti/
  client/       React frontend
  server/       FastAPI backend
    knowledge_base/   Approved clinical source documents
    data/             Institution configuration
```
