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

> **Cập nhật 2026-06-22:** Layout 2:1, kinh nghiệm 1 hàng — [15-UI-POLISH.md](./15-UI-POLISH.md)

### Layout Overview

Single page (no multi-step wizard). Sections top to bottom:

1. Page header
2. Dual input panels (CV | JD) — side by side on lg+, stacked on mobile
3. CV upload history (conditional)
4. Configuration form
5. Analyze CTA + loading state

max-w-6xl mx-auto p-6 space-y-6

---

### Section 1: Header
- Title: "Phân tích CV"
- Subtitle: "Tải hoặc dán CV và JD để AI đánh giá mức phù hợp (demo mock)"

---

### Section 2: Dual Panels

Grid: `grid lg:grid-cols-2 gap-6`

Each panel = card bg-ns-card border border-ns rounded-2xl p-6

**Panel A — CV của bạn**
**Panel B — Mô tả công việc (JD)**

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
- At least CV has content (file OR text)
- JD optional but recommended (show hint)

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

**Ngành nghề** (optional)
- Select from INDUSTRIES + option "Khác" → text input

**Vị trí ứng tuyển** (optional)
- Select from ROLES_BY_INDUSTRY + "Khác" → text input

**Kinh nghiệm** (optional) — **Range 2 field**
- Layout: `[ Từ ] [ số ] năm` — `[ Đến ] [ số ] năm` (inline hoặc grid 2 cột)
- Validation: số nguyên ≥ 0; `đến` ≥ `từ`
- Lưu: `{ experienceFrom: number, experienceTo: number }`
- Display: "3–5 năm" hoặc "5+ năm" nếu from === to

Fields optional trừ tên công ty — AI sẽ xử lý sau.

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

Button "Bắt đầu phân tích" — disabled if no CV or no company name OR quota exceeded

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
   - title: `CS_${sanitize(role||'ViTri')}_${sanitize(company)}`
   - incrementScanUsage()
5. toast.success("Phân tích hoàn tất")
6. navigate(`/analysis/${record.id}`)

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
