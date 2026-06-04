"""
Ingest MAB (Medication Abortion) documents into the Yukti ChromaDB knowledge base.

Documents:
  - Goldberg 2022 (Obstet Gynecol): local PDF with optional PMC fallback
  - ACCESS-Bridge MAB in the ED 2026: fetched PDF, cached locally

Usage:
    cd server && python scripts/ingest_mab_docs.py

For Goldberg 2022, place the PDF at:
    server/knowledge_base/documents/goldberg_2022_pul_mab.pdf
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
DOCS_DIR = SERVER_DIR / "knowledge_base" / "documents"

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
        "doc_id": "goldberg_2022_pul",
        "local_path": DOCS_DIR / "goldberg_2022_pul_mab.pdf",
        "pmc_doi": "10.1097/AOG.0000000000004756",
        "type": "pdf_local_or_pmc",
        "metadata": {"pathway": "mab", "source": "goldberg_2022"},
    },
    {
        "doc_id": "access_bridge_mab_ed_2026",
        "url": "https://bridgetotreatment.org/wp-content/uploads/Medication-Abortion-MAB-in-the-Emergency-Department-2026.pdf",
        "local_path": DOCS_DIR / "access_bridge_mab_ed_2026.pdf",
        "type": "pdf_fetch_and_cache",
        "metadata": {"pathway": "mab", "source": "access_bridge"},
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
def fetch_url(url: str, timeout: int = 60) -> bytes:
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout) as resp:
        return resp.read()


def lookup_pmcid(doi: str) -> str | None:
    """Return a PMCID for the given DOI, or None if not found."""
    url = f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids={doi}&format=json"
    try:
        raw = fetch_url(url, timeout=15)
        import json
        data = json.loads(raw)
        for record in data.get("records", []):
            pmcid = record.get("pmcid")
            if pmcid:
                return pmcid
    except Exception:
        pass
    return None


def extract_pdf_bytes(raw: bytes) -> str:
    reader = PdfReader(io.BytesIO(raw))
    pages = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            pages.append(t)
    return "\n".join(pages)


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------
def extract_text(doc: dict, log: logging.Logger) -> str:
    if doc["type"] == "pdf_local_or_pmc":
        local_path: Path = doc["local_path"]

        # Option 1: local file present
        if local_path.exists():
            log.info("  Reading local PDF: %s", local_path)
            raw = local_path.read_bytes()
            return extract_pdf_bytes(raw)

        # Option 2: PMC fallback
        doi = doc.get("pmc_doi")
        if doi:
            log.info("  Local PDF not found; checking PMC for DOI %s ...", doi)
            pmcid = lookup_pmcid(doi)
            if pmcid:
                pmc_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
                log.info("  Found PMCID %s — fetching full text HTML ...", pmcid)
                raw = fetch_url(pmc_url)
                html = raw.decode("utf-8", errors="ignore")
                return extract_html_text(html)
            else:
                log.warning("  No PMCID found for DOI %s.", doi)

        raise FileNotFoundError(
            f"Local PDF missing: {local_path}  "
            f"Place the Goldberg 2022 PDF there and re-run."
        )

    elif doc["type"] == "pdf_fetch_and_cache":
        local_path: Path = doc["local_path"]

        if local_path.exists():
            log.info("  Cache hit: %s", local_path)
            raw = local_path.read_bytes()
        else:
            log.info("  Fetching PDF from URL: %s", doc["url"])
            raw = fetch_url(doc["url"], timeout=60)
            DOCS_DIR.mkdir(parents=True, exist_ok=True)
            local_path.write_bytes(raw)
            log.info("  Saved to %s", local_path)

        return extract_pdf_bytes(raw)

    else:
        raise ValueError(f"Unknown doc type: {doc['type']}")


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
        log.info("Processing: %s  (type=%s)", doc["doc_id"], doc["type"])
        try:
            text = extract_text(doc, log)
        except Exception as e:
            log.warning("  SKIPPED %s — %s", doc["doc_id"], e)
            continue

        if not text.strip():
            log.warning("  SKIPPED %s — no text extracted", doc["doc_id"])
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
