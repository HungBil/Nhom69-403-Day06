import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from .tools import get_tools

def build_agent():
    """Builds and returns the LangGraph ReAct Agent."""
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    tools = get_tools()
    
    # Create a prebuilt ReAct agent
    agent_executor = create_react_agent(llm, tools)
    return agent_executor

def run_agent(user_input: str) -> str:
    """Helper function to run the agent with a single user turn."""
    agent = build_agent()
    # Invoke the agent directly with messages
    result = agent.invoke({"messages": [HumanMessage(content=user_input)]})
    
    # Extract the last message from the result
    messages = result.get("messages", [])
    if messages:
        return messages[-1].content
    return "I couldn't generate a response."
