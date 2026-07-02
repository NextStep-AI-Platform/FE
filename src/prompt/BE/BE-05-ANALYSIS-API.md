# BE-05 — Analysis API

> Danh sách & chi tiết kết quả phân tích — align FE `/analysis`, `/analysis/:id`

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/v1/analysis` | Danh sách scan đã hoàn thành |
| GET | `/api/v1/analysis/{id}` | Chi tiết full (tabs) |
| GET | `/api/v1/analysis/{id}/export` | Export PDF (phase sau → 501) |

---

## GET `/analysis`

**FE thay thế:** `useApp().scans` trên AnalysisListPage

### Query params

| Param | Mô tả |
|-------|-------|
| `page`, `limit` | Pagination |
| `q` | Search title/role/company |
| `minScore` | Lọc điểm tối thiểu (tab Jobs dùng ≥70) |
| `sort` | `-analyzed_at` (default) |

### Response `200`

```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "CS · Frontend Developer · FPT Software",
      "role": "Frontend Developer",
      "company": "FPT Software",
      "overallScore": 72,
      "analyzedAt": "2026-06-20T14:30:00Z",
      "cvInput": { "mode": "file", "fileName": "CV.pdf" },
      "jdInput": { "mode": "text" },
      "config": {
        "company": "FPT Software",
        "industry": "Công nghệ thông tin",
        "role": "Frontend Developer",
        "experienceFrom": 1,
        "experienceTo": 3
      }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

List **không** cần trả full `result` — chỉ metadata. Detail endpoint trả đủ tabs.

---

## GET `/analysis/{id}`

**FE thay thế:** AnalysisDetailPage load `ScanRecord` + `result`

### Response `200`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "CS · Frontend Developer · FPT Software",
  "role": "Frontend Developer",
  "company": "FPT Software",
  "overallScore": 72,
  "analyzedAt": "2026-06-20T14:30:00Z",
  "cvInput": {
    "mode": "file",
    "fileName": "CV_Frontend.pdf",
    "fileSize": 240000,
    "mimeType": "application/pdf",
    "fileId": "uuid"
  },
  "jdInput": {
    "mode": "text",
    "textContent": "..."
  },
  "config": { "...": "ScanConfig" },
  "result": {
    "id": "uuid",
    "cvName": "CV_Frontend.pdf",
    "analyzedRole": "Frontend Developer",
    "analyzedIndustry": "Công nghệ thông tin",
    "experienceLevel": "1-3 năm",
    "analyzedAt": "2026-06-20T14:30:00Z",
    "scores": {
      "overall": 72,
      "ats": 68,
      "keyword": 75,
      "experience": 74,
      "presentation": 70
    },
    "strengths": ["..."],
    "weaknesses": ["..."],
    "atsIssues": [
      { "issue": "...", "severity": "high", "fix": "..." }
    ],
    "suggestedKeywords": ["React", "TypeScript"],
    "keywords": { "matched": ["React"], "missing": ["GraphQL"] },
    "improvements": [
      { "priority": "high", "title": "...", "description": "..." }
    ],
    "experienceComment": "Nhận xét kinh nghiệm...",
    "companies": null,
    "courses": null,
    "isPremiumContent": false
  }
}
```

### Plan gate (server-side)

| Tab data | Free | Premium/VIP |
|----------|------|-------------|
| overview, ats, compatibility, improve | ✅ full | ✅ |
| `result.companies` | ❌ null hoặc omit | ✅ array |
| `result.courses` | ❌ null hoặc omit | ✅ array |

FE hiện gate client-side — BE **nên** strip premium fields để tránh leak.

Tab **Công việc phù hợp** trên FE: list các scan user có `overallScore >= 70` — có thể dùng `GET /analysis?minScore=70` thay vì logic riêng.

---

## CV/JD preview endpoints (optional)

Nếu file lớn, tách endpoint:

| Method | Path |
|--------|------|
| GET | `/api/v1/analysis/{id}/cv-content` |
| GET | `/api/v1/analysis/{id}/jd-content` |
| GET | `/api/v1/analysis/{id}/cv-download` |

Align FE dialog "Xem đầy đủ" / download DOCX.

---

## GET `/analysis/{id}/export`

Phase sau. MVP trả:

```json
{ "code": "NOT_IMPLEMENTED", "message": "Tính năng sắp ra mắt" }
```

HTTP `501` — FE toast như hiện tại.

---

## Not found

`404` + `{ "code": "ANALYSIS_NOT_FOUND" }` — FE hiển thị card "Không tìm thấy kết quả".
