from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from langchain_core.tools import tool

from react_agent.rag import (
    format_price_vnd,
    list_vinfast_models,
    query_vinfast_json,
    query_vinfast_rag_async,
    recommend_by_need,
)

_REPO_ROOT = Path(__file__).parent.parent.parent
MODELS_DIR = _REPO_ROOT / "data_vf" / "models"

_VINFAST_GLB_MAP: Dict[str, str] = {
    "vf 3": "vinfast_vf3.glb",
    "vf3": "vinfast_vf3.glb",
    "vf 9": "vinfast_vf9.glb",
    "vf9": "vinfast_vf9.glb",
    "lux a2": "vinfast_lux.glb",
    "lux sa2": "vinfast_lux.glb",
    "lux": "vinfast_lux.glb",
}


@tool
async def get_car_specs(query: str) -> str:
    """Tra cứu thông số kỹ thuật, ưu nhược điểm, đối tượng phù hợp của xe VinFast.

    Dùng khi khách hỏi về 1 mẫu xe cụ thể (VF 3, VF 9, Lux A2, Lux SA2).
    Trả về đầy đủ: thông số, ưu/nhược điểm, use_case, đối tượng, reasoning.
    """
    exact = query_vinfast_json(query)
    if exact:
        specs = exact["specs"]
        price = specs.get("price_vnd", 0)
        lines = [
            f"**{exact['name']}** ({exact['segment']} – {exact['engine_type']})",
            "",
            "📋 **Thông số kỹ thuật:**",
        ]
        for k, v in specs.items():
            if k == "price_vnd":
                lines.append(f"- **Giá**: {format_price_vnd(v)}")
            else:
                lines.append(f"- **{k}**: {v}")

        lines.append(f"\n🎯 **Phù hợp cho:** {', '.join(exact.get('use_case', []))}")
        lines.append(f"💰 **Mức ngân sách:** {exact.get('budget_level', 'N/A')}")
        lines.append(f"⚡ **Chi phí vận hành:** {exact.get('operating_cost', 'N/A')}")

        lines.append("\n✅ **Ưu điểm:**")
        for p in exact.get("pros", []):
            lines.append(f"- {p}")

        lines.append("\n❌ **Nhược điểm:**")
        for c in exact.get("cons", []):
            lines.append(f"- {c}")

        lines.append(f"\n👤 **Đối tượng phù hợp:** {', '.join(exact.get('target_user', []))}")
        lines.append(f"\n💡 **Nhận xét:** {exact.get('reasoning', '')}")

        return "\n".join(lines)

    # Fallback: RAG search
    rag_result = await query_vinfast_rag_async(query, k=4)
    if rag_result.strip():
        return f"Kết quả tìm kiếm VinFast cho: *{query}*\n\n{rag_result}"

    return (
        f"Hiện tại mình đang tập trung tư vấn các dòng xe VinFast và dữ liệu có sẵn trong hệ thống. "
        f"Các mẫu xe hiện có: {', '.join(list_vinfast_models())}. "
        f"Mình cũng đang cố gắng cập nhật thêm kiến thức để hỗ trợ bạn tốt hơn trong tương lai."
    )


@tool
def load_3d_model(model_name: str) -> str:
    """Tải mô hình 3D xe VinFast. Trả về JSON với đường dẫn GLB và URL viewer.

    Dùng khi khách muốn xem xe, xem 3D, xem hình ảnh mô hình xe.
    """
    needle = model_name.lower().strip()

    glb_filename: Optional[str] = None
    for key, filename in _VINFAST_GLB_MAP.items():
        if key in needle:
            glb_filename = filename
            break

    if glb_filename is None:
        return json.dumps(
            {
                "available": False,
                "error": (
                    f"Không tìm thấy mô hình 3D cho '{model_name}'. "
                    "Các mẫu có 3D: VinFast VF 3, VinFast VF 9, VinFast Lux."
                ),
            },
            ensure_ascii=False,
        )

    glb_path = MODELS_DIR / glb_filename
    viewer_slug = glb_filename.replace(".glb", "")
    viewer_url = f"/static/index.html?model={viewer_slug}"

    return json.dumps(
        {
            "available": True,
            "model_name": model_name,
            "glb_filename": glb_filename,
            "glb_path": str(glb_path),
            "viewer_url": viewer_url,
            "instructions": (
                f"Mở {viewer_url} trong trình duyệt để xem mô hình 3D tương tác. "
                f"Three.js viewer sẽ tải {glb_filename} tự động."
            ),
        },
        ensure_ascii=False,
        indent=2,
    )


