# NextStep AI — Landing Page
# Prompt #01: LandingPage.tsx

## Skill Activation (run before coding)

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "AI SaaS career tool landing page hero CTA conversion" --design-system -p "NextStep AI"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "saas minimal dark modern" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "hero social-proof pricing CTA" --domain landing
```

---

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first to load the NextStep AI design system.

Build src/pages/LandingPage.tsx — the public-facing marketing page for NextStep AI.
All visible text content must be in Vietnamese.
Do NOT separate into components — write everything in one file.

### Brand & Visual Identity
- Logo: `import logoMark from '../picture/logo.png'` — 36–40px navbar
- Wordmark: `<BrandName size="md" />` — purple gradient khớp logo (không dùng name.png)
- Background: semantic tokens `bg-ns-page`, `bg-ns-card`
- Primary CTA button: bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl px-6 py-3 hover:opacity-90 transition
- All cards: bg-[#1E293B] border border-[#334155] rounded-2xl

### Page Sections (in order):

**1. Sticky Navbar**
- Logo + brand name on left
- Nav links: "Tính năng", "Bảng giá", "Về chúng tôi"
- Right: "Đăng nhập" (ghost button) + "Bắt đầu miễn phí" (blue gradient CTA button)
- Sticky top-0 with backdrop-blur-md bg-[#0F172A]/80 border-b border-[#1E293B]

**2. Hero Section**
- Badge chip: "🚀 AI-Powered Career Platform" with blue border glow
- Headline (large, bold): "Khám phá con đường sự nghiệp\nphù hợp với bạn nhất"
  - "phù hợp với bạn nhất" in blue gradient text
- Subheadline: "NextStep AI phân tích CV của bạn, đánh giá độ phù hợp theo thị trường lao động thực tế, và đề xuất lộ trình phát triển nghề nghiệp cá nhân hóa."
- Two CTA buttons: "Phân tích CV miễn phí →" (primary blue) + "Xem demo" (ghost with border)
- Social proof row below buttons: "✓ Miễn phí để bắt đầu  ·  ✓ Không cần thẻ tín dụng  ·  ✓ Kết quả trong 60 giây"
- Hero visual: A dark card mockup showing a CV score dashboard (use CSS/HTML, not an image):
  - Score circle: 87/100 in blue
  - 3 metric rows: ATS Score, Keyword Match, Experience Fit with progress bars

**3. How It Works (3 steps)**
- Section title: "Chỉ 3 bước đơn giản"
- Step cards in a row (md:grid-cols-3):
  1. "Tải lên CV" — icon: Upload — "Tải lên CV PDF hoặc paste nội dung trực tiếp"
  2. "AI Phân Tích" — icon: Brain/Cpu — "AI đánh giá CV theo ngành nghề và thị trường lao động hiện tại"
  3. "Nhận Kết Quả" — icon: BarChart2 — "Nhận điểm số, điểm mạnh/yếu, khoá học đề xuất và gợi ý công ty phù hợp"
- Connecting arrows between steps on desktop

**4. Features Section**
- Section title: "Tính năng nổi bật"
- 4 feature cards in 2x2 grid (md:grid-cols-2):
  1. "Chấm điểm CV bằng AI" — icon: Star — Phân tích CV theo ngành nghề mục tiêu, kiểm tra ATS, keyword gap, cách trình bày
  2. "Gợi ý công ty phù hợp" — icon: Building2 — So sánh CV với JD thực tế, xếp hạng độ tương thích với các doanh nghiệp đang tuyển
  3. "Lộ trình học tập" — icon: BookOpen — Đề xuất khoá học từ Udemy, Coursera cho từng kỹ năng còn thiếu
  4. "AI Mock Interview" — icon: Mic — Luyện phỏng vấn 1-1 với AI theo đúng vị trí và ngành nghề, có phân tích câu trả lời
- Each card: blue icon on top, title bold, description text-slate-400

**5. Pricing Section**
- Section title: "Bảng giá minh bạch"
- 3 pricing cards (md:grid-cols-3), middle card "Premium" has blue ring + "Phổ biến nhất" badge:

  Card 1 — Freemium (Basic)
  - Price: "Miễn phí"
  - Features: 3 lần scan CV/tháng, Phân tích keyword cơ bản, Lộ trình học tập tổng quát
  - CTA: "Bắt đầu miễn phí" (outline button)

  Card 2 — Premium Analysis (highlighted)
  - Price: "49.000đ/tháng" + note "hoặc 99.000đ"
  - Features: Scan CV không giới hạn, Chỉnh sửa câu theo AI + action verbs ATS-chuẩn, Lộ trình chi tiết (link khoá học cụ thể), Gợi ý công ty phù hợp
  - CTA: "Nâng cấp ngay" (blue gradient button)

  Card 3 — AI Mock Interview (VIP)
  - Price: "149.000đ/5 buổi" + note "Lẻ: 19.000–29.000đ/buổi"
  - Features: 5 buổi phỏng vấn AI 1-1 (Voice/Text), Điều chỉnh độ khó (Dễ/Vừa/Khó), Báo cáo lỗi chi tiết + câu mẫu chuẩn chuyên gia, Bao gồm scan CV không giới hạn
  - CTA: "Mua gói VIP" (outline button)

**5b. Testimonials carousel (2026-07-03)** — ngay **trước** stats bar
- `FeedbackCarousel` + `src/data/testimonials.ts`
- Avatar: `public/picture/user-1.png` … `user-5.png`
- Desktop: viewport **overflow-hidden** — chỉ 3 card, card cố định **340px** cao
- Auto-slide 5s (`transform` trái), nút `<` `>` ngoài khung, pause khi hover
- Nội dung feedback trong `testimonials.ts`: văn phong thân thiện, ít thuật ngữ kỹ thuật

**6. Social Proof / Stats Bar**
- Full-width dark strip: 3 stats side by side
  - "10.000+" → "Người dùng đã phân tích CV"
  - "95%" → "Người dùng cải thiện CV sau lần đầu"
  - "500+" → "Công ty trong cơ sở dữ liệu"
- Numbers in large blue gradient text

**7. Footer**
- Logo + tagline: "Đồng hành cùng bạn trên mọi bước sự nghiệp."
- Links: Tính năng · Bảng giá · Chính sách bảo mật · Điều khoản sử dụng
- Copyright: © 2025 NextStep AI. All rights reserved.
- border-t border-[#1E293B] bg-[#0F172A]

### Technical Requirements
- Scroll animations: `ScrollReveal` component (Intersection Observer) — xem `17-ANIMATIONS-RESPONSIVE.md`
- Hover: `.badge-pill` on chips, `.card-interactive` on feature/pricing cards
- Other motion: Tailwind `transition` classes (no framer-motion)
- Responsive: mobile-first, md: and lg: breakpoints
- Import icons from lucide-react
- No placeholder images — use CSS mockups or icon-based visuals
- onClick on CTA buttons: navigate to /auth using react-router-dom useNavigate
- Pricing CTA: navigate to /pricing or scroll to section
```
