# NextStep AI — Setup & Skills Installation
# Prompt #00: Project Bootstrap

## Context
Platform: NextStep AI — AI-powered career platform for Vietnamese job seekers
Tech Stack: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
Language: Vietnamese UI, English code
Logo: Blue gradient geometric "N" mark + "NEXTSTEP AI" wordmark
Brand: Dark slate navy background, blue gradient accent, modern AI-native aesthetic

## Skills to Install

Before starting any feature, copy the skills from the cloned repo into this project:

```powershell
# Run from .
Copy-Item -Recurse -Force "ui-ux-pro-max-skill\.claude\skills\ui-ux-pro-max" ".claude\skills\ui-ux-pro-max"
Copy-Item -Recurse -Force "ui-ux-pro-max-skill\.claude\skills\ui-styling" ".claude\skills\ui-styling"
Copy-Item -Recurse -Force "ui-ux-pro-max-skill\.claude\skills\design-system" ".claude\skills\design-system"
Copy-Item -Recurse -Force "ui-ux-pro-max-skill\.claude\skills\brand" ".claude\skills\brand"
```

## Step 1: Generate Design System (Run FIRST before any feature)

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "AI career tool saas professional modern minimal dark" --design-system --persist -p "NextStep AI"
```

Expected output saved to:
- `FE/00-DESIGN-SYSTEM.md` — Global design rules (đã có sẵn trong repo)

## Step 2: Scaffold React + TypeScript Project

```
Create a new React + TypeScript + Vite project for NextStep AI with the following setup:

Project name: nextstep-ai
Framework: React + TypeScript (Vite)
Styling: Tailwind CSS v3 + shadcn/ui
Additional packages: react-router-dom, lucide-react, clsx, tailwind-merge

Run these commands:
1. npm create vite@latest nextstep-ai -- --template react-ts
2. cd nextstep-ai
3. npm install
4. npx shadcn@latest init (choose: TypeScript, Default style, slate base color, src/components/ui path)
5. npm install react-router-dom lucide-react clsx tailwind-merge

Then configure tailwind.config.ts with dark mode: 'class' and extend colors:
- primary: blue gradient (#3B82F6 → #1D4ED8)
- background: dark slate (#0F172A, #1E293B)
- surface: (#1E293B, #334155)
- accent: (#60A5FA)
- text: (#F8FAFC, #CBD5E1, #94A3B8)
```

## Step 3: Base Project Structure

```
Create the following folder structure inside src/:

src/
├── assets/
│   └── logo.png          (NextStep AI logo — blue gradient N mark)
├── components/
│   └── ui/               (shadcn auto-generated)
├── pages/
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── CVScanPage.tsx
│   ├── AnalysisListPage.tsx
│   ├── AnalysisDetailPage.tsx
│   ├── MockInterviewPage.tsx
│   ├── PricingPage.tsx
│   └── ProfilePage.tsx
├── layouts/
│   ├── RootLayout.tsx
│   └── AppLayout.tsx
├── types/
│   └── index.ts
├── lib/
│   └── utils.ts
├── constants/
│   └── index.ts
└── App.tsx

Create src/App.tsx with react-router-dom routes connecting all pages.
Create RootLayout.tsx with a sticky Navbar and Footer.
Create AppLayout.tsx with Sidebar + main content area for authenticated pages.
All text content in Vietnamese. All variable/function names in English.
```

## Brand Token Reference (use in all pages)

```
Colors:
- bg-[#0F172A]     → page background (darkest)
- bg-[#1E293B]     → card/surface background
- bg-[#334155]     → elevated surface / sidebar
- text-[#F8FAFC]   → primary text (white)
- text-[#CBD5E1]   → secondary text
- text-[#94A3B8]   → muted text / placeholders
- from-[#3B82F6] to-[#1D4ED8] → gradient blue (CTA, accents)
- border-[#334155] → dividers

Logo: always use /assets/logo.png — never recreate or substitute
Brand name display: "NextStep" bold + " AI" in blue gradient
```
