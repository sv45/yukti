"""
Ingest REMS-specific documents into the Yukti ChromaDB knowledge base.

Bypasses ingest.py's VALID_PATHWAYS restriction so 'rems' pathway can be used.

Usage:
    cd server && python scripts/ingest_rems_docs.py
"""

import io
import logging
import re
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

import certifi
import chromadb
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPTS_DIR = Path(__file__).parent
SERVER_DIR = SCRIPTS_DIR.parent
CHROMA_DIR = SERVER_DIR / "knowledge_base" / "chroma_db"

# ---------------------------------------------------------------------------
# Chunking config (matches ingest.py)
# ---------------------------------------------------------------------------
CHUNK_WORDS = 500
OVERLAP_WORDS = 50

# ---------------------------------------------------------------------------
# Documents to ingest
# ---------------------------------------------------------------------------
DOCUMENTS = [
    {
        "doc_id": "fda_mifepristone_info_page",
        "url": "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/information-about-mifepristone-medical-termination-pregnancy-through-ten-weeks-gestation",
        "type": "html",
        "metadata": {"pathway": "rems", "source": "fda"},
    },
    {
        "doc_id": "fda_mifepristone_full_rems_2023",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/rems/Mifepristone_2023_03_23_REMS_Full.pdf",
        "type": "pdf",
        "metadata": {"pathway": "rems", "source": "fda", "type": "full-rems-document"},
    },
    {
        "doc_id": "fda_genbiopro_prescriber_agreement_2025",
        "url": "https://www.accessdata.fda.gov/drugsatfda_docs/rems/Mifepristone_2025_09_30_Prescriber_Agreement_Form_for_GenBioPro_Inc.pdf",
        "type": "pdf",
        "metadata": {"pathway": "rems", "source": "fda", "type": "prescriber-agreement-form"},
    },
    {
        "doc_id": "acog_updated_mifepristone_rems_2023",
        "url": "https://www.acog.org/clinical/clinical-guidance/practice-advisory/articles/2023/01/updated-mifepristone-rems-requirements",
        "type": "html",
        "metadata": {"pathway": "rems", "source": "acog"},
    },
]

# ---------------------------------------------------------------------------
# HTML stripping
# ---------------------------------------------------------------------------
_SKIP_TAGS = {"script", "style", "nav", "header", "footer"}


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self.parts.append(text)


def extract_html_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    return " ".join(parser.parts)


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------
def fetch_url(url: str) -> bytes:
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
        return resp.read()


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------
def extract_text(doc: dict) -> str:
    raw = fetch_url(doc["url"])
    if doc["type"] == "pdf":
        reader = PdfReader(io.BytesIO(raw))
        pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages.append(t)
        return "\n".join(pages)
    else:
        html = raw.decode("utf-8", errors="ignore")
        return extract_html_text(html)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
def chunk_text(text: str) -> list[str]:
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
# Main
# ---------------------------------------------------------------------------
def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    log = logging.getLogger(__name__)

    log.info("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection(
        name="yukti_knowledge_base",
        metadata={"hnsw:space": "cosine"},
    )

    date_ingested = datetime.now(timezone.utc).isoformat()
    total_chunks = 0

    for doc in DOCUMENTS:
        log.info("Fetching: %s  (%s)", doc["doc_id"], doc["url"])
        try:
            text = extract_text(doc)
        except Exception as e:
            log.warning("  SKIPPED %s — %s", doc["doc_id"], e)
            continue

        chunks = chunk_text(text)
        log.info("  %d chunks", len(chunks))

        embeddings = model.encode(chunks, show_progress_bar=False).tolist()

        ids = [f"{doc['doc_id']}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {**doc["metadata"], "doc_id": doc["doc_id"], "chunk_index": i, "date_ingested": date_ingested}
            for i in range(len(chunks))
        ]

        collection.upsert(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
        log.info("  Stored in ChromaDB.")
        total_chunks += len(chunks)

    log.info("\nIngestion complete. Total chunks stored: %d", total_chunks)


if __name__ == "__main__":
    main()
