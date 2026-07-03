# NextStep AI — CV Scan Page (MVP Redesign)
# Prompt #05: CVScanPage.tsx

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dual panel form upload paste side by side" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "file upload history list reuse" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires Phase 0 AppContext.

Rebuild src/pages/CVScanPage.tsx for MVP dual CV+JD input flow.

---

> **Cập nhật 2026-07-03:** Layout 3 cột cố định theo panel Process (~580px), kinh nghiệm **tự tính từ timeline CV** — xem [16-CV-JD-DEMO-CASES.md](./16-CV-JD-DEMO-CASES.md)

### Layout Overview

Single page (no multi-step wizard). Sections top to bottom:

1. Page header
2. **3 cột cố định chiều cao** (desktop ~580px): CV | JD | Cấu hình **hoặc** Tiến hành phân tích
3. CV upload history (conditional)

max-w-6xl mx-auto p-6 space-y-6

Grid desktop: `lg:flex-row`, CV+JD `lg:flex-[2]`, cột phải `lg:flex-[1]`

---

### Section 1: Header
- Title: "Phân tích CV"
- Subtitle: "Tải hoặc dán CV và JD để AI đánh giá mức phù hợp (demo mock)"

---

### Section 2: Dual Panels

Grid: `grid lg:grid-cols-2 gap-6`

Each panel = card bg-ns-card border border-ns rounded-2xl p-6

**Panel A — CV của bạn** * (chỉ tải file)
- Tab **Dán nội dung** disabled — hover hiện tooltip **"Phát triển sau"**
- Chỉ PDF/DOCX

**Panel B — Mô tả công việc (JD)** * (bắt buộc)

Inside each panel:
- Toggle tabs: "Tải file" | "Dán nội dung"
- Upload mode:
  - Drag & drop zone (pdf, docx) max 5MB
  - Show file chip: name + size + remove
- Paste mode:
  - Textarea min-h-[200px] placeholder Vietnamese
  - Character count

State per panel:
```ts
cv: { mode: 'file'|'text', file: File|null, text: string }
jd: { mode: 'file'|'text', file: File|null, text: string }
```

Validation before analyze:
- **CV** — file PDF/DOCX (không paste)
- **JD** — file hoặc paste (bắt buộc, phải nhận diện preset demo)
- **Tên công ty** * — bắt buộc
- **Vị trí ứng tuyển** * — bắt buộc (chọn từ dropdown khi có ngành, hoặc nhập trực tiếp)
- JD phải được `detectJdPreset()` nhận diện (file JD_* hoặc paste đủ keyword demo)

Nút **Bắt đầu phân tích** disabled khi thiếu bất kỳ trường bắt buộc nào ở trên.

---

### Section 3: CV History List

Show ONLY if `cvFiles.length > 0` (from AppContext)

Title: "CV đã tải lên trước đó"
List items: fileName · size · uploadedAt (DD/MM/YYYY HH:mm)
Click item → pre-select as current CV file (mock: store reference, no re-upload)
Highlight selected item

Note: Text-pasted CV does NOT appear in this list.

When new file uploaded → addCVFile() to context

---

### Section 4: Configuration

Card "Cấu hình phân tích"

**Tên công ty** * (required)
- Text input — user tự nhập, **không** auto-fill từ JD
- Bắt buộc để tạo tên kết quả `CS_{role}_{company}`
- Helper: "Dùng để đặt tên kết quả phân tích (Coverage Score)"

**Ngành nghề** (tùy chọn — giúp gợi ý vị trí)
- Select from INDUSTRIES + option "Khác" → text input

**Vị trí ứng tuyển** * (bắt buộc)
- Chưa chọn ngành → nhập trực tiếp (text input)
- Đã chọn ngành → dropdown ROLES_BY_INDUSTRY hoặc "Khác..." → nhập tùy chỉnh
- Dùng làm tên kết quả: `CS_{vị_trí}_{công_ty}` — **không** fallback `ViTri`

**Kinh nghiệm**

**Ứng viên:** tự tính từ timeline CV (union, không cộng trùng). Với JD Big Data/BA còn có `relevantMonths` — chỉ tính mốc liên quan domain.

**Yêu cầu JD tối thiểu (tùy chọn):** chọn Tháng/Năm + số nguyên. Không hiển thị helper text dài trong form.

Ma trận demo: [16-CV-JD-DEMO-CASES.md](./16-CV-JD-DEMO-CASES.md) · CS: [19-COVERAGE-SCORING.md](./19-COVERAGE-SCORING.md) — **2 happy · 2 partial · 2 reject**.

