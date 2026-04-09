"""Utility & helper functions."""

from __future__ import annotations

import json
import os
import re
import uuid
from pathlib import Path
from typing import Any, Iterator, List, Optional, Sequence

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.outputs import ChatGeneration, ChatResult

_REPO_ROOT = Path(__file__).parent.parent.parent
_DEFAULT_GGUF = str(_REPO_ROOT / "models" / "Phi-3-mini-4k-instruct-q4.gguf")


def get_message_text(msg: BaseMessage) -> str:
    content = msg.content
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        return content.get("text", "")
    else:
        txts = [c if isinstance(c, str) else (c.get("text") or "") for c in content]
        return "".join(txts).strip()


class LocalLlamaChatModel(BaseChatModel):
    model_path: str
    n_ctx: int = 4096
    n_gpu_layers: int = 0
    n_threads: int = 4
    temperature: float = 0.1
    max_tokens: int = 1024
    verbose: bool = False

    _llm: Any = None

    class Config:
        arbitrary_types_allowed = True

    def _get_llm(self) -> Any:
        if self._llm is None:
            from llama_cpp import Llama  # noqa: PLC0415
            object.__setattr__(self, "_llm", Llama(
                model_path=self.model_path,
                n_ctx=self.n_ctx,
                n_gpu_layers=self.n_gpu_layers,
                n_threads=self.n_threads,
                verbose=self.verbose,
            ))
        return self._llm

    @property
    def _llm_type(self) -> str:
        return "local-llama-cpp"

    def _messages_to_prompt(self, messages: List[BaseMessage], tools: Optional[List[Any]] = None) -> str:
        parts: List[str] = []

        tool_schema_text = ""
        if tools:
            schemas = []
            for t in tools:
                if hasattr(t, "name") and hasattr(t, "description"):
                    schema = {
                        "name": t.name,
                        "description": t.description,
                        "parameters": getattr(t, "args_schema", {}).schema() if hasattr(t, "args_schema") else {},
                    }
                    schemas.append(schema)
            if schemas:
                tool_schema_text = (
                    "\n\nYou have access to the following tools. "
                    "To call a tool, respond with a JSON block like:\n"
                    '{"tool": "<tool_name>", "tool_input": {<args>}}\n\n'
                    "Available tools:\n"
                    + json.dumps(schemas, ensure_ascii=False, indent=2)
                )

        for msg in messages:
            content = get_message_text(msg)

            if isinstance(msg, SystemMessage):
                parts.append(f"<|system|>\n{content}{tool_schema_text}<|end|>")
            elif isinstance(msg, HumanMessage):
                parts.append(f"<|user|>\n{content}<|end|>")
            elif isinstance(msg, AIMessage):
                if msg.tool_calls:
                    tc = msg.tool_calls[0]
                    call_text = json.dumps({"tool": tc["name"], "tool_input": tc["args"]})
                    parts.append(f"<|assistant|>\n{call_text}<|end|>")
                else:
                    parts.append(f"<|assistant|>\n{content}<|end|>")
            elif isinstance(msg, ToolMessage):
                parts.append(f"<|user|>\nTool result for {msg.name}:\n{content}<|end|>")

        parts.append("<|assistant|>")
        return "\n".join(parts)

    def _parse_tool_call(self, text: str) -> Optional[dict]:
        pattern = r'\{[^{}]*"tool"\s*:\s*"[^"]+"\s*,[^{}]*"tool_input"\s*:\s*\{[^}]*\}[^{}]*\}'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        try:
            data = json.loads(text.strip())
            if "tool" in data and "tool_input" in data:
                return data
        except json.JSONDecodeError:
            pass
        return None

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        llm = self._get_llm()
        tools = kwargs.get("tools") or getattr(self, "_bound_tools", None)
        prompt = self._messages_to_prompt(messages, tools=tools)

        output = llm(
            prompt,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stop=stop or ["<|end|>", "<|user|>", "<|system|>"],
            echo=False,
        )
        raw_text: str = output["choices"][0]["text"].strip()

        tool_call_data = self._parse_tool_call(raw_text)
        if tool_call_data:
            tool_name = tool_call_data["tool"]
            tool_input = tool_call_data.get("tool_input", {})
            call_id = f"call_{uuid.uuid4().hex[:8]}"
            ai_msg = AIMessage(
                content="",
                tool_calls=[{
                    "name": tool_name,
                    "args": tool_input,
                    "id": call_id,
                    "type": "tool_call",
                }],
            )
        else:
            ai_msg = AIMessage(content=raw_text)

        return ChatResult(generations=[ChatGeneration(message=ai_msg)])

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self._generate(messages, stop=stop, **kwargs)
        )

    def bind_tools(self, tools: Sequence[Any], **kwargs: Any) -> "LocalLlamaChatModel":
        clone = self.copy()
        object.__setattr__(clone, "_bound_tools", list(tools))
        return clone
    

def load_chat_model(fully_specified_name: str) -> BaseChatModel:
    provider, _, model_id = fully_specified_name.partition("/")

    if provider == "local":
        return _load_local_gguf(model_id or _DEFAULT_GGUF)

    if provider == "openrouter":
        return _load_openrouter_model(model_id)

    if provider == "openai":
        return _load_openai_model(model_id)

    from langchain.chat_models import init_chat_model
    return init_chat_model(model_id, model_provider=provider)


def _load_openai_model(model_id: str) -> BaseChatModel:
    from langchain_openai import ChatOpenAI

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required.")

    return ChatOpenAI(
        model=model_id,
        api_key=api_key,
        temperature=0.1,
        max_tokens=1024,
    )


def _load_openrouter_model(model_id: str) -> BaseChatModel:
    from langchain_openai import ChatOpenAI  # noqa: PLC0415

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable is required for OpenRouter models."
        )

    return ChatOpenAI(
        model=model_id,
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:2024",
            "X-Title": "Car Showroom 3D Agent",
        },
        temperature=0.1,
        max_tokens=1024,
    )



def _load_local_gguf(model_path: str) -> LocalLlamaChatModel:
    path = Path(model_path)
    if not path.is_absolute():
        path = _REPO_ROOT / path

    if not path.exists():
        raise FileNotFoundError(
            f"GGUF model file not found: {path}\n"
            "Please ensure the file exists or update Context.model, "
            "e.g. 'local/models/your-model.gguf'."
        )

    return LocalLlamaChatModel(
        model_path=str(path),
        n_ctx=4096,
        n_gpu_layers=0,
        n_threads=os.cpu_count() or 4,
        temperature=0.1,
        max_tokens=1024,
        verbose=False,
    )
