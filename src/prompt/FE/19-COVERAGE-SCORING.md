# NextStep AI — Coverage Score (CS) Model
# Prompt #19: Logic tính điểm tổng & ma trận hạng mục

> **Cập nhật:** 2026-07-03  
> Code: `src/lib/coverageScoring.ts` · Tích hợp: `src/data/cvJdPresets.ts` → `buildResult()`

---

## 1. Hai tầng điểm

| Tầng | Field | Cách tính |
|------|-------|-----------|
| **Hạng mục nền** | `keyword`, `experience`, `presentation` | Preset theo từng cặp CV×JD (phản ánh nội dung thực) |
| **ATS** | `scores.ats` | Tự động — [18-ATS-SCORING.md](./18-ATS-SCORING.md) |
| **Coverage Score** | `scores.overall` | Tự động — công thức bên dưới |

Preset **không** lưu `overall` hay `ats` cố định nữa.

---

## 2. Công thức Coverage Score (CS)

```
CS = keyword×30% + experience×30% + ATS×25% + presentation×15% − jdMinPenalty×0.5
```

| Thành phần | Trọng số | Ý nghĩa |
|------------|----------|---------|
| Keyword | 30% | Hard skills / required terms khớp JD |
| Experience | 30% | YOE, domain, recency, title fit |
| ATS | 25% | Khả năng qua lọc tự động (đã weighted riêng) |
| Presentation | 15% | Format, cấu trúc, chuyên nghiệp |

UI: tab **Tổng quan** hiển thị `coverageBreakdown` — từng hạng mục × trọng số.

---

## 3. Ma trận điểm — 6 case demo

Mốc tham chiếu (không nhập JD min). Làm tròn khi hiển thị.

| Case | KW | Exp | Pres | ATS | **CS** | Nhãn |
|------|-----|-----|------|-----|--------|------|
| Huynh × Whitestar | 94 | 93 | 87 | 92 | **92** | Xuất sắc |
| Khánh My × BD | 78 | 70 | 84 | 78 | **77** | Khá tốt |
| Đăng × Big Data DE | 70 | 46 | 74 | 64 | **62** | Trung bình |
| Đăng × BeLending BA | 68 | 54 | 76 | 66 | **65** | Trung bình |
| Huynh × Cyber | 16 | 18 | 50 | 29 | **25** | Cần cải thiện |
| Khánh My × Big Data | 16 | 14 | 56 | 29 | **25** | Cần cải thiện |

### Giải thích nhanh

- **Happy Whitestar:** keyword + KN livestream cao, ATS gần keyword.
- **Happy BD:** soft skills khớp hướng BD junior; thiếu F&B → keyword không max.
- **Partial Đăng×DE:** keyword PySpark tốt nhưng **experience thấp** (10 th DE vs JD mid) kéo CS & ATS.
- **Partial Đăng×BA:** có SQL/Python, thiếu lending domain.
- **Reject:** keyword ≈ 0, experience không liên quan → CS & ATS đồng loạt thấp.

---

## 4. Liên hệ giữa các hạng mục

```
Keyword + Experience + Presentation  →  ATS (38/32/22/8 + issues)
         ↓
Keyword + Experience + ATS + Presentation  →  Coverage Score (30/30/25/15)
```

**Quy tắc nhất quán:**
- Reject: keyword & experience < 25 → CS < 30
- Partial: một trong keyword/experience trung bình, cái còn lại thấp → CS 55–65
- Happy: keyword & experience ≥ 70 → CS ≥ 75 (nếu ATS/pass format ổn)

---

## 5. Checklist QA

- [ ] Tab **Tổng quan**: 4 thẻ (ATS, keyword, experience, presentation) + block CS breakdown
- [ ] Tab **Kiểm tra ATS**: breakdown ATS riêng
- [ ] CS header khớp `coverageBreakdown.finalScore`
- [ ] Scan mới (không dùng cache localStorage cũ)

---

## 6. File liên quan

| File | Vai trò |
|------|---------|
| `src/lib/coverageScoring.ts` | CS weighted |
| `src/lib/atsScoring.ts` | ATS weighted |
| `src/data/cvJdPresets.ts` | Preset keyword/exp/pres + nội dung tab |
| `src/data/cvExperienceProfiles.ts` | Timeline KN |

Case demo đầy đủ: [16-CV-JD-DEMO-CASES.md](./16-CV-JD-DEMO-CASES.md)
