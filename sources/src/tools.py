from langchain_core.tools import tool

@tool
def get_current_time(location: str) -> str:
    """A simple tool to get the current time (mocked for skeleton)."""
    return f"The current time in {location} is 12:00 PM."

def get_tools():
    """Return a list of tools available to the agent."""
    return [get_current_time]
