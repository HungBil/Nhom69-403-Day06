# Nhom69-Lab6: AI Agent Chatbot

This repository contains the foundational skeleton for an AI Agent Chatbot using LangChain and LangGraph.

## Folder Structure

- `src/`: Core logic
  - `agent.py`: LangGraph implementation and bot logic.
  - `state.py`: Agent state types.
  - `tools.py`: Custom AI tools.
- `main.py`: Entry point for interacting with the chatbot.
- `requirements.txt`: Python package dependencies.
- `.env.example`: Template for environment variables.

## Getting Started

1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -e .
   ```
3. Set environment variables:
   Copy `.env.example` to `.env` and fill in your API keys (e.g., OPENAI_API_KEY).
4. Run the chatbot:
   ```bash
   langgraph dev
   ```
