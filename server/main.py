import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
from dotenv import load_dotenv

load_dotenv()

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


SYSTEM_PROMPT = (
    "You are Yukti, a clinical decision support assistant for emergency medicine physicians. "
    "You may ONLY answer using the context passages provided. "
    "Do not use your training data. "
    "Do not extrapolate beyond what the context explicitly states. "
    "If the answer is not in the provided context, say so. "
    "Every response must cite the specific source document it drew from."
)

NO_CONTEXT_RESPONSE = (
    "I don't have a vetted guideline for this specific question. "
    "Please consult the source directly or contact OB/GYN."
)


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

    user_message = (
        f"Clinical question: {request.message}\n\n"
        f"Context passages:\n{context_block}"
    )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    response_text = message.content[0].text

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
