# SPEC — AI Product Hackathon

**Nhóm:** Nhom69-403
**Track:** ☑ VinFast · ☐ Vinmec · ☐ VinUni-VinSchool · ☐ XanhSM · ☐ Open
**Problem statement (1 câu):** *Khách cá nhân không biết chọn dòng xe VinFast nào phù hợp nhu cầu (gia đình 5 người, đi tỉnh, ngân sách 600tr), hiện phải đến showroom hoặc chờ chat với sale mất 15–30 phút. AI có thể hỏi 4–5 câu về nhu cầu và trả về top 2–3 gợi ý phù hợp kèm so sánh ngắn.*

---

## 1. AI Product Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | **User:** Khách cá nhân lần đầu tìm hiểu xe VinFast (chưa biết chọn dòng nào). **Pain:** Phải đến showroom hoặc chờ chat với sale, thời gian chờ 15–30 phút, sale có thể thiên vị dòng xe có hoa hồng cao. **AI giải:** Hỏi nhu cầu → gợi ý top 2–3 dòng xe phù hợp kèm so sánh nhanh (giá, số chỗ, quãng đường pin). Khách có bức tranh tổng quan trước khi quyết định bước tiếp theo. | **Khi AI sai:** Gợi ý dòng xe vượt ngân sách, hoặc xe 5 chỗ cho gia đình 7 người → khách mất thời gian tìm hiểu sai hướng, nhưng **không thiệt hại tài chính trực tiếp** (vì chưa mua). **User biết sai:** Khi đọc spec xe thấy không khớp nhu cầu (ít chỗ hơn, giá cao hơn budget). **User sửa:** Nhấn "Không phù hợp, tôi cần xe cho 7 người" → AI hỏi lại và gợi ý lại. Luôn có nút "Chat với tư vấn viên" để fallback. | **Cost:** ~$0.003–0.01/lượt (1 cuộc hội thoại 4–5 turn dùng GPT-4o-mini). **Latency:** <3 giây/response. **Risk:** (1) Dữ liệu giá xe thay đổi theo tháng — KB phải cập nhật; (2) Khách hỏi về tài chính (trả góp, lãi suất) → AI trả lời sai gây hiểu lầm pháp lý. |

### Automation hay Augmentation?
☑ **Augmentation** — AI gợi ý, khách hàng quyết định cuối cùng.

**Justify:** AI chỉ thu hẹp lựa chọn từ 4 dòng xe trong showroom xuống 2–3 dòng phù hợp. Quyết định mua xe là quyết định lớn (hàng trăm triệu VNĐ), khách cần lái thử và so sánh tại showroom. AI không thể và không nên thay thế bước đó. Nếu automation (AI tự đặt lịch mua xe) thì sai = thiệt hại tài chính rất lớn → **cost of reject = 0** (khách bỏ qua gợi ý AI không mất gì).

### Learning Signal

| # | Câu hỏi | Trả lời |
|---|---------|---------|
| 1 | User correction đi vào đâu? | Khi user nhấn "Không phù hợp" hoặc thay đổi tiêu chí → ghi lại cặp (input nhu cầu, xe bị reject) để cải thiện ranking algorithm. Summarizer Agent tự động tóm tắt hội thoại và lưu vào `data_vf/data/context/` sau mỗi session. |
| 2 | Product thu signal gì để biết tốt lên hay tệ đi? | (a) Tỷ lệ user nhấn "Xem chi tiết" / "Đặt lịch lái thử" sau gợi ý → positive signal; (b) Tỷ lệ user nhấn "Không phù hợp" hoặc thoát chat ngay sau gợi ý → negative signal; (c) Tỷ lệ user chuyển sang chat tư vấn viên → AI chưa đủ tin cậy |
| 3 | Data thuộc loại nào? | ☑ User-specific (nhu cầu mỗi người khác) · ☑ Domain-specific (catalog xe VinFast, giá, spec). **Marginal value cao** — data về nhu cầu thực tế của khách VinFast (ngân sách phổ biến, số người gia đình, quãng đường di chuyển) là data riêng mà model chung không có. Tích lũy đủ sẽ biết segment khách hàng nào cần dòng xe nào → marketing targeting chính xác hơn. |

---

## 2. User Stories — 4 paths

### Feature 1: Gợi ý xe VinFast theo nhu cầu

