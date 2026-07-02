# NextStep AI — Dashboard Page
# Prompt #04: DashboardPage.tsx

## Skill Activation

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "saas dashboard analytics overview dark modern" --design-system -p "NextStep AI"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard bento grid cards metrics" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "empty states loading skeleton progressive disclosure" --domain ux
```

---

> **Cập nhật 2026-06-22:** Xem chi tiết logic mới tại [15-UI-POLISH.md](./15-UI-POLISH.md)

### Dashboard — Công ty phù hợp (MVP logic)

- Chỉ hiển thị data khi user **Premium/VIP** (không free)
- Scan `overallScore >= 70`, trong **30 ngày**
- List = các lượt scan đủ điều kiện, **mới nhất trước**
- Click item → `/analysis/:scanId`
- `max-h-[280px] overflow-y-auto`

### Dashboard — Khoá học đề xuất

- Premium/VIP, scans 30 ngày
- Aggregate `result.courses`, đếm trùng theo `title`, sort count ↓
- Click → `course.url` (tab mới)
- Scroll dọc tương tự công ty

---
All text in Vietnamese. Single file, no component extraction.
Use mock/static data — no real API calls.

### Mock Data (define at top of file)
```ts
const mockUser = { name: 'Nguyễn Văn A', plan: 'free', scansUsed: 2, scansLimit: 3 }
const mockCVScore = { overall: 72, ats: 68, keyword: 75, experience: 74, presentation: 70 }
const mockRecentScans = [
  { id: 1, cvName: 'CV_Frontend_Dev.pdf', date: '03/06/2025', score: 72, role: 'Frontend Developer', status: 'completed' },
  { id: 2, cvName: 'CV_ReactJS.pdf', date: '28/05/2025', score: 65, role: 'ReactJS Developer', status: 'completed' },
]
const mockSuggestedCompanies = [
  { name: 'FPT Software', match: 88, logo: 'FS', industry: 'Công nghệ' },
  { name: 'VNG Corporation', match: 82, logo: 'VN', industry: 'Công nghệ' },
  { name: 'Tiki', match: 76, logo: 'TK', industry: 'E-commerce' },
]
const mockCourses = [
  { title: 'React - The Complete Guide', platform: 'Udemy', skill: 'React.js', rating: 4.8 },
  { title: 'TypeScript Fundamentals', platform: 'Udemy', skill: 'TypeScript', rating: 4.7 },
  { title: 'System Design for Interviews', platform: 'Coursera', skill: 'System Design', rating: 4.9 },
]
```

### Page Layout
- Page wrapper: p-6 space-y-6

**Section 1: Welcome Banner**
- "Xin chào, Nguyễn Văn A 👋" — text-2xl font-bold text-white
- Subtitle: "Bạn đã sử dụng 2/3 lượt phân tích CV miễn phí tháng này"
- Progress bar: w-full bg-[#334155] h-2 rounded-full → inner bar bg-blue-500 w-2/3
- If plan === 'free': show upgrade banner card below:
  - bg-gradient-to-r from-blue-900/40 to-blue-700/20 border border-blue-500/30 rounded-2xl p-4
  - "🚀 Nâng cấp Premium để scan không giới hạn và nhận insight chuyên sâu"
  - Button: "Xem gói Premium" → /pricing

**Section 2: Stats Row (4 cards in grid-cols-2 md:grid-cols-4)**
Each card: bg-[#1E293B] border border-[#334155] rounded-2xl p-5

1. "Điểm CV Gần Nhất" — value: "72/100" (large blue) — icon: Star
2. "Lượt Scan Còn Lại" — value: "1 lượt" (large) — icon: ScanLine — color yellow if ≤1
3. "Công Ty Phù Hợp" — value: "3 công ty" — icon: Building2
4. "Khoá Học Đề Xuất" — value: "3 khoá" — icon: BookOpen

**Section 3: Quick Actions (Primary CTAs)**
- Row of 2 big action cards (md:grid-cols-2):

  Card A — "Phân tích CV mới"
  - bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6
  - Icon: Upload (large, 40px)
  - Title: "Phân tích CV mới" bold
  - Description: "Tải lên CV và nhận đánh giá chi tiết trong 60 giây"
  - Button: "Bắt đầu ngay →" white button → navigate('/cv-scan')

  Card B — "Luyện phỏng vấn AI"
  - bg-[#1E293B] border border-[#334155] rounded-2xl p-6
  - Icon: Mic (large, 40px, blue)
  - Title: "Luyện phỏng vấn AI" bold
  - Description: "Mô phỏng buổi phỏng vấn thực tế với AI cho vị trí bạn muốn"
  - If plan === 'free': show lock icon + "Cần gói Premium" badge
  - Button: "Bắt đầu luyện →" (if premium) OR "Nâng cấp để dùng" (if free) → /mock-interview or /pricing

**Section 4: CV Score Overview**
- Title: "Điểm phân tích CV gần nhất" + "Xem chi tiết →" link to /cv-result
- Card: bg-[#1E293B] border border-[#334155] rounded-2xl p-6
- Layout: left = score circle, right = breakdown bars

- Score Circle (CSS only):
  - Large circle (120px) with blue border ring
  - Center: "72" text-4xl font-bold text-blue-400 + "/100" text-slate-400
  - Below: "Khá tốt" badge bg-blue-600/20 text-blue-400

- Score Breakdown (right side, space-y-3):
  - ATS Compatibility: 68% — progress bar
  - Keyword Match: 75% — progress bar
  - Experience Fit: 74% — progress bar
  - CV Presentation: 70% — progress bar
  - Each: label text-slate-400 text-sm, value text-white text-sm, bar bg-[#334155] h-2 rounded → inner bg-blue-500

**Section 5: Lịch sử phân tích (Recent Scans)**
- Title: "Lịch sử phân tích" + "Xem tất cả →"
- Table-style list (not a real table, use flex rows):
  Each row: bg-[#1E293B] border border-[#334155] rounded-xl px-5 py-4 flex items-center justify-between
  - Left: FileText icon + CV name (text-white) + date (text-slate-400 text-sm)
  - Center: role tag (text-slate-300 text-sm)
  - Right: score badge (bg-blue-600/20 text-blue-400 rounded-lg px-3 py-1 text-sm font-semibold) + "Xem lại" button

**Section 6: Gợi ý công ty phù hợp**
- Title: "Công ty phù hợp với bạn" + lock badge if free plan: "Premium"
- If free: blurred/dimmed content with overlay card "Nâng cấp để xem gợi ý công ty phù hợp"
- If premium (simulate with isPremium state, default false):
  - Grid md:grid-cols-3 of company cards:
    Each card: bg-[#1E293B] border border-[#334155] rounded-2xl p-5
    - Company logo: circular avatar with initials (bg-gradient-to-br from-blue-500 to-blue-700)
    - Company name + industry tag
    - Match score: "88% phù hợp" in green-400 for >80, yellow-400 for 60-80

**Section 7: Khoá học đề xuất**
- Title: "Khoá học nên học tiếp theo"
- 3 course cards in a row (md:grid-cols-3):
  Each: bg-[#1E293B] border border-[#334155] rounded-2xl p-5
  - Platform badge: "Udemy" or "Coursera" — small pill
  - Course title text-white font-medium
  - Skill tag: text-blue-400 text-sm
  - Rating: ⭐ 4.8 text-yellow-400
  - "Xem khoá học" button → # (external link placeholder)

### Technical Requirements
- useState for isPremium (default false) — for demo toggle
- All scores: static mock data
- Smooth transitions on hover: hover:border-blue-500/50 transition-all
- Responsive: single column mobile, multi-column desktop
- No charts library — use CSS progress bars only
```
