"""Define the configurable parameters for the agent."""

from __future__ import annotations
import os
from dataclasses import dataclass, field, fields
from typing import Annotated

from . import prompts


@dataclass(kw_only=True)
class Context:

    system_prompt: str = field(
        default=prompts.SYSTEM_PROMPT,
        metadata={
            "description": "The system prompt to use for the agent's interactions. "
            "This prompt sets the context and behavior for the agent."
        },
    )

    model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="openai/gpt-4o-mini",
        metadata={
            "description": (
                "The language model to use. "
                "Use 'openai/gpt-4o-mini' for OpenAI API (fast, cheap), "
                "'openrouter/<model>' for OpenRouter API, "
                "or 'local' for bundled Phi-3 GGUF model."
            )
        },
    )

    rag_k: int = field(
        default=4,
        metadata={
            "description": "Number of RAG chunks to retrieve for VinFast spec queries."
        },
    )

    max_search_results: int = field(
        default=5,
        metadata={
            "description": "Maximum number of DuckDuckGo review results to return."
        },
    )

    def __post_init__(self) -> None:
        # fetch env vari
        for f in fields(self):
            if not f.init:
                continue
            if getattr(self, f.name) == f.default:
                setattr(self, f.name, os.environ.get(f.name.upper(), f.default))
