# NextStep AI — CV×JD Demo Cases & Experience Timeline
# Prompt #16: Mock matching QA guide

> **Cập nhật:** 2026-07-03  
> Scoring: [18-ATS-SCORING.md](./18-ATS-SCORING.md) · [19-COVERAGE-SCORING.md](./19-COVERAGE-SCORING.md)

---

## 1. Bộ file mẫu

Folder: `CV&JD/`

| CV | Preset |
|----|--------|
| `CV_HUỲNH NGÔ GIA KHÁNH.pdf` | `gia_khanh` |
| `CV_DANG Nguyen.pdf` | `hai_dang` |
| `CV_Tran Khanh My.pdf` | `khanh_my` |

| JD | Preset |
|----|--------|
| Whitestar livestream | `whitestar_livestream` |
| BD Specialist | `bd_specialist` |
| BeLending BA | `belending_ba` |
| An ninh mạng | `cybersecurity` |
| Big Data Cloud DE | `big_data_de` |

---

## 2. Ma trận 6 case (điểm tính tự động)

| # | Loại | CV × JD | KW | Exp | Pres | ATS | **CS** |
|---|------|---------|-----|-----|------|-----|--------|
| 1 | Happy | Huynh × Whitestar | 94 | 93 | 87 | 92 | **92** |
| 2 | Happy | Khánh My × BD | 78 | 70 | 84 | 78 | **77** |
| 3 | Partial | Đăng × Big Data DE | 70 | 46 | 74 | 64 | **62** |
| 4 | Partial | Đăng × BeLending BA | 68 | 54 | 76 | 66 | **65** |
| 5 | Reject | Huynh × Cyber | 16 | 18 | 50 | 29 | **25** |
| 6 | Reject | Khánh My × Big Data | 16 | 14 | 56 | 29 | **25** |

Fallback không nhận diện: CS **~30–35**.

---

## 3. Timeline KN (Đăng — 4 mốc)

| Project | Thời gian | Tháng |
|---------|-----------|-------|
| AI Business Summary | 02–06/2025 | 4 |
| Auto-Evaluator Framework | 06–08/2025 | 2 |
| SCGC HR Agent | 09/2025–05/2026 | 8 |
| Lease Control Tower | 05/2026→nay | 2 |

- **Tổng calendar (union):** 16 tháng  
- **KN liên quan DE:** ~10 tháng (SCGC + Lease)  
- **KN liên quan BA:** ~8 tháng (SCGC)

Huynh: Whitestar 07/2025–01/2026 (6) + Likapz (3) = **9 tháng**

---

## 4. Checklist test

### Case 1 — Huynh × Whitestar
- [ ] CS **92**, ATS **~92**, 4 thẻ Tổng quan đều cao
- [ ] Breakdown CS hiển thị 30/30/25/15

### Case 3 — Đăng × Big Data DE
- [ ] CS **~62**, Exp **46**, ATS **~64**
- [ ] Keyword 70 nhưng CS không cao vì experience thấp

### Case 4 — Đăng × BeLending BA
- [ ] CS **~65**, ATS **~66**, Exp **54**
- [ ] Nhập yêu cầu **3 năm** → penalty CS & ATS

### Reject cases
- [ ] CS & ATS cùng thấp (< 35)

---

## 5. Form scan

- **CV** * — file hoặc paste
- **JD** * — file `JD_*` hoặc paste đủ nội dung (keyword nhận diện preset)
- **Tên công ty** *
- **Vị trí ứng tuyển** * — chọn từ dropdown (khi có ngành) hoặc nhập trực tiếp
- **KN tối thiểu JD:** chọn Tháng/Năm + số nguyên (tùy chọn)
- KN ứng viên: tự tính từ timeline CV

**Paste JD ≈ file JD:** cùng `detectJdPreset()` — xem bảng keyword ở [05-CV-SCAN-PAGE.md](./05-CV-SCAN-PAGE.md).

**UI:** Nhận xét kinh nghiệm hỗ trợ `**bold**` inline (component `FormattedText`).

---

## 6. Code paths

`cvJdMatch.ts` → `cvJdPresets.ts` → `atsScoring.ts` + `coverageScoring.ts` → `AnalysisDetailPage`
