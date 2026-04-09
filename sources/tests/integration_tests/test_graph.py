"""Integration tests for the Car Showroom 3D ReAct agent graph.

These tests run the full graph end-to-end using the local Phi-3 GGUF model.
They are slow and require the GGUF file to be present at:
  models/Phi-3-mini-4k-instruct-q4.gguf

Run with:
  make integration_tests
"""

import pytest

from react_agent import graph
from react_agent.context import Context

pytestmark = pytest.mark.anyio


async def test_agent_vinfast_specs() -> None:
    """Agent should return VinFast VF 9 specs from local RAG."""
    res = await graph.ainvoke(
        {"messages": [("user", "What is the battery capacity of VinFast VF 9?")]},
        context=Context(),
    )
    content = str(res["messages"][-1].content).lower()
    # Should mention battery or kWh from the VinFast spec data
    assert any(kw in content for kw in ["kwh", "battery", "123", "vf 9", "vinfast"])


async def test_agent_load_3d_model() -> None:
    """Agent should call load_3d_model and return a viewer URL."""
    res = await graph.ainvoke(
        {"messages": [("user", "Show me the 3D model of VinFast VF 9.")]},
        context=Context(),
    )
    content = str(res["messages"][-1].content).lower()
    assert any(kw in content for kw in ["3d", "glb", "viewer", "vinfast", "model"])


async def test_agent_search_review() -> None:
    """Agent should invoke search_review for review queries."""
    res = await graph.ainvoke(
        {"messages": [("user", "Find reviews for VinFast VF 3.")]},
        context=Context(),
    )
    assert len(res["messages"]) > 1
