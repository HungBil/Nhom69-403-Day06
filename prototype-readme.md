# Prototype — VinFast AI Car Advisor (Nhom69-403)

## Mô tả
Chatbot AI đóng vai "Vivi" — nhân viên tư vấn showroom VinFast. Hỏi 4–5 câu về nhu cầu khách hàng (ngân sách, mục đích sử dụng, số chỗ, loại nhiên liệu) và trả về top 2–3 dòng xe phù hợp kèm bảng so sánh, ưu nhược điểm, và link xem mô hình 3D tương tác.

## Level: Working prototype (Option C — bonus)
- **Giao diện:** Webapp tích hợp chat widget + 3D viewer (Three.js)
- **Backend AI:** LangGraph ReAct Agent (2 nodes + ToolNode)
- **Model:** GPT-4o-mini (tư vấn) + GPT-4.1-mini (summarizer)
- **Knowledge Base:** Structured JSON + FAISS RAG (MiniLM-L6-v2 embeddings)
- **3D Models:** Three.js viewer cho VF 3, VF 9, Lux (files `.glb`)

## Kiến trúc Agent

```
User → call_model (GPT-4o-mini + System Prompt "Vivi")
         ├──[has tool_calls]──→ ToolNode (3 tools) → call_model (loop)
         └──[no tool_calls]──→ save_summary (GPT-4.1-mini) → END
```

### 3 Tools

| Tool | Chức năng | Khi nào dùng |
|------|-----------|-------------|
| `get_car_specs(query)` | Tra cứu thông số kỹ thuật, ưu/nhược điểm, đối tượng phù hợp. JSON exact match → fallback RAG | Khách hỏi về 1 mẫu xe cụ thể |
| `load_3d_model(model_name)` | Trả link Three.js viewer 3D tương tác | Khách muốn xem hình ảnh/mô hình xe |
| `calculate_car_match(budget, use_case, seats, fuel_type)` | Scoring & ranking tất cả xe theo nhu cầu. Trả bảng xếp hạng + phân tích chi tiết | Khách mô tả nhu cầu, cần gợi ý xe phù hợp |

### Summarizer Agent (Node thứ 2)
- Fire-and-forget sau khi AI trả lời xong
- Tóm tắt hội thoại: xe đề cập, nhu cầu khách, đánh giá chất lượng tư vấn, dữ liệu training tiềm năng
- Lưu file `.md` vào `data_vf/data/context/` → Data Flywheel

## Showroom: 4 dòng xe

| Dòng xe | Phân khúc | Loại | 3D Model |
|---------|-----------|------|:--------:|
| VF 3 | Mini car | Điện | ✅ |
| VF 9 | SUV hạng E | Điện | ✅ |
| Lux A2.0 | Sedan hạng D | Xăng | ✅ |
| Lux SA2.0 | SUV hạng D | Xăng | ✅ (chung Lux) |

## Links
- **Source code:** Thư mục `src/react_agent/` (graph.py, tools.py, rag.py, prompts.py, summarizer.py)
- **Data:** `data_vf/data/vinfast_spec.json` + `vinfast_specs.md` + FAISS index
- **3D Models:** `data_vf/models/` (vinfast_vf3.glb, vinfast_vf9.glb, vinfast_lux.glb)
- **Run local:** `langgraph dev --no-reload` hoặc `python run_server.py`
- **Demo URL:** `http://127.0.0.1:2024/static/vinfast/vinfast-about.html`

## Tools & API
- **Framework:** LangGraph + LangChain
- **LLM API:** OpenAI API (gpt-4o-mini cho tư vấn, gpt-4.1-mini cho summarizer)
- **Embeddings:** HuggingFace sentence-transformers/all-MiniLM-L6-v2
- **Vector Store:** FAISS (local)
- **UI:** Starlette + HTML/CSS/JS + Three.js (3D viewer)
- **Prompt Engineering:** System prompt "Vivi" với persona, rules, constraints, behavior (xem `prompts.py`)

## Phân công

| Thành viên | MSSV | Phần đảm nhiệm | Output |
|-----------|------|-----------------|--------|
| Nguyễn Đông Hưng | 2A202600392 | Canvas + Problem Statement, DevOps Setup | `spec-final.md` phần 1, environment setup |
| Lưu Lương Vi Nhân | 2A202600120 | User Stories 4 paths, Prompt Engineering | `spec-final.md` phần 2, `prompts.py` |
| Khuất Văn Vương | 2A202600087 | Eval metrics + ROI, Failure modes + Mini AI Spec | `spec-final.md` phần 3–6 |
| Huỳnh Văn Nghĩa | 2A202600085 | Frontend prototype + 3D viewer + Agent code | `graph.py`, `tools.py`, `rag.py`, `chatbot.html`, `index.html` |