@tool
def calculate_car_match(
    budget: Optional[int] = None,
    use_case: Optional[str] = None,
    seats: Optional[int] = None,
    fuel_type: Optional[str] = None,
) -> str:
    """Tính toán mức độ phù hợp của các dòng xe VinFast với nhu cầu khách hàng.

    Dùng khi khách mô tả nhu cầu (ngân sách, mục đích, số chỗ, loại nhiên liệu)
    và cần gợi ý xe phù hợp nhất. Trả về bảng xếp hạng + phân tích chi tiết.

    Args:
        budget: Ngân sách tối đa (VNĐ), ví dụ 500000000 (500 triệu).
        use_case: Mục đích sử dụng, ví dụ "đi làm nội đô", "gia đình đi du lịch".
        seats: Số chỗ ngồi tối thiểu cần, ví dụ 5, 7.
        fuel_type: Loại nhiên liệu ưu tiên: "điện" hoặc "xăng".
    """
    results = recommend_by_need(
        budget=budget,
        use_case=use_case,
        seats=seats,
        fuel_type=fuel_type,
    )

    lines = ["🏆 **Kết quả phân tích mức độ phù hợp:**\n"]

    for i, m in enumerate(results, 1):
        score = m["match_score"]
        price = m.get("specs", {}).get("price_vnd", 0)
        medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."

        score_display = max(score, 0)
        over_budget = budget is not None and price > 0 and price > budget
        budget_tag = " ⚠️ vượt ngân sách" if over_budget else ""

        lines.append(f"{medal} **{m['name']}** — Điểm phù hợp: **{score_display}/100**{budget_tag}")
        lines.append(f"   Phân khúc: {m['segment']} | Giá: {format_price_vnd(price) if price else 'N/A'}")

        reasons = m.get("match_reasons", [])
        if reasons:
            for r in reasons:
                lines.append(f"   • {r}")

        lines.append(f"   💡 {m.get('reasoning', '')}")
        lines.append("")

    def _in_budget(m: dict) -> bool:
        return budget is None or m.get("specs", {}).get("price_vnd", 0) <= budget

    def _right_fuel(m: dict) -> bool:
        return fuel_type is None or fuel_type.lower() in m.get("fuel_type", "").lower()

    # Ưu tiên 1: đúng fuel + trong ngân sách
    best = next((m for m in results if _in_budget(m) and _right_fuel(m)), None)

    # Ưu tiên 2: đúng fuel nhưng vượt ngân sách
    if best is None:
        best = next((m for m in results if _right_fuel(m)), None)

    # Ưu tiên 3: trong ngân sách nhưng sai fuel
    if best is None:
        best = next((m for m in results if _in_budget(m)), None)

    # Fallback: cao điểm nhất
    if best is None:
        best = results[0] if results else None

    # Cảnh báo khi không có xe đúng fuel trong ngân sách
    no_match_fuel_budget = (
        fuel_type is not None
        and budget is not None
        and not any(_in_budget(m) and _right_fuel(m) for m in results)
    )
    if no_match_fuel_budget:
        fuel_models = [m for m in results if _right_fuel(m)]
        if fuel_models:
            cheapest = min(fuel_models, key=lambda m: m.get("specs", {}).get("price_vnd", 0))
            cheapest_price = cheapest.get("specs", {}).get("price_vnd", 0)
            lines.append(
                f"⚠️ **Lưu ý:** Hiện tại VinFast chưa có xe **{fuel_type}** nào trong ngân sách "
                f"{format_price_vnd(budget)} của bạn.\n"
                f"   Xe {fuel_type} rẻ nhất là **{cheapest['name']}** — {format_price_vnd(cheapest_price)} "
                f"(cao hơn ngân sách ~{round((cheapest_price/budget-1)*100)}%).\n"
                f"   Bạn có muốn **tăng ngân sách** hoặc **xem xét xe điện** không?"
            )
        else:
            lines.append(f"⚠️ Không có xe **{fuel_type}** nào trong hệ thống. Bạn có muốn xem xe điện không?")

    elif best and best["match_score"] > 0:
        over = not _in_budget(best)
        wrong_fuel = not _right_fuel(best)
        note = ""
        if over and wrong_fuel:
            note = " (lưu ý: vượt ngân sách và sai loại nhiên liệu)"
        elif over:
            note = " (lưu ý: vượt ngân sách của bạn)"
        elif wrong_fuel:
            note = f" (lưu ý: đây là xe {best.get('fuel_type', '')}, không phải {fuel_type})"
        lines.append(f"👉 **Gợi ý tốt nhất: {best['name']}** (điểm {max(best['match_score'], 0)}/100){note}")
    else:
        lines.append("⚠️ Không đủ thông tin để đánh giá. Bạn có thể cho mình biết thêm về ngân sách hoặc mục đích sử dụng?")

    return "\n".join(lines)


TOOLS: List[Callable[..., Any]] = [get_car_specs, load_3d_model, calculate_car_match]
