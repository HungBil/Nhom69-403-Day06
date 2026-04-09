#!/usr/bin/env python3
"""Pre-build the FAISS vector index for VinFast specs.

Run this script once after installation to create the FAISS index from
vinfast_specs.md. The graph will also build the index lazily on first use,
but running this script upfront avoids the delay on the first query.

Usage:
    python build_rag.py
    # or via make:
    make build-rag
"""

import sys
import time
from pathlib import Path

# Ensure the src package is importable when running from repo root
sys.path.insert(0, str(Path(__file__).parent / "src"))

from react_agent.rag import FAISS_INDEX_DIR, SPECS_MD, get_vinfast_vectorstore


def main() -> None:
    """Build (or rebuild) the FAISS index."""
    print("=" * 60)
    print("VinFast RAG Index Builder")
    print("=" * 60)

    if not SPECS_MD.exists():
        print(f"Source file not found: {SPECS_MD}")
        sys.exit(1)

    rebuild = FAISS_INDEX_DIR.exists()
    if rebuild:
        print(f"⚠️  Existing index found at {FAISS_INDEX_DIR}")
        answer = input("   Rebuild? [y/N] ").strip().lower()
        if answer != "y":
            print("Skipped.")
            return
        import shutil
        shutil.rmtree(FAISS_INDEX_DIR)
        print("   Removed old index.")

    print(f"\nSource : {SPECS_MD}")
    print(f"Target : {FAISS_INDEX_DIR}")
    print("\nBuilding index (downloading embedding model on first run)…\n")

    t0 = time.perf_counter()
    vs = get_vinfast_vectorstore()
    elapsed = time.perf_counter() - t0

    doc_count = vs.index.ntotal  # type: ignore[attr-defined]
    print(f"✅  Done!  {doc_count} vectors indexed in {elapsed:.1f}s")
    print(f"   Index saved to: {FAISS_INDEX_DIR}")
    print("\nYou can now start the agent with:  langgraph dev")


if __name__ == "__main__":
    main()
