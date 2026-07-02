# NextStep AI — Analysis Detail Page
# Prompt #06: AnalysisDetailPage.tsx

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "analytics dashboard tabs tooltip score report" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "modal dialog scroll content preview document" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires AppContext + AnalysisListPage.

Build src/pages/AnalysisDetailPage.tsx
Route: /analysis/:id

---

### Load data
```ts
const { id } = useParams()
const { scans, plan } = useApp()
const scan = scans.find(s => s.id === id)
if (!scan) → empty/not found state + link back /analysis
const result = scan.result
const isPremium = plan.type === 'premium' || plan.type === 'vip'
```

---

### Header
- Back link: "← Danh sách phân tích" → /analysis
- Title: scan.title (formatted)
- Meta: `{role} · {company} · {date}`
- Actions: "Xuất báo cáo" (toast info "Tính năng sắp ra mắt" for MVP)
- **NO "Scan lại" button**

---

### Score Hero (always visible above tabs)
- Overall score ring + 4 metric bars
- Labels TIẾNG VIỆT:
  - Khả năng ATS
  - Độ khớp từ khóa
  - Phù hợp kinh nghiệm
  - Trình bày CV
- Each metric: label + progress bar + score + Info icon (`!`)
  - Hover tooltip content (MASTER.md §9)

---

### Tabs
```ts
type Tab = 'overview' | 'ats' | 'compatibility' | 'improve' | 'jobs' | 'courses'
```

| Tab key | Label UI | Gate |
|---------|----------|------|
| overview | Tổng quan | Free |
| ats | Kiểm tra ATS | Free |
| compatibility | Sự tương thích | Free |
| improve | Cải thiện | Free |
| jobs | Công việc phù hợp | Premium |
| courses | Khoá học | Premium |

---

### TAB: Tổng quan

**Section A — Score badges** (3 cards): ATS, Từ khóa, Kinh nghiệm summary

**Section B — CV & JD preview (NEW)**

Grid md:grid-cols-2 gap-4:

Card "Nội dung CV":
- If mode=text: show truncated preview (3 lines) + "Xem đầy đủ" → Dialog scrollable full text
- If mode=file PDF: "Xem nội dung" → Dialog mock PDF preview (placeholder text block) OR toast "Xem trước PDF sắp ra mắt"
- If mode=file DOCX: Button "Tải xuống để xem" → confirm dialog:
  "File DOCX cần tải về để xem. Bạn có muốn tải không?"
  → mock download trigger + toast success

Card "Nội dung JD": same pattern

Dialog spec:
- max-h-[70vh] overflow-y-auto
- pre/formatted text for paste content
- Close button

**Section C — Strengths & Weaknesses** (optional 2-col, if in mock data)

---

### TAB: Kiểm tra ATS

Layout: grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 (ratio 1:2, có thể 1:3)

LEFT column — ATS Score card:
- Large score number
- Label "Điểm ATS"
- Short description
- Circular or bar indicator

RIGHT column — ATS Issues list:
- Each issue: severity badge (Nghiêm trọng / Trung bình / Nhẹ) + message + fix suggestion
- Keep existing visual pattern from current CVResultPage

---

### TAB: Sự tương thích (renamed from Từ khoá)

TOP: 2 badges side by side
- "Điểm từ khóa: XX/100"
- "Điểm kinh nghiệm: XX/100"

MIDDLE: 2 columns (matched / missing keywords) — keep tag pill UI

BOTTOM: AI comment card
- Title: "Nhận xét về kinh nghiệm"
- Body: mock paragraph evaluating experience fit (Vietnamese)

---

### TAB: Cải thiện
Keep current improvement list UI with priority badges (Ưu tiên cao / Trung bình / Thấp)

---

### TAB: Công việc phù hợp (Premium gate)

If !isPremium: lock overlay + CTA /pricing (existing pattern)

If isPremium:
- List **all scan records from AppContext** (user history) where `overallScore >= 70`
- Sort by score desc, then date desc
- Each item card:
  - scan.title (CS · …), role, company, score, analyzedAt
  - Tag "Phù hợp với bạn" (green badge) on every item in this tab
  - Click → navigate to `/analysis/${scan.id}`
- Empty if no scans ≥70: "Chưa có kết quả nào đạt từ 70 điểm trở lên"

---

### TAB: Khoá học (Premium gate)

If !isPremium: lock overlay

If isPremium:
- Course cards: title, platform badge (Udemy/Coursera), rating, skill tag
- Info icon `!` next to title → tooltip: "Đề xuất vì bạn còn thiếu kỹ năng [X]"
- Button "Xem khoá học" → window.open(course.url, '_blank')
- URLs: real Udemy/Coursera format (mock href ok)

---

### Premium gate component
Reuse consistent overlay from current CVResultPage.

---

### Not found state
If id invalid: card centered "Không tìm thấy kết quả phân tích" + button /analysis

---

### Technical
- Extract small inline helpers: MetricTooltip, DocumentPreviewDialog (can stay in same file for MVP)
- useParams, useNavigate from react-router-dom
- All visible text Vietnamese
```
