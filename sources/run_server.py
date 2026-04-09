"""Local dev server that serves both the chatbot frontend and the LangGraph API.

Usage:
    python run_server.py
"""

import os
import sys
from pathlib import Path

import uvicorn
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

# ── Ensure project root is on sys.path ──────────────────────────────
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# Load .env
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

# ── Import the LangGraph graph to verify it loads ────────────────────
from react_agent.graph import graph  # noqa: F401

# ── Build the Starlette app ──────────────────────────────────────────

def homepage(_request):
    return RedirectResponse(url="/static/chatbot.html")


app = Starlette(
    routes=[
        Route("/", homepage),
        Mount("/static", StaticFiles(directory=str(ROOT / "static"), html=True)),
        Mount("/data_vf", StaticFiles(directory=str(ROOT / "data_vf"))),
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"\n🚀  Chatbot frontend: http://127.0.0.1:{port}/static/chatbot.html")
    print(f"📚  3D Viewer:        http://127.0.0.1:{port}/static/index.html")
    print()
    uvicorn.run(app, host="127.0.0.1", port=port)
