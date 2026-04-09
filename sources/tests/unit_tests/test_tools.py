"""Unit tests for the Car Showroom 3D tools."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from react_agent.tools import _is_vinfast_query, _VINFAST_GLB_MAP, load_3d_model

pytestmark = pytest.mark.anyio

# ---------------------------------------------------------------------------
# _is_vinfast_query
# ---------------------------------------------------------------------------

def test_is_vinfast_query_positive() -> None:
    assert _is_vinfast_query("VinFast VF 9 specs") is True
    assert _is_vinfast_query("vf3 battery range") is True
    assert _is_vinfast_query("show me VF 9") is True
    assert _is_vinfast_query("Lux A2.0 engine") is True


def test_is_vinfast_query_negative() -> None:
    assert _is_vinfast_query("Toyota Camry 2024") is False
    assert _is_vinfast_query("Honda Civic review") is False


# ---------------------------------------------------------------------------
# load_3d_model (sync tool)
# ---------------------------------------------------------------------------

def test_load_3d_model_vf9() -> None:
    result = json.loads(load_3d_model.invoke({"model_name": "VinFast VF 9"}))
    assert result["available"] is True
    assert result["glb_filename"] == "vinfast_vf9.glb"
    assert result["viewer_url"] == "/static/index.html?model=vinfast_vf9"


def test_load_3d_model_vf3() -> None:
    result = json.loads(load_3d_model.invoke({"model_name": "VF 3"}))
    assert result["available"] is True
    assert result["glb_filename"] == "vinfast_vf3.glb"


def test_load_3d_model_lux() -> None:
    result = json.loads(load_3d_model.invoke({"model_name": "Lux A2.0"}))
    assert result["available"] is True
    assert result["glb_filename"] == "vinfast_lux.glb"


def test_load_3d_model_unknown() -> None:
    result = json.loads(load_3d_model.invoke({"model_name": "Tesla Model S"}))
    assert result["available"] is False
    assert "error" in result


# ---------------------------------------------------------------------------
# get_car_specs – VinFast path (RAG mocked)
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_get_car_specs_vinfast_json_hit() -> None:
    """When a VinFast model is queried, JSON lookup should succeed."""
    from react_agent.tools import get_car_specs

    result = await get_car_specs.ainvoke({"query": "VinFast VF 9"})
    assert "VF 9" in result or "vf 9" in result.lower()
    assert "kW" in result or "hp" in result or "Electric" in result


@pytest.mark.anyio
async def test_get_car_specs_nhtsa_error_handled() -> None:
    """NHTSA errors should be caught and return a friendly message."""
    from react_agent.tools import get_car_specs

    with patch("react_agent.tools.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.get = AsyncMock(side_effect=Exception("connection refused"))
        result = await get_car_specs.ainvoke({"query": "Toyota Camry"})
    assert "error" in result.lower() or "⚠️" in result


# ---------------------------------------------------------------------------
# search_review – DuckDuckGo mocked
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_search_review_returns_results() -> None:
    from react_agent.tools import search_review

    fake_results = [
        {"title": "VinFast VF 9 Review", "href": "https://example.com/1", "body": "Great EV."},
        {"title": "VF 9 vs Tesla", "href": "https://example.com/2", "body": "Good range."},
    ]

    mock_ddgs = MagicMock()
    mock_ddgs.__enter__ = MagicMock(return_value=mock_ddgs)
    mock_ddgs.__exit__ = MagicMock(return_value=False)
    mock_ddgs.text = MagicMock(return_value=fake_results)

    with patch("react_agent.tools.DDGS", return_value=mock_ddgs, create=True):
        # Patch the lazy import inside search_review
        import sys
        mock_module = MagicMock()
        mock_module.DDGS = lambda: mock_ddgs
        sys.modules.setdefault("duckduckgo_search", mock_module)

        result = await search_review.ainvoke({"query": "VinFast VF 9 review 2025"})

    assert "VinFast VF 9" in result or "review" in result.lower() or "🔎" in result


@pytest.mark.anyio
async def test_search_review_handles_exception() -> None:
    from react_agent.tools import search_review
    import sys

    mock_module = MagicMock()
    mock_module.DDGS = MagicMock(side_effect=Exception("network error"))
    sys.modules["duckduckgo_search"] = mock_module

    result = await search_review.ainvoke({"query": "some car"})
    assert "⚠️" in result or "error" in result.lower()
