from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONTEXT_DIR = BASE_DIR / "data_vf" / "data" / "context"
DEFAULT_FAISS_DIR = BASE_DIR / "data_vf" / "data" / "faiss_context_index"
DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def iter_markdown_files(context_dir: Path) -> List[Path]:
    return sorted([p for p in context_dir.glob("*.md") if p.is_file()])


def parse_filename_metadata(file_name: str) -> Dict[str, str]:
    stem = Path(file_name).stem
    parts = stem.rsplit("_", maxsplit=2)
    if len(parts) == 3:
        thread_id, date_part, time_part = parts
        return {
            "thread_id": thread_id,
            "timestamp": f"{date_part}_{time_part}",
        }
    return {
        "thread_id": "unknown",
        "timestamp": "unknown",
    }


def chunk_text(text: str, max_chars: int = 900, overlap: int = 120) -> List[str]:
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        candidate = para if not current else f"{current}\n\n{para}"
        if len(candidate) <= max_chars:
            current = candidate
            continue

        if current:
            chunks.append(current)

        if len(para) <= max_chars:
            current = para
            continue

        start = 0
        while start < len(para):
            end = start + max_chars
            piece = para[start:end]
            if piece:
                chunks.append(piece)
            if end >= len(para):
                break
            start = end - overlap
        current = ""

    if current:
        chunks.append(current)

    return chunks


def build_records(
    files: List[Path],
    chunk_size: int,
    chunk_overlap: int,
) -> Tuple[List[Tuple[str, str, Dict[str, str | int]]], int]:
    records: List[Tuple[str, str, Dict[str, str | int]]] = []
    total_chunks = 0

    for file_path in files:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        chunks = chunk_text(content, max_chars=chunk_size, overlap=chunk_overlap)
        if not chunks:
            continue

        file_meta = parse_filename_metadata(file_path.name)

        for idx, chunk in enumerate(chunks):
            raw_id = f"{file_path.name}:{idx}"
            doc_id = hashlib.md5(raw_id.encode("utf-8")).hexdigest()
            metadata: Dict[str, str | int] = {
                "source": file_path.name,
                "source_path": str(file_path),
                "chunk_index": idx,
                **file_meta,
            }
            records.append((doc_id, chunk, metadata))
            total_chunks += 1

    return records, total_chunks


def _get_embeddings(model_name: str) -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def ingest_context_to_faiss(
    context_dir: Path,
    faiss_dir: Path,
    model_name: str,
    chunk_size: int,
    chunk_overlap: int,
) -> None:
    if not context_dir.exists():
        raise FileNotFoundError(f"Khong tim thay thu muc context: {context_dir}")

    files = iter_markdown_files(context_dir)
    if not files:
        raise FileNotFoundError(f"Khong tim thay file .md trong: {context_dir}")

    records, total_chunks = build_records(
        files=files,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    if not records:
        print("Khong co du lieu de index.")
        return

    print(f"Dang tai model embedding: {model_name}")
    embeddings = _get_embeddings(model_name)

    if faiss_dir.exists():
        vectorstore = FAISS.load_local(
            str(faiss_dir),
            embeddings,
            allow_dangerous_deserialization=True,
        )
        existing_ids = set(vectorstore.docstore._dict.keys())
    else:
        vectorstore = None
        existing_ids = set()

    seen = set()
    texts: List[str] = []
    metadatas: List[Dict[str, str | int]] = []
    ids: List[str] = []

    for doc_id, text, metadata in records:
        if doc_id in existing_ids or doc_id in seen:
            continue
        seen.add(doc_id)
        ids.append(doc_id)
        texts.append(text)
        metadatas.append(metadata)

    skipped_count = len(records) - len(ids)
    if not ids:
        print(f"Tat ca {len(records)} chunks da ton tai trong FAISS index. Bo qua add.")
        return

    print(
        f"Tim thay {len(files)} file, tao {total_chunks} chunks. "
        f"Trung ID: {skipped_count}. Dang add {len(ids)} chunks vao FAISS index: {faiss_dir}"
    )

    if vectorstore is None:
        vectorstore = FAISS.from_texts(texts, embeddings, metadatas=metadatas, ids=ids)
    else:
        vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)

    faiss_dir.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(faiss_dir))
    print("Hoan tat ingest context summaries len FAISS.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Day context summaries (.md) len FAISS voi embedding all-MiniLM-L6-v2"
    )
    parser.add_argument(
        "--context-dir",
        type=Path,
        default=DEFAULT_CONTEXT_DIR,
        help="Thu muc chua cac file summary markdown",
    )
    parser.add_argument(
        "--faiss-dir",
        type=Path,
        default=DEFAULT_FAISS_DIR,
        help="Thu muc luu FAISS index",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL_NAME,
        help="Ten model sentence-transformers",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=900,
        help="So ky tu toi da cho moi chunk",
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=120,
        help="So ky tu overlap giua cac chunk",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ingest_context_to_faiss(
        context_dir=args.context_dir,
        faiss_dir=args.faiss_dir,
        model_name=args.model,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
    )


if __name__ == "__main__":
    main()
