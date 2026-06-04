"""
Knowledge base retrieval tests for Yukti.
Run with: cd server && pytest tests/test_retrieve.py -v
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from knowledge_base.retrieve import retrieve


# ── Basic retrieval ───────────────────────────────────────────────────────────

def test_retrieve_returns_list():
    results = retrieve("early pregnancy loss management")
    assert isinstance(results, list)


def test_retrieve_nonempty_for_clinical_query():
    results = retrieve("early pregnancy loss miscarriage management")
    assert len(results) > 0, "Should find at least one chunk for a core clinical query"


def test_retrieve_result_has_required_fields():
    results = retrieve("medication abortion mifepristone")
    assert len(results) > 0
    chunk = results[0]
    assert "text" in chunk
    assert "score" in chunk
    assert "source_filename" in chunk
    assert isinstance(chunk["score"], float)
    assert 0 <= chunk["score"] <= 1


def test_retrieve_scores_sorted_descending():
    results = retrieve("ectopic pregnancy management")
    if len(results) > 1:
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True), "Results should be sorted by score descending"


def test_retrieve_filters_below_threshold():
    results = retrieve("xyzzy nonsense gibberish not a real query zzz")
    # Should return empty or very low scores — gibberish should not match anything
    for chunk in results:
        assert chunk["score"] >= 0.3, "All returned chunks should meet the similarity threshold"


# ── Pathway filtering ─────────────────────────────────────────────────────────

def test_retrieve_with_epl_pathway():
    results = retrieve("nonviable pregnancy criteria", pathway="epl")
    assert isinstance(results, list)
    # All results should have the epl pathway flag
    for chunk in results:
        assert chunk.get("pathways", "")  # should have some pathway info


def test_retrieve_with_mab_pathway():
    results = retrieve("mifepristone misoprostol regimen", pathway="mab")
    assert isinstance(results, list)


def test_retrieve_with_ectopic_pathway():
    results = retrieve("methotrexate ectopic pregnancy treatment", pathway="ectopic")
    assert isinstance(results, list)
    assert len(results) > 0, "Should find ectopic-relevant chunks"


# ── Clinical relevance spot-checks ────────────────────────────────────────────

def test_epl_query_returns_acog_source():
    results = retrieve("early pregnancy loss diagnosis criteria SRU 2013")
    sources = [r["source_filename"] for r in results]
    has_relevant = any("acog" in s.lower() or "doubilet" in s.lower() or "epl" in s.lower() for s in sources)
    assert has_relevant, f"Expected ACOG or SRU source for EPL query, got: {sources}"


def test_ectopic_query_returns_relevant_source():
    results = retrieve("ectopic pregnancy OB/GYN consultation emergent")
    assert len(results) > 0
    sources = [r["source_filename"] for r in results]
    has_relevant = any("ectopic" in s.lower() or "acog" in s.lower() or "access" in s.lower() for s in sources)
    assert has_relevant, f"Expected ectopic-relevant source, got: {sources}"
