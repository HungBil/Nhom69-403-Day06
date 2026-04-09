"""Custom Starlette app that serves static frontend and data files.

Mounted via langgraph.json  →  http.app = "./src/react_agent/webapp.py:app"
"""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

_ROOT = Path(__file__).resolve().parent.parent.parent
_FEEDBACK_DIR = _ROOT / "data_vf" / "data" / "feedbacks"
_FEEDBACK_FILE = _FEEDBACK_DIR / "feedback.json"


def _load_feedback_entries() -> list[dict]:
    if not _FEEDBACK_FILE.exists():
        return []

    raw = _FEEDBACK_FILE.read_text(encoding="utf-8").strip()
    if not raw:
        return []

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []

    if isinstance(data, list):
        return data
    return []


def _save_feedback_entries(entries: list[dict]) -> None:
    _FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    _FEEDBACK_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _append_feedback_entry(record: dict) -> None:
    records = _load_feedback_entries()
    records.append(record)
    _save_feedback_entries(records)


async def save_feedback(request: Request) -> JSONResponse:
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(
            {"error": "Payload phải là JSON hợp lệ."},
            status_code=400,
        )

    if not isinstance(payload, dict):
        return JSONResponse(
            {"error": "Dữ liệu gửi lên phải là object JSON."},
            status_code=400,
        )

    user_id = str(payload.get("user_id", "")).strip()
    stars = payload.get("stars")
    feedback = str(payload.get("feedback", "")).strip()
    thread_id = payload.get("thread_id")

    if not user_id:
        return JSONResponse({"error": "Thiếu user_id."}, status_code=400)

    if isinstance(stars, bool) or not isinstance(stars, int) or stars < 1 or stars > 5:
        return JSONResponse(
            {"error": "stars phải là số nguyên từ 1 đến 5."},
            status_code=400,
        )

    if not feedback:
        return JSONResponse({"error": "Thiếu nội dung feedback."}, status_code=400)

    record = {
        "user_id": user_id,
        "stars": stars,
        "feedback": feedback,
        "thread_id": str(thread_id).strip() if thread_id else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await asyncio.to_thread(_append_feedback_entry, record)

    return JSONResponse({"ok": True, "feedback": record}, status_code=201)

app = Starlette(
    routes=[
        # Save user feedback JSON into data_vf/data/feedbacks/feedback.json
        Route("/feedbacks", save_feedback, methods=["POST"]),
        # Serve chatbot UI:  /static/chatbot.html
        Mount("/static", StaticFiles(directory=str(_ROOT / "static"), html=True)),
        # Serve GLB 3D models:  /data_vf/models/vinfast_vf9.glb
        Mount("/data_vf", StaticFiles(directory=str(_ROOT / "data_vf"))),
    ],
)
