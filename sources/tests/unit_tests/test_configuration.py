import os

from react_agent.context import Context


def test_context_default_model() -> None:
    """Default model should be 'local' (local GGUF)."""
    context = Context()
    # env override may change it; check against possible env value
    expected = os.environ.get("MODEL", "local")
    assert context.model == expected


def test_context_explicit_local_model() -> None:
    """Passing an explicit local path should be preserved."""
    context = Context(model="local/models/Phi-3-mini-4k-instruct-q4.gguf")
    assert context.model == "local/models/Phi-3-mini-4k-instruct-q4.gguf"


def test_context_init_with_env_vars() -> None:
    """MODEL env var should override the default."""
    os.environ["MODEL"] = "local/models/custom.gguf"
    context = Context()
    assert context.model == "local/models/custom.gguf"
    del os.environ["MODEL"]


def test_context_init_env_overridden_by_arg() -> None:
    """Explicit arg should win over env var."""
    os.environ["MODEL"] = "local/models/from-env.gguf"
    context = Context(model="local/models/explicit.gguf")
    assert context.model == "local/models/explicit.gguf"
    del os.environ["MODEL"]


def test_context_rag_k_default() -> None:
    assert Context().rag_k == int(os.environ.get("RAG_K", 4))


def test_context_max_search_results_default() -> None:
    assert Context().max_search_results == int(
        os.environ.get("MAX_SEARCH_RESULTS", 5)
    )
