from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import MarkdownHeaderTextSplitter

_BASE = Path(__file__).parent.parent.parent
DATA_DIR = _BASE / "data_vf" / "data"
SPECS_MD = DATA_DIR / "vinfast_specs.md"
SPECS_JSON = DATA_DIR / "vinfast_spec.json"
FAISS_INDEX_DIR = DATA_DIR / "faiss_index"

EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


@lru_cache(maxsize=1)
def get_vinfast_vectorstore() -> FAISS:
    embeddings = _get_embeddings()

    if FAISS_INDEX_DIR.exists():
        return FAISS.load_local(
            str(FAISS_INDEX_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )

    raw_text = SPECS_MD.read_text(encoding="utf-8")

    splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#", "section"),
            ("##", "subsection"),
            ("###", "subsubsection"),
        ],
        strip_headers=False,
    )
    docs = splitter.split_text(raw_text)

    for doc in docs:
        doc.metadata["source"] = "vinfast_specs.md"

    vectorstore = FAISS.from_documents(docs, embeddings)
    FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(FAISS_INDEX_DIR))
    return vectorstore


def _sync_similarity_search(query: str, k: int = 4) -> List[Any]:
    vs = get_vinfast_vectorstore()
    return vs.similarity_search(query, k=k)


def query_vinfast_rag(query: str, k: int = 4) -> str:
    results = _sync_similarity_search(query, k)
    chunks = [
        f"[{doc.metadata.get('subsection', doc.metadata.get('section', ''))}]\n{doc.page_content}"
        for doc in results
    ]
    return "\n\n---\n\n".join(chunks)


async def query_vinfast_rag_async(query: str, k: int = 4) -> str:
    import asyncio

    results = await asyncio.to_thread(_sync_similarity_search, query, k)
    chunks = [
        f"[{doc.metadata.get('subsection', doc.metadata.get('section', ''))}]\n{doc.page_content}"
        for doc in results
    ]
    return "\n\n---\n\n".join(chunks)


# ── JSON data helpers ────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_vinfast_json() -> Dict[str, Any]:
    with open(SPECS_JSON, encoding="utf-8") as f:
        return json.load(f)


def get_all_models() -> List[Dict[str, Any]]:
    """Return full enriched list of all VinFast models."""
    return _load_vinfast_json().get("models", [])


def query_vinfast_json(model_name: str) -> Optional[Dict[str, Any]]:
    """Find a model by name (fuzzy match). Returns full enriched dict."""
    needle = model_name.lower()
    for m in get_all_models():
        if needle in m["name"].lower() or m["name"].lower() in needle:
            return m
    return None


def list_vinfast_models() -> List[str]:
    return [m["name"] for m in get_all_models()]


def format_price_vnd(price: int) -> str:
    """Format integer price to Vietnamese string, e.g. 315000000 → '315.000.000 VNĐ'."""
    s = f"{price:,}".replace(",", ".")
    return f"{s} VNĐ"


def recommend_by_need(
    *,
    budget: Optional[int] = None,
    use_case: Optional[str] = None,
    seats: Optional[int] = None,
    fuel_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Score & rank models by how well they match the user's needs.

    Returns list of dicts sorted by match_score descending. Each dict
    contains: model data + ``match_score`` (0-100) + ``match_reasons``.
    """
    models = get_all_models()
    scored: List[Dict[str, Any]] = []

    # Keyword mapping for use_case → decision_tags
    _NEED_TAG_MAP: Dict[str, List[str]] = {
        "đô thị": ["city_driving", "easy_parking", "compact"],
        "nội đô": ["city_driving", "easy_parking", "compact"],
        "thành phố": ["city_driving", "easy_parking"],
        "đi làm": ["city_driving", "business", "comfort"],
        "gia đình": ["family", "spacious", "7_seats"],
        "đường dài": ["long_trip", "highway"],
        "đi tỉnh": ["long_trip", "highway", "versatile"],
        "đi xa": ["long_trip", "highway"],
        "liên tỉnh": ["long_trip", "highway"],
        "du lịch": ["long_trip", "versatile"],
        "cao cấp": ["premium", "luxury"],
        "sang trọng": ["premium", "luxury"],
        "tiết kiệm": ["budget_low", "electric"],
        "rẻ": ["budget_low"],
        "địa hình": ["offroad_light", "suv", "versatile"],
        "người mới": ["beginner_friendly", "easy_parking"],
        "suv": ["suv", "family", "versatile"],
        "sedan": ["sedan", "comfort", "business"],
        "điện": ["electric"],
        "xăng": ["gasoline"],
    }

    for m in models:
        score = 0
        reasons: List[str] = []
        tags = set(m.get("decision_tags", []))
        price = m.get("specs", {}).get("price_vnd", 0)
        m_seats = m.get("specs", {}).get("seating", 0)
        if isinstance(m_seats, str):
            # "6 hoặc 7 chỗ" → take max
            import re
            nums = re.findall(r"\d+", m_seats)
            m_seats = max(int(n) for n in nums) if nums else 0

        # Budget match
        if budget is not None and price > 0:
            if price <= budget:
                score += 30
                reasons.append(f"Trong ngân sách ({format_price_vnd(price)})")
            elif price <= budget * 1.15:
                score += 10
                reasons.append(f"Hơi vượt ngân sách ({format_price_vnd(price)}, cao hơn ~{round((price/budget-1)*100)}%)")
            elif price <= budget * 1.5:
                score -= 20
                reasons.append(f"Vượt ngân sách đáng kể ({format_price_vnd(price)}, cao hơn ~{round((price/budget-1)*100)}%)")
            else:
                score -= 50
                reasons.append(f"Vượt ngân sách rất nhiều ({format_price_vnd(price)}, cao hơn ~{round((price/budget-1)*100)}%)")

        # Use case tag match
        if use_case:
            need_lower = use_case.lower()
            matched_tags: set[str] = set()
            for keyword, tag_list in _NEED_TAG_MAP.items():
                if keyword in need_lower:
                    matched_tags.update(tag_list)
            overlap = tags & matched_tags
            if overlap:
                score += len(overlap) * 10
                reasons.append(f"Phù hợp nhu cầu: {use_case}")
            # Also check use_case field directly
            for uc in m.get("use_case", []):
                if any(kw in uc for kw in need_lower.split()):
                    score += 8
                    reasons.append(f"Use case khớp: {uc}")
                    break

        # Seats match
        if seats is not None and m_seats > 0:
            if m_seats >= seats:
                score += 15
                reasons.append(f"Đủ chỗ ngồi ({m_seats} chỗ)")
            else:
                score -= 15
                reasons.append(f"Không đủ chỗ ({m_seats} < {seats})")

        # Fuel type match
        if fuel_type:
            m_fuel = m.get("fuel_type", "").lower()
            if fuel_type.lower() in m_fuel:
                score += 20
                reasons.append(f"Đúng loại nhiên liệu: {m['fuel_type']}")
            else:
                score -= 25
                reasons.append(f"Sai loại nhiên liệu (xe {m['fuel_type']}, khách muốn {fuel_type})")

        scored.append({**m, "match_score": score, "match_reasons": reasons})

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored
