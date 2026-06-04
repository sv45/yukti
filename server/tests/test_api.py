"""
API endpoint tests for Yukti backend.
Run with: cd server && pytest tests/test_api.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

client = TestClient(app)


# ── Health ────────────────────────────────────────────────────────────────────

def test_health_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["app"] == "Yukti"


# ── Abortion status ───────────────────────────────────────────────────────────

def test_abortion_status_known_state():
    response = client.get("/api/abortion-status?state=CO")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "state" in data
    assert data["state"] == "CO"


def test_abortion_status_unknown_state_returns_404():
    response = client.get("/api/abortion-status?state=XX")
    assert response.status_code == 404


def test_abortion_status_missing_param_returns_422():
    response = client.get("/api/abortion-status")
    assert response.status_code == 422


# ── Management guidance ───────────────────────────────────────────────────────

def test_management_guidance_expectant():
    with patch("main.retrieve") as mock_retrieve:
        mock_retrieve.return_value = []
        response = client.get("/api/management-guidance?type=expectant")
        assert response.status_code == 200


def test_management_guidance_medical():
    with patch("main.retrieve") as mock_retrieve:
        mock_retrieve.return_value = []
        response = client.get("/api/management-guidance?type=medical")
        assert response.status_code == 200


def test_management_guidance_invalid_type():
    response = client.get("/api/management-guidance?type=invalid")
    assert response.status_code == 400


# ── Chat endpoint ─────────────────────────────────────────────────────────────

def test_chat_returns_response_structure():
    mock_chunks = [
        {
            "text": "Early pregnancy loss is defined as a nonviable intrauterine pregnancy.",
            "score": 0.85,
            "source_filename": "acog_epl_200.pdf",
            "source_type": "national_guideline",
            "institution": "",
            "pathways": "epl",
            "date_ingested": "2026-01-01",
            "superseded": False,
        }
    ]
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text="Early pregnancy loss occurs in 10% of pregnancies.")]

    with patch("main.retrieve", return_value=mock_chunks), \
         patch("main.anthropic.Anthropic") as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_message
        response = client.post("/api/chat", json={
            "message": "What is early pregnancy loss?",
            "context": "",
            "pathway": "epl",
            "institution": "",
        })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)


def test_chat_missing_message_returns_422():
    response = client.post("/api/chat", json={"context": ""})
    assert response.status_code == 422


def test_chat_returns_no_context_message_when_no_chunks():
    with patch("main.retrieve", return_value=[]):
        response = client.post("/api/chat", json={
            "message": "xyzzy nonsense query that matches nothing",
            "context": "",
            "pathway": "",
            "institution": "",
        })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    # Should return the no-context fallback message
    assert len(data["response"]) > 0


# ── US interpretation ─────────────────────────────────────────────────────────

def test_interpret_us_returns_classification():
    # Full response matching USInterpretResponse schema
    full_json = '{"raw_fields": {"gestational_sac": "present", "msd_mm": 30.0, "yolk_sac": "absent", "embryo": "absent", "crl_mm": null, "cardiac_activity": null, "free_fluid": "none", "adnexal_findings": null, "endometrial_stripe_mm": null}, "classification": {"impression_key": "definitive-epl", "category": "Definitive EPL", "criteria": ["MSD ≥25mm without embryo"]}}'
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=full_json)]

    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}), \
         patch("main.retrieve", return_value=[]), \
         patch("main.anthropic.Anthropic") as mock_anthropic:
        mock_anthropic.return_value.messages.create.return_value = mock_message
        response = client.post("/api/interpret-us", json={
            "report": "MSD 30mm, no embryo identified, no yolk sac."
        })
    assert response.status_code == 200
    data = response.json()
    assert "classification" in data
    assert data["classification"]["impression_key"] == "definitive-epl"


def test_interpret_us_missing_report_returns_422():
    response = client.post("/api/interpret-us", json={})
    assert response.status_code == 422
