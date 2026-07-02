# BE-04 — CV Scan API

> Upload CV/JD, cấu hình scan, chạy phân tích — **không** chứa logic AI.  
> Logic chấm điểm do AI service xử lý (xem BE-09).

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/v1/scans` | Tạo phiên scan (draft) |
| PATCH | `/api/v1/scans/{id}` | Cập nhật input/config trước khi chạy |
| POST | `/api/v1/scans/{id}/run` | Bắt đầu phân tích (check quota → gọi AI) |
| GET | `/api/v1/scans/{id}` | Trạng thái + progress |
| GET | `/api/v1/scans/{id}/progress` | SSE hoặc poll steps (optional) |

---

## Luồng tổng quan (dễ hiểu)

```
1. User chọn CV + JD trên FE (/cv-scan)
2. FE gửi lên BE → BE lưu file/text + config
3. User bấm "Bắt đầu phân tích"
4. BE kiểm tra còn lượt scan không
5. BE gửi yêu cầu sang AI Service: "Hãy phân tích cặp CV+JD này"
6. FE hiển thị 5 bước progress (poll BE mỗi 1-2 giây)
7. Khi AI xong → BE lưu kết quả → FE chuyển sang /analysis/{id}
```

5 bước progress trên FE (`analysisProgress.ts`):
1. Trích xuất nội dung CV & JD
2. Kiểm tra cấu trúc ATS
3. Đối chiếu từ khóa nghề nghiệp
4. Đánh giá kinh nghiệm & kỹ năng
5. Tổng hợp Coverage Score

BE map `status` + `progress_percent` để FE render checklist — AI team có thể push progress qua callback.

---

## POST `/scans`

**FE thay thế:** phần chuẩn bị trước `addScan()`

### Request — option A: JSON (text mode)

```json
{
  "cv": {
    "mode": "text",
    "textContent": "Nguyễn Văn A\nFrontend Developer\n..."
  },
  "jd": {
    "mode": "text",
    "textContent": "Yêu cầu: React, TypeScript..."
  },
  "config": {
    "company": "FPT Software",
    "industry": "Công nghệ thông tin",
    "role": "Frontend Developer",
    "experienceFrom": 1,
    "experienceTo": 3
  }
}
```

### Request — option B: multipart (file mode)

`multipart/form-data`:
- `cvFile` hoặc `cvText`
- `jdFile` hoặc `jdText`
- `config` (JSON string)

### Response `201`

```json
{
  "id": "scan-uuid",
  "status": "draft",
  "title": "CS · Frontend Developer · FPT Software",
  "createdAt": "2026-06-22T10:00:00Z"
}
```

`title` format: dùng `buildScanTitle()` logic từ FE.

### File rules

| | CV | JD |
|---|----|----|
| Types | pdf, doc, docx | pdf, doc, docx, text |
| Max size | 5 MB | 5 MB |

Upload file → lưu storage + optional `cv_files` record.

---

## POST `/scans/{id}/run`

**FE thay thế:** nút "Bắt đầu phân tích" + mock timer ~2.8s

### Pre-checks

1. Scan thuộc user hiện tại
2. Status = `draft`
3. CV + JD đủ dữ liệu
4. `config.company` required
5. **Quota:** free plan ≤ 3 scans/tháng → else `403 QUOTA_EXCEEDED`

### Response `202 Accepted`

```json
{
  "id": "scan-uuid",
  "status": "pending",
  "message": "Đang xếp hàng phân tích..."
}
```

### Backend actions

1. `scan_sessions.status = 'pending'`
2. Tạo `ai_jobs` record
3. Gọi AI service async (HTTP POST — xem BE-09)
4. Increment `users.scans_used` nếu plan free

---

## GET `/scans/{id}`

**FE dùng để:** poll trong lúc analyzing

### Response `200`

```json
{
  "id": "scan-uuid",
  "status": "processing",
  "progressPercent": 45,
  "currentStep": 2,
  "steps": [
    { "label": "Trích xuất nội dung CV & JD", "status": "done" },
    { "label": "Kiểm tra cấu trúc ATS", "status": "active" },
    { "label": "Đối chiếu từ khóa nghề nghiệp", "status": "pending" },
    { "label": "Đánh giá kinh nghiệm & kỹ năng", "status": "pending" },
    { "label": "Tổng hợp Coverage Score", "status": "pending" }
  ],
  "overallScore": null,
  "analysisId": null
}
```

Khi `status = completed`:

```json
{
  "status": "completed",
  "progressPercent": 100,
  "overallScore": 72,
  "analysisId": "scan-uuid",
  "analyzedAt": "2026-06-22T10:01:00Z"
}
```

FE redirect → `/analysis/{analysisId}`.

### Status flow

```
draft → pending → processing → completed
                              → failed
```

---

## MVP fallback (chưa có AI service)

BE có thể:
- Sleep 2-3 giây
- Trả `result_json` từ template mock (port `generateMockResult()` FE)
- Vẫn giữ contract endpoint — FE không đổi

---

## Errors

| Code | HTTP | UI FE |
|------|------|-------|
| `QUOTA_EXCEEDED` | 403 | Popup nâng cấp Premium |
| `INVALID_CONFIG` | 400 | Toast validation |
| `SCAN_NOT_FOUND` | 404 | — |
| `AI_SERVICE_UNAVAILABLE` | 503 | Toast "Thử lại sau" |

---

## Liên quan

- [BE-05-ANALYSIS-API.md](./BE-05-ANALYSIS-API.md) — đọc kết quả chi tiết
- [BE-09-AI-INTEGRATION.md](./BE-09-AI-INTEGRATION.md) — hợp đồng AI
