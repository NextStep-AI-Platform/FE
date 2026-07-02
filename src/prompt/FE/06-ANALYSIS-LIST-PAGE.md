# NextStep AI — Analysis List Page
# Prompt #06: AnalysisListPage.tsx (thay CVResultPage list view)

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "data table search filter date range saas dashboard" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "list card search empty state" --domain ux
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires Phase 0 (AppContext) completed.

Build src/pages/AnalysisListPage.tsx — replaces the old CVResultPage as entry "Kết quả phân tích".
Route: /analysis
Sidebar label: "Kết quả phân tích"

---

### Purpose
Hiển thị DANH SÁCH các lần phân tích đã thực hiện. User click item → /analysis/:id

---

### Data Source
```ts
const { scans } = useApp()  // ScanRecord[] sorted analyzedAt desc
```

---

### Page Layout
- max-w-5xl mx-auto p-6 space-y-6

**Header**
- Title: "Kết quả phân tích"
- Subtitle: "Xem lại các lần phân tích CV của bạn"
- Optional: "Phân tích mới" button → /cv-scan (primary outline)

**Toolbar (card bar)**
- Search input: placeholder "Tìm theo tên phân tích, vị trí, công ty..."
  - Filter scans where title, role, or company includes query (case insensitive)
- Date range filter:
  - 2 native `<input type="date">` — "Từ ngày" / "Đến ngày"
  - Filter scans where analyzedAt within range (inclusive)
  - "Xóa bộ lọc" ghost button when filters active

**Results count**
- "Hiển thị X kết quả" text-slate-400 text-sm

---

### List Items

Each item = clickable card row:
```
bg-ns-card border border-ns rounded-xl px-5 py-4
hover:border-blue-500/30 transition cursor-pointer
onClick → navigate(`/analysis/${scan.id}`)
```

Content layout (flex, gap-4):
- LEFT icon: FileText or BarChart2 in blue circle
- MIDDLE (flex-1):
  - Title: `{scan.title}` — font-medium text-white
    - Format stored as: `CS_{role}_{company}` (**CS = Coverage Score**)
    - Display: "CS · {vị trí} · {công ty}" or show full title string
  - Meta: `{formattedDate}` text-slate-500 text-xs
- RIGHT:
  - Score badge: `{score}/100` — color by getScoreLabel()
  - ChevronRight icon

**Empty state**
- Illustration area (icon ScanLine large, muted)
- "Chưa có kết quả phân tích nào"
- "Bắt đầu phân tích CV đầu tiên của bạn"
- CTA → /cv-scan

**No results after filter**
- "Không tìm thấy kết quả phù hợp"
- Button clear filters

---

### Route migration
- Update App.tsx: `/analysis` → AnalysisListPage
- Redirect `/cv-result` → `/analysis`
- Update AppLayout nav label + path
- Update all internal links from /cv-result to /analysis

---

### Technical
- useMemo for filtered list
- format date: DD/MM/YYYY HH:mm (vi-VN)
- Mobile: stack toolbar vertically
```