**Trigger:** Khách mở chatbot (widget hoặc trang `/static/chatbot.html`) → nhập nhu cầu (ngân sách, mục đích, số chỗ) → AI gọi `calculate_car_match` → trả top 2–3 gợi ý kèm so sánh.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy** — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | Khách hỏi "Tôi có gia đình 4 người, ngân sách khoảng 600 triệu, chủ yếu đi trong thành phố, muốn xe điện". AI gọi `calculate_car_match(budget=600000000, use_case="đi đô thị gia đình", seats=5, fuel_type="điện")` → gợi ý VF 3 (tiết kiệm, đi phố) và VF 9 (gia đình, rộng rãi nhưng vượt budget), kèm bảng so sánh giá/số chỗ/pin. Highlight tag "✓ Phù hợp ngân sách", "✓ Xe điện". Khách nhấn "Xem chi tiết VF 3" → AI gọi `get_car_specs("VF 3")` → trả specs + ưu nhược điểm. |
| **Low-confidence** — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Khách hỏi "Tôi muốn mua xe đẹp, giá hợp lý". "Đẹp" và "hợp lý" là tiêu chí chủ quan, AI không thể scoring. → AI hỏi lại: "Quý khách dùng xe chủ yếu để: Đi làm / Đi gia đình / Đi dịch vụ?" + "Ngân sách dự kiến: Dưới 500tr / 500–800tr / Trên 1 tỷ?" Sau 2–3 câu clarify, AI đủ thông tin để gọi `calculate_car_match`. Nếu vẫn không rõ → "Em chưa chắc chắn đủ để gợi ý chính xác. Quý khách có muốn [LIÊN HỆ TƯ VẤN VIÊN] không?" |
| **Failure** — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | Khách nói "Tôi cần xe 7 chỗ cho gia đình đông, ngân sách 500 triệu". AI gợi ý VF 9 (7 chỗ, ~1.5 tỷ) vì đúng số chỗ nhưng vượt budget 3 lần. → User nhìn giá trên card thấy ngay vượt budget. Nhấn "Không phù hợp — giá quá cao" → AI ghi nhận và gợi ý lại: "Hiện tại trong tầm giá 500tr, VinFast có VF 3 (4 chỗ). Dòng 7 chỗ giá thấp nhất hiện chưa có trong showroom. Quý khách có muốn điều chỉnh tiêu chí không?" Data cặp (yêu cầu, xe bị reject) được ghi vào correction log. |
| **Correction** — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Sau 2 lần nhấn "Không phù hợp" liên tiếp, AI tự nhận: "Có vẻ em chưa hiểu đúng nhu cầu. Quý khách có thể: 🧑‍💼 [LIÊN HỆ TƯ VẤN VIÊN] · 📞 Gọi hotline VinFast: 1900 23 23 89 · 📍 Tìm showroom gần nhất". Không bao giờ để user bị "treo" — luôn có ít nhất 1 exit path rõ ràng. Summarizer Agent lưu toàn bộ hội thoại + phân tích quality vào `data_vf/data/context/` để review offline. |

### Feature 2: Xem mô hình 3D xe VinFast

**Trigger:** Khách muốn xem xe → AI gọi `load_3d_model` → trả link Three.js viewer.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy** | User thấy gì? | Khách nói "Cho tôi xem xe VF 3 3D" → AI gọi `load_3d_model("VF 3")` → trả link `/static/index.html?model=vinfast_vf3` → khách mở viewer xoay/zoom mô hình 3D. |
| **Low-confidence** | Model nào? | Khách nói "Xem xe đi" mà chưa nói tên → AI hỏi: "Bạn muốn xem mô hình 3D xe nào? Hiện có: VF 3, VF 9, Lux." |
| **Failure** | Không có 3D | Khách hỏi xem 3D xe chưa có model → AI trả: "Hiện tại mô hình 3D chỉ có cho VF 3, VF 9, Lux. Bạn muốn xem mẫu nào?" |
| **Correction** | Sửa tên xe | Khách gõ "Ve ép 3" → AI nhận diện fuzzy match → gợi ý VF 3. |

---

## 3. Eval metrics + threshold

### Ưu tiên: Precision > Recall

**Tại sao Precision?** Gợi ý sai (xe vượt budget, sai số chỗ) sẽ khiến user mất tin ngay. Trong khi bỏ sót 1 dòng xe phù hợp (recall thấp) thì user ít nhận ra — vì user không biết catalog đầy đủ. **Sai nhầm đau hơn bỏ sót → ưu tiên precision.**

