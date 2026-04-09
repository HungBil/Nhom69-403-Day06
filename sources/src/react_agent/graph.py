from datetime import UTC, datetime
from typing import Dict, List, Literal, cast
import asyncio
import logging

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.runtime import Runtime

from react_agent.context import Context
from react_agent.state import InputState, State
from react_agent.tools import TOOLS
from react_agent.utils import get_message_text, load_chat_model
from react_agent.summarizer import summarize_and_save

logger = logging.getLogger(__name__)


def _normalize_messages(messages: List[BaseMessage]) -> List[BaseMessage]:
    normalized = []
    for msg in messages:
        if not isinstance(msg.content, str):
            flat = get_message_text(msg)
            if isinstance(msg, ToolMessage):
                msg = ToolMessage(
                    content=flat,
                    tool_call_id=msg.tool_call_id,
                    name=getattr(msg, "name", None),
                )
            else:
                msg = msg.copy(update={"content": flat})
        normalized.append(msg)
    return normalized


async def call_model(
    state: State, runtime: Runtime[Context]
) -> Dict[str, List[AIMessage]]:
    # return dict
    model = load_chat_model(runtime.context.model).bind_tools(TOOLS)

    system_message = runtime.context.system_prompt.format(
        system_time=datetime.now(tz=UTC).isoformat()
    )

    normalized = _normalize_messages(list(state.messages))

    response = cast(
        AIMessage,
        await model.ainvoke(
            [{"role": "system", "content": system_message}, *normalized]
        ),
    )

    if state.is_last_step and response.tool_calls:
        return {
            "messages": [
                AIMessage(
                    id=response.id,
                    content="Sorry, I could not find an answer to your question in the specified number of steps.",
                )
            ]
        }

    return {"messages": [response]}


# denfine graph
builder = StateGraph(State, input_schema=InputState, context_schema=Context)

builder.add_node(call_model)
builder.add_node("tools", ToolNode(TOOLS))


async def trigger_summary(messages: list, thread_id: str | None = None) -> None:
    try:
        path = await summarize_and_save(messages, thread_id=thread_id)
        logger.info("Conversation summary saved → %s", path)
    except ValueError as e:
        logger.debug("Skip summary: %s", e)
    except Exception as e:
        logger.warning("Summarizer error (non-fatal): %s", e)


async def save_summary(state: State) -> Dict:
    thread_id: str | None = None
    for msg in state.messages:
        if isinstance(msg, HumanMessage):
            thread_id = getattr(msg, "id", None) or None
            break

    # Fire-and-forget: không await để không block stream
    asyncio.create_task(
        trigger_summary(list(state.messages), thread_id=thread_id)
    )
    return {}


builder.add_node("save_summary", save_summary)

builder.add_edge("__start__", "call_model")


def route_model_output(state: State) -> Literal["save_summary", "tools"]:
    last_message = state.messages[-1]
    if not isinstance(last_message, AIMessage):
        raise ValueError(
            f"Expected AIMessage in output edges, but got {type(last_message).__name__}"
        )
    if not last_message.tool_calls:
        return "save_summary"
    return "tools"


builder.add_conditional_edges("call_model", route_model_output)
builder.add_edge("tools", "call_model")
builder.add_edge("save_summary", END)

graph = builder.compile(name="Car Showroom")
