# NextStep AI — ATS Scoring Model (MVP Mock)
# Prompt #18: Logic chấm điểm ATS

> **Cập nhật:** 2026-07-03  
> Code: `src/lib/atsScoring.ts` · Tích hợp: `src/data/cvJdPresets.ts` → `buildResult()`

---

## 1. ATS thực tế hoạt động thế nào?

ATS (Workday, Taleo, Greenhouse, Lever…) thường qua **3 gate** trước khi recruiter thấy CV:

| Gate | Nội dung | Fail nếu |
|------|----------|----------|
| **1. Parse / Format** | Đọc được text, section chuẩn, date format | Multi-column, Canva PDF, header/footer ẩn contact |
| **2. Keyword match** | Hard skills, title, cert khớp JD | Thiếu required terms (< ~20% density) |
| **3. Qualification fit** | YOE, education, recency | Thiếu năm KN, title lệch, skill cũ |

**Thứ tự ưu tiên ranking (composite score):**

1. **Required keywords / hard skills** — trọng số cao nhất (~2× soft skills trong nhiều engine)
2. **Kinh nghiệm (YOE + recency + title)** — required qualifications
3. **Format / khả năng parse** — phải qua gate 1 mới chấm được
4. **Cấu trúc section, date, education** — penalty nếu lệch chuẩn

> Lưu ý: ATS **không** “đọc hiểu” như người — chủ yếu match pattern + structured fields.

---

## 2. Công thức MVP (mock)

```
ATS = clamp(
  keyword×38% + experience×32% + presentation×22% + structure×8%
  − jdMinPenalty,
  0, 100
)
```

| Thành phần | Trọng số | Nguồn mock |
|------------|----------|------------|
| **Keyword** | **38%** | `scores.keyword` — hard skills JD matched |
| **Experience** | **32%** | `scores.experience` — YOE, recency, domain |
| **Presentation** | **22%** | `scores.presentation` — format, parse proxy |
| **Structure** | **8%** | `100 − penalty(atsIssues)` |

### Penalty `atsIssues`

| Severity | Trừ vào structure |
|----------|-------------------|
| high | 10 điểm / issue |
| medium | 5 |
| low | 2 |

Cap penalty structure: **45** (structure min 55).

### Penalty yêu cầu KN JD (form tùy chọn)

Nếu user nhập KN tối thiểu và ứng viên **chưa đạt** (ưu tiên `relevantMonths` với JD Big Data/BA):

```
jdMinPenalty = min(18, gapRatio × 18)
```

---

## 3. Điểm ATS kỳ vọng — 6 case demo

| Case | CV × JD | KW | Exp | Pres | Structure | **ATS** | **CS** |
|------|---------|-----|-----|------|-----------|---------|--------|
| Happy 1 | Huynh × Whitestar | 94 | 93 | 87 | 96 (2×low) | **92** | **92** |
| Happy 2 | Khánh My × BD | 78 | 70 | 84 | 95 (1×medium) | **78** | **77** |
| Partial | Đăng × Big Data DE | 70 | 46 | 74 | 85 (high+medium) | **64** | **62** |
| Partial | Đăng × BeLending BA | 68 | 54 | 76 | 80 (high+2×medium) | **66** | **65** |
| Reject | Huynh × Cyber | 16 | 18 | 50 | 80 (2×high) | **29** | **25** |
| Reject | Khánh My × Big Data | 16 | 14 | 56 | 80 (2×high) | **29** | **25** |

> `scores.ats` và `scores.overall` được **tính lại** khi `buildResult()` — preset chỉ lưu KW / Exp / Pres.

---

## 4. UI hiển thị

Tab **Kiểm tra ATS** (`AnalysisDetailPage`):

- Điểm tổng `scores.ats`
- Breakdown weighted (`result.atsBreakdown.components`)
- Penalty JD min (nếu có)
- Danh sách `atsIssues` (issue + severity + fix)

---

## 5. BE / AI (tương lai)

AI service nên trả cùng schema:

```json
{
  "scores": { "keyword": 72, "experience": 42, "presentation": 76, "ats": 64 },
  "atsBreakdown": { "finalScore": 64, "components": { ... }, "penalties": { ... } },
  "atsIssues": [{ "issue": "...", "severity": "high", "fix": "..." }]
}
```

Contract tham khảo: [BE-09-AI-INTEGRATION.md](../BE/BE-09-AI-INTEGRATION.md)

---

## 6. Checklist QA ATS

- [ ] Happy case: ATS ≈ keyword (cao), structure ít issue
- [ ] Reject case: ATS thấp dù presentation có thể trung bình (keyword/exp kéo xuống)
- [ ] Partial Đăng × DE: ATS **~60–65**, không ~74 như trước
- [ ] Nhập yêu cầu 2 năm + CV thiếu → có `jdMinPenalty` trong breakdown
- [ ] Tooltip header metric ATS mô tả weighted model
