# BE-07 — Mock Interview API

> Luyện phỏng vấn AI — phần **chat/scoring do AI team**, BE quản lý session & quota.

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/v1/interviews` | Tạo buổi luyện |
| GET | `/api/v1/interviews/{id}` | Trạng thái session |
| POST | `/api/v1/interviews/{id}/messages` | Gửi câu trả lời user |
| GET | `/api/v1/interviews/{id}/messages` | Lịch sử chat |
| POST | `/api/v1/interviews/{id}/finish` | Kết thúc → báo cáo |
| GET | `/api/v1/interviews` | Lịch sử buổi luyện |

---

## VIP gate

**FE thay thế:** `isVip()` + `consumeInterviewSession()`

Trước `POST /interviews`:
- `user_plans.plan_type = 'vip'`
- `interview_sessions_left > 0`

Else `403 PLAN_REQUIRED` hoặc `403 NO_SESSIONS_LEFT`.

Khi tạo session thành công → decrement `interview_sessions_left` (hoặc trừ khi `finish` — team chọn 1 policy).

---

## POST `/interviews`

### Request

```json
{
  "targetRole": "Frontend Developer",
  "difficulty": "medium",
  "mode": "text"
}
```

Align FE MockInterviewPage setup form.

### Response `201`

```json
{
  "id": "uuid",
  "status": "in_progress",
  "targetRole": "Frontend Developer",
  "difficulty": "medium",
  "mode": "text",
  "messages": [
    {
      "id": "uuid",
      "role": "ai",
      "content": "Hãy giới thiệu bản thân...",
      "questionNumber": 1,
      "timestamp": "2026-06-22T10:00:00Z"
    }
  ],
  "sessionsLeft": 4
}
```

Câu hỏi đầu tiên: BE gọi AI service hoặc dùng bank `MOCK_QUESTIONS` (phase MVP).

---

## POST `/interviews/{id}/messages`

User gửi câu trả lời.

### Request

```json
{
  "content": "Tôi là Bin, 2 năm kinh nghiệm React..."
}
```

### Response `200`

```json
{
  "userMessage": { "role": "user", "content": "...", "timestamp": "..." },
  "aiMessage": {
    "role": "ai",
    "content": "Cảm ơn bạn. Bạn có thể giải thích sự khác biệt State và Props?",
    "questionNumber": 2,
    "timestamp": "..."
  }
}
```

**AI team** implement: nhận context (role, history) → sinh câu hỏi tiếp / feedback.

MVP: rotate `MOCK_QUESTIONS` từ constants FE.

---

## POST `/interviews/{id}/finish`

### Response `200`

```json
{
  "report": {
    "totalQuestions": 5,
    "answeredQuestions": 5,
    "duration": "12 phút",
    "overallScore": 78,
    "categoryScores": {
      "communication": 80,
      "technical": 75,
      "problemSolving": 72,
      "attitude": 85
    },
    "questionFeedback": [
      {
        "question": "...",
        "userAnswer": "...",
        "score": 75,
        "feedback": "...",
        "improvement": "...",
        "sampleAnswer": "..."
      }
    ]
  }
}
```

Shape = `InterviewReport` trong `types/index.ts`. AI service generate report JSON.

---

## Streaming (optional phase 2)

`GET /interviews/{id}/stream` — SSE cho AI reply từng token. FE hiện text mode không bắt buộc stream.

---

## Liên quan

- [BE-09-AI-INTEGRATION.md](./BE-09-AI-INTEGRATION.md) — interview AI contract
