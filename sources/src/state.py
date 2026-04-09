from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """The generic state of the agent in LangGraph."""
    messages: Annotated[Sequence[BaseMessage], operator.add]
