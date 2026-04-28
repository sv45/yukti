"""
Ingestion pipeline for Yukti knowledge base.

Reads approved clinical documents from /documents/, chunks them,
embeds with sentence-transformers, and stores in ChromaDB.

Usage:
    python ingest.py
    python ingest.py --source-type institutional_protocol --institution nypq --pathway epl
"""

import argparse
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
DOCUMENTS_DIR = BASE_DIR / "documents"
CHROMA_DIR = BASE_DIR / "chroma_db"

# ---------------------------------------------------------------------------
# Chunking config
# ---------------------------------------------------------------------------
CHUNK_TOKENS = 500
OVERLAP_TOKENS = 50
# Rough word-to-token ratio for splitting (sentence-transformers tokenizer
# averages ~1.3 tokens/word; we use a conservative 1.0 to avoid under-chunking)
WORDS_PER_TOKEN = 1.0


def _words_to_size(tokens: int) -> int:
    return int(tokens * WORDS_PER_TOKEN)


CHUNK_WORDS = _words_to_size(CHUNK_TOKENS)
OVERLAP_WORDS = _words_to_size(OVERLAP_TOKENS)

VALID_PATHWAYS = {"epl", "ectopic", "mab", "ec", "contraception"}
VALID_SOURCE_TYPES = {"national_guideline", "institutional_protocol"}


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def extract_text_from_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        return extract_text_from_pdf(path)
    elif path.suffix.lower() == ".txt":
        return extract_text_from_txt(path)
    else:
        raise ValueError(f"Unsupported file type: {path.suffix}")


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = re.split(r"\s+", text.strip())
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_WORDS, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        if end == len(words):
            break
        start += CHUNK_WORDS - OVERLAP_WORDS
    return chunks


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------

def ingest(
    source_type: str,
    institution: str | None = None,
    pathways: list[str] | None = None,
):
    """Ingest all documents in the documents/ folder into ChromaDB."""

    if source_type not in VALID_SOURCE_TYPES:
        raise ValueError(f"source_type must be one of {VALID_SOURCE_TYPES}")

    pathway_list = pathways or []
    for p in pathway_list:
        if p not in VALID_PATHWAYS:
            raise ValueError(f"pathway '{p}' not in {VALID_PATHWAYS}")

    # Load model
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Connect to ChromaDB
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(
        name="yukti_knowledge_base",
        metadata={"hnsw:space": "cosine"},
    )

    # Discover documents
    supported_extensions = {".pdf", ".txt"}
    doc_paths = [
        p for p in DOCUMENTS_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in supported_extensions
    ]

    if not doc_paths:
        print(f"No documents found in {DOCUMENTS_DIR}. Nothing ingested.")
        return

    date_ingested = datetime.now(timezone.utc).isoformat()
    total_chunks = 0

    for doc_path in doc_paths:
        print(f"Processing: {doc_path.name}")
        try:
            text = extract_text(doc_path)
        except Exception as e:
            print(f"  ERROR reading {doc_path.name}: {e}")
            continue

        chunks = chunk_text(text)
        print(f"  {len(chunks)} chunks")

        embeddings = model.encode(chunks, show_progress_bar=False).tolist()

        ids = [f"{doc_path.stem}_chunk_{i}" for i in range(len(chunks))]

        metadatas = [
            {
                "source_filename": doc_path.name,
                "source_type": source_type,
                "institution": institution or "",
                "pathways": ",".join(pathway_list),
                "date_ingested": date_ingested,
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]

        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        total_chunks += len(chunks)
        print(f"  Stored in ChromaDB.")

    print(f"\nIngestion complete. Total chunks stored: {total_chunks}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest documents into Yukti knowledge base")
    parser.add_argument(
        "--source-type",
        required=True,
        choices=list(VALID_SOURCE_TYPES),
        help="Type of source: national_guideline or institutional_protocol",
    )
    parser.add_argument(
        "--institution",
        default=None,
        help="Institution ID (e.g. nypq) — required for institutional_protocol",
    )
    parser.add_argument(
        "--pathway",
        nargs="+",
        choices=list(VALID_PATHWAYS),
        default=[],
        help="One or more clinical pathways these documents cover",
    )
    args = parser.parse_args()

    if args.source_type == "institutional_protocol" and not args.institution:
        parser.error("--institution is required when source-type is institutional_protocol")

    ingest(
        source_type=args.source_type,
        institution=args.institution,
        pathways=args.pathway,
    )
