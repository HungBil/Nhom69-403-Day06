"""
File name pattern:
    <thread_id>_<YYYYMMDD_HHMMSS>.md
"""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI

_REPO_ROOT = Path(__file__).parent.parent.parent
CONTEXT_DIR = _REPO_ROOT / "data_vf" / "data" / "context"
CONTEXT_DIR.mkdir(parents=True, exist_ok=True)

_SUMMARY_SYSTEM = """\
Bạn là trợ lý AI chuyên phân tích và tóm tắt hội thoại bán xe VinFast.

Nhiệm vụ:
1. Tóm tắt ngắn gọn nội dung cuộc hội thoại (ai hỏi gì, bot trả lời gì).
2. Liệt kê các xe VinFast được đề cập và thông tin khách quan tâm.
3. Xác định nhu cầu / insight của khách hàng (ngân sách, mục đích, ưu tiên).
4. Đánh giá chất lượng tư vấn (bot có dùng đúng tool không, trả lời có chính xác không).
5. Ghi rõ các điểm cần cải thiện hoặc câu hỏi chưa được trả lời.

Trả về định dạng Markdown theo cấu trúc sau (giữ nguyên các heading):

## Tóm tắt hội thoại
...

## Xe được đề cập
...

## Nhu cầu khách hàng
...

## Đánh giá chất lượng tư vấn
...

## Điểm cần cải thiện
...

## Dữ liệu training tiềm năng
(Liệt kê các cặp Q&A chất lượng cao có thể dùng để fine-tune, định dạng:
- **Q:** ...
  **A:** ...)
"""


def _build_conversation_text(messages: List[AnyMessage]) -> str:
    lines: List[str] = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            content = msg.content if isinstance(msg.content, str) else str(msg.content)
            lines.append(f"[KHÁCH] {content}")
        elif isinstance(msg, AIMessage):
            if msg.tool_calls:
                for tc in msg.tool_calls:
                    lines.append(f"[BOT → TOOL] {tc['name']}({tc['args']})")
            else:
                content = msg.content if isinstance(msg.content, str) else str(msg.content)
                if content.strip():
                    lines.append(f"[BOT] {content}")
        elif isinstance(msg, ToolMessage):
            content = msg.content if isinstance(msg.content, str) else str(msg.content)
            short = content[:400] + ("…" if len(content) > 400 else "")
            lines.append(f"[TOOL RESULT: {getattr(msg, 'name', '?')}] {short}")
    return "\n".join(lines)


def _get_summary_model() -> ChatOpenAI:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY chưa được set trong môi trường.")
    return ChatOpenAI(
        model="gpt-4.1-mini",
        api_key=api_key,
        temperature=0.2,
        max_tokens=2048,
    )


async def summarize_and_save(
    messages: List[AnyMessage],
    thread_id: Optional[str] = None,
) -> Path:
    human_msgs = [m for m in messages if isinstance(m, HumanMessage)]
    if len(human_msgs) < 2:
        # Không đủ nội dung để tóm tắt
        raise ValueError("Hội thoại quá ngắn (< 2 tin nhắn từ khách), bỏ qua tóm tắt.")

    conversation_text = _build_conversation_text(messages)
    model = _get_summary_model()

    summary_response = await model.ainvoke(
        [
            {"role": "system", "content": _SUMMARY_SYSTEM},
            {
                "role": "user",
                "content": (
                    "Hãy phân tích và tóm tắt hội thoại sau:\n\n"
                    "---\n"
                    f"{conversation_text}\n"
                    "---"
                ),
            },
        ]
    )

    summary_text: str = (
        summary_response.content
        if isinstance(summary_response.content, str)
        else str(summary_response.content)
    )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_thread = (thread_id or "unknown").replace("/", "-").replace("\\", "-")[:40]
    filename = f"{safe_thread}_{timestamp}.md"
    output_path = CONTEXT_DIR / filename

    header = (
        f"# Conversation Summary\n\n"
        f"- **Thread ID:** `{thread_id or 'unknown'}`\n"
        f"- **Thời gian:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"- **Số tin nhắn:** {len(messages)} "
        f"(khách: {len(human_msgs)}, "
        f"bot: {len([m for m in messages if isinstance(m, AIMessage)])})\n\n"
        "---\n\n"
    )

    raw_section = (
        "\n\n---\n\n"
        "## Nội dung hội thoại gốc\n\n"
        "```\n"
        f"{conversation_text}\n"
        "```\n"
    )

    output_path.write_text(
        header + summary_text + raw_section,
        encoding="utf-8",
    )

    return output_path