**Nếu chọn sai (recall-first)?** AI gợi ý quá nhiều xe, bao gồm xe không phù hợp, user phải tự lọc → giống đi showroom truyền thống, AI không thêm giá trị.

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| **Precision@3** — ground truth (review thủ công: mỗi gợi ý có khớp tất cả tiêu chí hard — ngân sách, số chỗ, loại nhiên liệu?) | ≥ 80% | <70% trong 1 tuần |
| **Rejection rate** — tỷ lệ user nhấn "Không phù hợp" / tổng gợi ý (proxy runtime cho precision) | ≤ 20% | >35% → gợi ý sai quá nhiều |
| **Click-through rate** — tỷ lệ user nhấn "Xem chi tiết" / "Đặt lịch lái thử" sau gợi ý | ≥ 40% | <15% sau 1 tháng → gợi ý không hữu ích |
| **Escalation rate** — tỷ lệ user chuyển sang chat tư vấn viên | ≤ 20% | >50% → AI chưa đủ tin cậy |
| **Session completion** — tỷ lệ user hoàn thành flow (từ câu hỏi đầu đến nhận gợi ý) | ≥ 70% | <50% → user bỏ giữa chừng |

### Qualitative eval (giai đoạn đầu)
- Review 50–100 cuộc hội thoại đầu tiên bằng mắt (từ file summary của Summarizer Agent)
- Phân loại lỗi: NLU hiểu sai intent / ranking sai / thiếu data xe / user hỏi ngoài scope
- Ưu tiên fix theo tần suất lỗi

---

## 4. Top 3 failure modes

> **"Failure mode nào user KHÔNG BIẾT bị sai? Đó là cái nguy hiểm nhất."**

| # | Trigger | Hậu quả | User biết? | Mitigation |
|---|---------|---------|:----------:|------------|
| 1 | **Câu hỏi mơ hồ:** "Xe nào tốt nhất?" | AI đoán lung tung, gợi ý không liên quan. User có thể tin gợi ý sai nếu chưa hiểu xe. | ⚠️ Có thể không biết | Hỏi lại bằng quick-reply trước khi gợi ý. System prompt: **không bao giờ đoán khi thiếu ≥2 tiêu chí bắt buộc** (ngân sách, mục đích sử dụng). Tool `calculate_car_match` sẽ trả điểm thấp nếu thiếu input. |
| 2 | **Ngân sách không khớp catalog:** User muốn 7 chỗ giá 400tr nhưng showroom không có dòng nào đáp ứng | AI im lặng hoặc gợi ý xe vượt budget rất xa — **user không biết** là showroom không có xe phù hợp | ❌ User KHÔNG biết | Trả lời thẳng: "Hiện tại VinFast chưa có xe 7 chỗ trong tầm giá 400tr. Dòng xe rộng rãi nhất trong hệ thống là VF 9 từ ~1.4 tỷ. Quý khách có muốn điều chỉnh tiêu chí không?" Nói rõ giới hạn catalog. |
| 3 | **Hỏi ngoài scope:** User hỏi về trả góp, lãi suất, bảo hiểm, so sánh với Toyota/Hyundai | AI trả lời sai thông tin tài chính, **gây hiểu lầm pháp lý** — user tin vì AI trả lời tự tin | ❌ User KHÔNG biết | System prompt chặn: "Thông tin trả góp/lãi suất phụ thuộc ngân hàng đối tác. Để được tư vấn chính xác, anh/chị vui lòng liên hệ showroom hoặc hotline." **Không bao giờ đưa con số lãi suất.** |

**Bổ sung (awareness):**

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 4 | **Data xe cũ:** Giá xe thay đổi theo campaign khuyến mãi, hoặc có dòng xe mới ra mắt | AI gợi ý giá cũ, user đến showroom thấy giá khác → mất tin | Hiện timestamp: "Giá cập nhật tháng 04/2026". Đặt lịch sync data từ trang chủ VinFast mỗi tuần. |
| 5 | **User cố tình phá:** Prompt injection, hỏi lặp lại, yêu cầu AI đóng vai nhân viên sale | AI bị khai thác hoặc nói sai thông tin | System prompt chặt: chỉ trả lời về catalog VinFast. Constraints cứng trong `prompts.py`. |

---

## 5. ROI 3 kịch bản

### Giả định chung
- Chi phí mỗi cuộc hội thoại AI: ~500 VNĐ (~$0.01–0.02 inference API + cloud hosting/database)
- Chi phí mỗi cuộc tư vấn bằng nhân viên sale: ~20.000 VNĐ (5–10 phút support ban đầu)
- Số lượt hỏi mua xe/tư vấn trên website VinFast: ước tính ~5.000 lượt/tháng

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Giả định** | 20% khách dùng AI, hỗ trợ thay sales 20% | 40% khách dùng AI, hỗ trợ thay sales 40% | 60% khách dùng AI, hỗ trợ thay sales 60% |
| **Lượt AI/tháng** | 1.000 | 2.000 | 3.000 |
| **Chi phí AI** | 500.000 VNĐ/tháng | 1.000.000 VNĐ/tháng | 1.500.000 VNĐ/tháng |
| **Giảm tải nhân viên** | 200 cuộc (4 triệu VNĐ) | 800 cuộc (16 triệu VNĐ) | 1.800 cuộc (36 triệu VNĐ) |
| **Net benefit** | **+3.5 triệu/tháng** | **+15 triệu/tháng** | **+34.5 triệu/tháng** |
| **Bonus** | — | Tăng tỷ lệ đặt lịch lái thử 10% | Data nhu cầu khách hàng → cải thiện marketing targeting |

