# BE-09 — AI Integration (Hợp đồng với team AI)

> **Phần này dành cho mọi người dễ hiểu** — không đi sâu training/model.  
> Team AI thiết kế & host service riêng; **Backend FastAPI chỉ gọi API và lưu kết quả**.

---

## 1. Vai trò từng bên

```
┌─────────────┐     REST      ┌─────────────┐     REST      ┌─────────────┐
│   Frontend  │ ────────────► │  Backend    │ ────────────► │ AI Service  │
│  (React)    │               │  (FastAPI)  │               │ (team khác) │
└─────────────┘               └─────────────┘               └─────────────┘
                                     │                              │
                                     │         callback/webhook     │
                                     └◄─────────────────────────────┘
```

| Bên | Làm gì |
|-----|--------|
| **FE** | Form CV/JD, hiển thị progress 5 bước, show điểm & tabs |
| **BE** | Lưu file, check quota, gọi AI, lưu DB, trả JSON cho FE |
| **AI** | Đọc CV+JD → chấm điểm, gợi ý, câu hỏi phỏng vấn |

BE **không cần biết** model dùng gì (GPT, Gemini, custom…) — chỉ cần **đúng format JSON** FE đang dùng.

---

## 2. Hai tính năng cần AI

### A. Phân tích CV (Coverage Score)

**Khi nào chạy:** User bấm "Bắt đầu phân tích" trên `/cv-scan`

**BE gửi cho AI:**

| Dữ liệu | Mô tả |
|---------|--------|
| `cv_text` | Nội dung CV (BE extract từ PDF/DOCX hoặc text user dán) |
| `jd_text` | Nội dung JD tương tự |
| `config` | Công ty, ngành, vị trí, số năm KN (user nhập) |
| `user_plan` | `free` / `premium` / `vip` — AI có thể trả thêm companies/courses nếu premium |

**AI trả về:** 1 object JSON giống `CVAnalysisResult` (xem mục 4).

**BE làm tiếp:**
1. Lưu vào `analysis_results.result_json`
2. Cập nhật `scan_sessions.status = completed`, `overall_score`
3. FE poll `/scans/{id}` → redirect `/analysis/{id}`

---

### B. Mock Interview (Phỏng vấn AI)

**Khi nào chạy:** User VIP bắt đầu buổi luyện trên `/mock-interview`

**Luồng đơn giản:**

1. **Bắt đầu:** AI sinh câu hỏi đầu tiên theo `targetRole` + `difficulty`
2. **Mỗi lượt user trả lời:** AI sinh câu hỏi tiếp HOặc feedback ngắn + câu mới
3. **Kết thúc:** AI tổng hợp `InterviewReport` (điểm từng câu, gợi ý cải thiện)

BE lưu từng message vào `interview_messages`, report vào `interview_sessions.report_json`.

---

## 3. Cách gọi AI (2 pattern — team chọn 1)

### Pattern 1: Đồng bộ (đơn giản, MVP)

```
BE --POST /analyze--> AI
AI xử lý 30-60 giây
AI --trả JSON ngay--> BE
```

Phù hợp demo. FE vẫn poll progress — BE fake progress theo thời gian chờ.

### Pattern 2: Bất đồng bộ (production)

```
BE --POST /jobs--> AI          (nhận job_id)
BE status = processing

AI xử lý xong
AI --POST /webhook--> BE       (gửi kết quả + progress updates)

FE poll GET /scans/{id}
```

Khuyến nghị production. AI có thể push `progressPercent` + `currentStep` (0-4) khớp 5 bước FE.

---

## 4. JSON CV Analysis — AI phải trả (bắt buộc)

Copy structure từ `src/types/index.ts` → `CVAnalysisResult`:

```json
{
  "cvName": "CV_Frontend.pdf",
  "analyzedRole": "Frontend Developer",
  "analyzedIndustry": "Công nghệ thông tin",
  "experienceLevel": "1-3 năm",
  "analyzedAt": "2026-06-22T10:01:00Z",
  "scores": {
    "overall": 72,
    "ats": 68,
    "keyword": 75,
    "experience": 74,
    "presentation": 70
  },
  "strengths": ["Kinh nghiệm React rõ ràng", "..."],
  "weaknesses": ["Thiếu từ khóa TypeScript", "..."],
  "atsIssues": [
    {
      "issue": "CV dùng bảng phức tạp ATS khó đọc",
      "severity": "high",
      "fix": "Chuyển sang bullet points"
    }
  ],
  "suggestedKeywords": ["React", "TypeScript", "REST API"],
  "keywords": {
    "matched": ["React", "JavaScript"],
    "missing": ["TypeScript", "GraphQL"]
  },
  "improvements": [
    {
      "priority": "high",
      "title": "Bổ sung TypeScript",
      "description": "JD yêu cầu TS nhưng CV chưa nhắc."
    }
  ],
  "experienceComment": "Kinh nghiệm 2 năm frontend phù hợp JD junior-mid...",
  "companies": [],
  "courses": [],
  "isPremiumContent": true
}
```

