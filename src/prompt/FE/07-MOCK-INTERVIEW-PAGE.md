# NextStep AI — AI Mock Interview Page
# Prompt #07: MockInterviewPage.tsx

## Skill Activation (ui-ux-pro-max)

- **Layout:** Bento hub — stats trên, 2 cột bằng nhau dưới (setup | history)
- **Charts:** Donut SVG thuần — legend bên phải, màu theo vị trí
- **Interaction:** Modal kết quả auto sau khi kết thúc; accordion từng câu hỏi
- **Light theme:** `dashboard-stat-card`, `stat-icon-tile`, `scan-history-row`, `shadow-card`

---

## Page States

| State | Mô tả |
|-------|--------|
| `hub` | Trang chính: thống kê + setup + lịch sử |
| `interview` | Full-height chat session |
| Modal | Popup kết quả (không phải route riêng) |

---

## Hub Layout (VIP)

### Section 1 — Thống kê phỏng vấn (1 card)

Layout **1 hàng** trên desktop (`lg:`):
- **Trái (~240px):** 2 badge Lượt còn lại / Lượt đã dùng (xếp dọc)
- **Phải (flex-1):** khung chart "Phân bổ theo vị trí" + filter "Lọc biểu đồ" + donut + legend
- Mobile: badge 2 cột trên, chart full width dưới

### Section 2 — Grid 2 cột (lg+, bằng chiều cao)

**Trái — Chuẩn bị phỏng vấn**
- Ngành nghề, Vị trí (select)
- Hình thức: Gõ văn bản | Giọng nói (icon Lucide, không emoji)
- CTA: Bắt đầu phỏng vấn → `consumeInterviewSession()` trước khi vào chat

**Phải — Kết quả phỏng vấn**
- Search theo vị trí
- Filter date range (từ / đến)
- List scroll, mới nhất trên đầu
- Click item → mở modal chi tiết

---

## Interview Session

- Top bar: role, câu X/Y, timer, nút thoát
- Chat bubbles (user phải, AI trái)
- Khi trả lời xong câu cuối → **tự động** lưu session + hiện modal (không cần "Xem kết quả")

---

## Result Modal (`InterviewResultModal`)

- Score tổng, role, thời lượng
- **Accordion** từng câu: click mũi tên → mở/đóng
  - Câu hỏi
  - Câu trả lời
  - Feedback
- **Tiếp tục phỏng vấn** → đóng modal, về hub (section Chuẩn bị)
- **Trang chủ** → `/dashboard`

---

## Data (`AppContext`)

```ts
interface InterviewSessionRecord {
  id, userId, role, industry, mode,
  overallScore, durationSeconds, completedAt,
  questions: { question, answer, score, feedback }[]
}
```

- Lưu `localStorage` qua `persisted.interviews`
- `addInterviewSession(session)` sau mỗi buổi hoàn thành

---

## Non-VIP Gate

- Lock screen + CTA `/pricing`
- Light theme: `stat-icon-tile-yellow`, `shadow-card`

---

## Header badge (AppLayout)

- Chỉ hiển thị **Free** | **Premium** | **VIP**
- **Không** hiển thị số buổi còn lại trên header

---

## Toast (`ToastContext`)

| Sự kiện | Toast |
|---------|-------|
| Bắt đầu phỏng vấn | info · "Buổi phỏng vấn đã bắt đầu" |
| Hoàn tất (auto popup) | success · "Hoàn tất phỏng vấn" + điểm tổng |
| Hết lượt VIP | error · "Hết lượt phỏng vấn" |
| Thoát sớm (X) | warning · lượt không hoàn lại |
| Tiếp tục phỏng vấn (modal) | info · "Sẵn sàng buổi mới" |

Feedback mock: `src/data/interviewFeedbackPresets.ts` — văn phong gợi ý thân thiện, ít thuật ngữ kỹ thuật.