### Kill criteria
- Nếu **escalation rate > 50%** sau 2 tháng liên tục → AI không đủ tin cậy, cần đánh giá lại NLU hoặc KB
- Nếu **click-through < 15%** sau 1 tháng → gợi ý không đủ chất lượng, dừng và review lại ranking logic
- Nếu **chi phí AI > chi phí nhân viên tương đương** (tức mất ý nghĩa tiết kiệm) → dừng scale, tối ưu cost

---

## 6. Mini AI Spec (1 trang)

### Scope
AI advisor **chỉ** tư vấn chọn dòng xe VinFast từ catalog hiện tại (4 dòng xe: VF 3, VF 9, Lux A2.0, Lux SA2.0). Không tư vấn tài chính (trả góp, lãi suất), không so sánh với thương hiệu khác, không đặt hàng/thanh toán.

### Input → Output
| | Mô tả |
|---|-------|
| **Input** | Nhu cầu user qua 4–5 câu hỏi: số người, mục đích sử dụng chính, ngân sách, ưu tiên (điện/xăng), quãng đường di chuyển chính |
| **Output** | Top 2–3 dòng xe phù hợp, mỗi xe hiện: tên, giá niêm yết, số chỗ, quãng đường pin, ưu/nhược điểm. Kèm link xem 3D model (VF 3, VF 9, Lux). |

### Kiến trúc kỹ thuật
- **Framework:** LangGraph (StateGraph) — ReAct Agent pattern
- **LLM:** GPT-4o-mini (tư vấn) + GPT-4.1-mini (summarizer)
- **Knowledge Base:** Structured JSON (`vinfast_spec.json`) + Markdown RAG (`vinfast_specs.md` → FAISS + MiniLM-L6-v2)
- **3 Tools:** `get_car_specs` (tra cứu specs), `load_3d_model` (3D viewer), `calculate_car_match` (scoring & ranking)
- **Summarizer Agent:** Tự động tóm tắt hội thoại → lưu file context → data flywheel

### Guardrails
| Rule | Hành vi |
|------|---------|
| Thiếu ≥ 2 tiêu chí bắt buộc (ngân sách, mục đích) | Hỏi lại, KHÔNG đoán |
| Câu hỏi về tài chính (trả góp, lãi suất, bảo hiểm) | Từ chối trả lời, chuyển hotline/showroom |
| So sánh với thương hiệu khác (Toyota, Hyundai) | "Em chỉ tư vấn về dòng xe VinFast" |
| Prompt injection / yêu cầu đóng vai | Bỏ qua, trả fallback hoặc escalate |
| Không có xe nào khớp toàn bộ tiêu chí | Nói thẳng giới hạn catalog, gợi ý điều chỉnh tiêu chí |
| User không hài lòng sau 2 lần gợi ý | Tự động hiện escape hatch: hotline / showroom / để lại thông tin |

### Data Flywheel
Chatbot thu thập → Summarizer Agent tóm tắt → lưu vào `data_vf/data/context/` → phân tích:
- Từ khóa/loại xe khách hàng đang hỏi nhiều nhất → team Marketing đẩy quảng cáo dòng xe đó
- Cặp Q&A chất lượng cao → fine-tune model cho domain VinFast
- Pattern rejection → cải thiện ranking algorithm trong `calculate_car_match`

### Rủi ro chính
Hallucination giá thành/thông số. Mitigation: **LUÔN dùng tool để lấy dữ liệu** (system prompt constraint), không bao giờ trả lời bằng kiến thức sẵn có. Fallback 4 lối thoát: chat tư vấn viên / hotline / showroom / để lại thông tin.

---

## Phân công

| Thành viên | MSSV | Phần phụ trách |
|-----------|------|---------------|
| Nguyễn Đông Hưng | 2A202600392 | Canvas + Problem Statement |
| Lưu Lương Vi Nhân | 2A202600120 | User Stories 4 paths |
| Khuất Văn Vương | 2A202600087 | Eval metrics + ROI, Failure modes + Mini AI Spec |
| Huỳnh Văn Nghĩa | 2A202600085 | Frontend prototype + prompt testing |