### Premium-only fields

Nếu `user_plan` là `premium` hoặc `vip`, AI **nên** điền:

**`companies`** — gợi ý công ty (mock hoặc từ database nghề nghiệp):

```json
{
  "name": "FPT Software",
  "match": 85,
  "logo": "",
  "industry": "IT",
  "size": "1000+",
  "requirements": ["React", "English"]
}
```

**`courses`** — gợi ý khoá học bổ skill thiếu:

```json
{
  "title": "React - The Complete Guide 2024",
  "platform": "Udemy",
  "skill": "React",
  "rating": 4.7,
  "students": "500K+",
  "price": "399.000₫",
  "url": "https://udemy.com/...",
  "reason": "Bổ sung advanced React patterns"
}
```

Free user: để `companies: []`, `courses: []` — BE strip nếu cần.

---

## 5. API gợi ý cho AI Service (team AI implement)

> URL base ví dụ: `AI_SERVICE_BASE_URL`

### POST `/v1/cv/analyze`

**Request:**

```json
{
  "jobId": "uuid-from-be",
  "cvText": "...",
  "jdText": "...",
  "config": {
    "company": "FPT Software",
    "industry": "Công nghệ thông tin",
    "role": "Frontend Developer",
    "experienceFrom": 1,
    "experienceTo": 3
  },
  "userPlan": "premium",
  "language": "vi"
}
```

**Response (sync):** full `CVAnalysisResult` JSON

**Response (async):**

```json
{ "accepted": true, "externalJobId": "ai-job-123" }
```

---

### POST `/v1/cv/progress` (webhook AI → BE, optional)

AI báo tiến độ cho BE forward cho FE:

```json
{
  "jobId": "uuid",
  "progressPercent": 60,
  "currentStep": 3,
  "stepLabel": "Đánh giá kinh nghiệm & kỹ năng"
}
```

---

### POST `/v1/interview/start`

```json
{
  "sessionId": "uuid",
  "targetRole": "Frontend Developer",
  "difficulty": "medium",
  "language": "vi"
}
```

**Response:**

```json
{
  "message": {
    "role": "ai",
    "content": "Hãy giới thiệu bản thân...",
    "questionNumber": 1
  }
}
```

---

### POST `/v1/interview/reply`

```json
{
  "sessionId": "uuid",
  "history": [
    { "role": "ai", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "userMessage": "Tôi là Bin..."
}
```

**Response:**

```json
{
  "message": {
    "role": "ai",
    "content": "Câu hỏi tiếp theo...",
    "questionNumber": 2
  },
  "isFinished": false
}
```

---

### POST `/v1/interview/finish`

**Response:** `InterviewReport` JSON (xem `types/index.ts`)

---

## 6. BE webhook nhận kết quả AI (Pattern 2)

`POST /api/v1/internal/ai/callback` — **không public**, verify `AI_CALLBACK_SECRET`

```json
{
  "jobId": "uuid",
  "scanSessionId": "uuid",
  "status": "completed",
  "result": { "...": "CVAnalysisResult" }
}
```

Hoặc `status: failed` + `errorMessage`.

---

## 7. Xử lý lỗi

| Tình huống | BE làm |
|------------|--------|
| AI timeout (>120s) | `scan_sessions.status = failed`, thông báo user |
| AI trả JSON sai schema | Log + failed, không crash BE |
| AI service down | `503` cho FE, retry 1-2 lần |

MVP: BE fallback mock JSON (port `generateMockResult`) khi `AI_SERVICE_BASE_URL` không set.

---

## 8. Checklist team AI

- [ ] Extract text từ PDF/DOCX (hoặc nhận plain text từ BE)
- [ ] Trả JSON đúng schema mục 4
- [ ] Progress callback (optional) steps 0-4
- [ ] Interview: start / reply / finish
- [ ] Ngôn ngữ output: **Tiếng Việt**
- [ ] Document API OpenAPI riêng của AI service

---

## 9. Liên quan

- [BE-04-CV-SCAN-API.md](./BE-04-CV-SCAN-API.md) — trigger phân tích
- [BE-07-MOCK-INTERVIEW-API.md](./BE-07-MOCK-INTERVIEW-API.md) — interview session
- FE types: `src/types/index.ts`
