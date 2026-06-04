"""
Retrieval module for Yukti knowledge base.

Queries ChromaDB for the most relevant chunks given a clinical query,
filtered by pathway and institution where provided.

Returns an empty list if no chunk scores above the similarity threshold —
this is the primary anti-hallucination gate.
"""

import os
from pathlib import Path
from typing import Optional

import chromadb
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
# Allow override via env var for cloud deployment (e.g. Render persistent disk)
CHROMA_DIR = Path(os.environ.get("CHROMA_DIR", str(BASE_DIR / "chroma_db")))

TOP_K = 8
SIMILARITY_THRESHOLD = 0.3  # chunks below this score are discarded

_model: Optional[SentenceTransformer] = None
_client: Optional[chromadb.PersistentClient] = None
_collection = None


# ---------------------------------------------------------------------------
# Lazy singletons — load once, reuse across requests
# ---------------------------------------------------------------------------

def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _get_collection():
    global _client, _collection
    if _collection is None:
        if not CHROMA_DIR.exists():
            return None
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        try:
            _collection = _client.get_collection("yukti_knowledge_base")
        except Exception:
            return None
    return _collection


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def retrieve(
    query: str,
    pathway: str = "",
    institution: str = "",
) -> list[dict]:
    """
    Retrieve the top-K most relevant chunks for a clinical query.

    Args:
        query:       The physician's question.
        pathway:     Clinical pathway filter (e.g. "epl"). Optional.
        institution: Institution ID filter (e.g. "memorial"). Optional.

    Returns:
        List of dicts with keys: text, score, source_filename, source_type,
        institution, pathways, date_ingested.
        Returns [] if no chunks meet the similarity threshold.
    """
    collection = _get_collection()
    if collection is None:
        return []

    model = _get_model()
    query_embedding = model.encode(query).tolist()

    # Build optional where filter
    where_clauses = []
    if pathway:
        where_clauses.append({f"pathway_{pathway}": {"$eq": "true"}})
    if institution:
        where_clauses.append(
            {
                "$or": [
                    {"institution": {"$eq": institution}},
                    {"institution": {"$eq": ""}},  # national guidelines have no institution
                ]
            }
        )

    where = None
    if len(where_clauses) == 1:
        where = where_clauses[0]
    elif len(where_clauses) > 1:
        where = {"$and": where_clauses}

    query_kwargs = dict(
        query_embeddings=[query_embedding],
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
    )
    if where:
        query_kwargs["where"] = where

    try:
        results = collection.query(**query_kwargs)
    except Exception:
        # Collection may be empty or filter matched nothing — fall back to unfiltered
        try:
            query_kwargs.pop("where", None)
            results = collection.query(**query_kwargs)
        except Exception:
            return []

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    # ChromaDB cosine distance → similarity: similarity = 1 - distance
    chunks = []
    for text, meta, distance in zip(documents, metadatas, distances):
        similarity = 1.0 - distance
        if meta is None:
            continue
        if similarity < SIMILARITY_THRESHOLD:
            continue
        chunks.append(
            {
                "text": text,
                "score": round(similarity, 4),
                "source_filename": meta.get("source_filename", ""),
                "source_type": meta.get("source_type", ""),
                "institution": meta.get("institution", ""),
                "pathways": meta.get("pathways", ""),
                "date_ingested": meta.get("date_ingested", ""),
                "superseded": meta.get("superseded", False),
            }
        )

    # Sort descending by score (ChromaDB returns ascending distance)
    chunks.sort(key=lambda c: c["score"], reverse=True)
    # Prefer non-superseded; fall back to superseded if nothing else available
    non_superseded = [c for c in chunks if not c["superseded"]]
    return non_superseded if non_superseded else chunks