### Validation tài liệu (demo guard)

`validateScanDocuments()` trong `src/lib/cvJdMatch.ts` — chạy trước khi phân tích:

| Tình huống | Hành vi |
|------------|---------|
| File `CV_*` trong ô JD | Toast lỗi, **không** chạy scan |
| Paste/dán nội dung CV (tên ứng viên) vào ô JD | Toast lỗi |
| File `JD_*` trong ô CV | Toast lỗi |
| CV file + **paste nội dung JD** (đủ keyword) | ✅ Cho phép — `detectJdPreset()` đọc `textContent` |
| CV file + JD file đúng bộ demo | ✅ Cho phép |
| JD trống | ❌ **Không** cho phân tích — nút disabled |
| Thiếu vị trí ứng tuyển | ❌ Nút disabled + toast |

**Paste JD ≈ file JD** — cùng `detectJdPreset()`. Keyword tối thiểu theo JD:

| JD preset | Keyword paste gợi ý |
|-----------|----------------------|
| `whitestar_livestream` | Whitestar, OBS, livestream, Seller Center |
| `bd_specialist` | Business Development, Essential Flavours, F&B, B2B sales |
| `belending_ba` | Be Group, Belending, Business Analyst, lending, disbursement |
| `cybersecurity` | an ninh mạng, Vina Aspire, OWASP, pentest |
| `big_data_de` | data pipeline, Databricks, Azure Synapse, Big Data, Spark |

Fields bắt buộc: CV, JD, tên công ty, vị trí ứng tuyển. Ngành & KN tối thiểu JD là tùy chọn.

---

### Section 5: Analyze

Quota notice (free plan):
"Bạn còn {remaining}/{limit} lượt scan miễn phí tháng này"

**Khi hết quota (free user):**
- Blur toàn bộ nội dung trang scan (`blur-sm pointer-events-none` trên main content)
- Modal/popup centered (không dismiss bằng click outside):
  - Lock icon
  - Title: "Bạn đã hết lượt scan miễn phí"
  - Body: "Nâng cấp Premium để phân tích CV không giới hạn và nhận insight chuyên sâu"
  - CTA: "Nâng cấp Premium" → /pricing
  - Secondary: "Quay lại" → /dashboard

Button "Bắt đầu phân tích" — disabled if thiếu CV, JD, company, vị trí OR quota exceeded

**Khi đang phân tích:** cột phải chuyển từ "Cấu hình phân tích" → **"Tiến hành phân tích"**
- Progress bar tổng (%)
- Checklist 5 bước (xem `src/lib/analysisProgress.ts`):
  1. Trích xuất nội dung CV & JD
  2. Kiểm tra cấu trúc ATS
  3. Đối chiếu từ khóa nghề nghiệp
  4. Đánh giá kinh nghiệm & kỹ năng
  5. Tổng hợp Coverage Score
- Mỗi bước: pending → active (spinner) → done (check xanh)
- Thời gian mock ~2.8s, sau đó navigate `/analysis/:id`

onClick (when quota OK):
1. setAnalyzing(true)
2. Mock progress 2-3s
3. generateMockResult(config, cv, jd)
4. Build ScanRecord:
   - id: `scan_${Date.now()}`
   - title: `CS_${sanitize(role)}_${sanitize(company)}`
   - incrementScanUsage()
5. toast.success("Phân tích hoàn tất", "Coverage Score đã được tạo")
6. navigate(`/analysis/${record.id}`)

**Toast validation / quota:**

| Sự kiện | Toast |
|---------|-------|
| Thiếu CV | error · "Thiếu CV" |
| Thiếu JD | error · "Thiếu JD" |
| Thiếu tên công ty | error · "Thiếu tên công ty" |
| Thiếu vị trí | error · "Thiếu vị trí" |
| Hết lượt free | warning · "Hết lượt scan miễn phí" · "Nâng cấp Premium để phân tích CV không giới hạn" (+ blur upsell popup) |
| Tài liệu không hợp lệ | error · tiêu đề/message từ doc check |
| Hoàn tất | success · "Phân tích hoàn tất" · "Coverage Score đã được tạo" |

---

### UX Notes
- Smooth transitions between upload/paste tabs
- cursor-pointer on all interactive elements
- Mobile: panels stack, history list full width
- Do NOT parse real PDF/DOCX — mock only

---

### Technical
- useApp(), useToast(), useNavigate()
- sanitize title: replace spaces with underscore, remove special chars
- Keep INDUSTRIES, ROLES from constants
```
