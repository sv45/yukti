"""
One-time script: mark all acog_epl_150 chunks as superseded by acog_epl_200.

Usage:
    cd server
    python scripts/mark_superseded.py [--dry-run]
"""

import argparse
from pathlib import Path
import chromadb

BASE_DIR = Path(__file__).parent.parent / "knowledge_base"
CHROMA_DIR = BASE_DIR / "chroma_db"


def main(dry_run: bool = False):
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_collection("yukti_knowledge_base")

    # Fetch all chunks (no n_results limit — use large number or paginate)
    all_results = collection.get(include=["metadatas"])
    ids = all_results["ids"]
    metadatas = all_results["metadatas"]

    target_ids = []
    target_metadatas = []

    for chunk_id, meta in zip(ids, metadatas):
        if "acog_epl_150" in meta.get("source_filename", ""):
            updated_meta = {**meta, "superseded": True, "superseded_by": "acog_epl_200"}
            target_ids.append(chunk_id)
            target_metadatas.append(updated_meta)

    print(f"Found {len(target_ids)} chunks from acog_epl_150.")

    if not target_ids:
        print("Nothing to update.")
        return

    if dry_run:
        print("[DRY RUN] Would update these IDs:")
        for i in target_ids:
            print(f"  {i}")
        return

    collection.update(ids=target_ids, metadatas=target_metadatas)
    print(f"Updated {len(target_ids)} chunks with superseded=True, superseded_by=acog_epl_200.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
