# NextStep AI — Hướng dẫn dự án

> **Đọc file này trước** khi clone repo, chạy source, hoặc implement tính năng mới.  
> Cập nhật: 2026-06-22

---

## 1. Giới thiệu dự án

**NextStep AI** là nền tảng AI hỗ trợ người tìm việc tại Việt Nam.

| | |
|---|---|
| **Sản phẩm** | Phân tích CV theo JD, Coverage Score, gợi ý cải thiện, (Premium) công ty/khoá học, (VIP) luyện phỏng vấn AI |
| **Ngôn ngữ UI** | Tiếng Việt |
| **Code** | English (tên biến, function, file) |
| **Giai đoạn hiện tại** | **FE MVP** — chạy được end-to-end với **mock data + localStorage** |
| **Tiếp theo** | Backend FastAPI + PostgreSQL, tích hợp API, nối AI service (team AI riêng) |

### Gói dịch vụ (business logic)

| Gói | Quyền chính |
|-----|-------------|
| **Freemium** | 3 lượt scan CV/tháng, tabs phân tích cơ bản |
| **Premium** | Scan không giới hạn + tab Công việc + Khoá học |
| **VIP** | Premium + 5 buổi Mock Interview AI |

---

## 2. Cấu trúc repository (Git root = folder ``)

```
                     ← clone repo, chạy npm ở đây
├── README.md                    ← quick start → trỏ tới src/prompt/
├── src/
│   ├── prompt/                  ← TÀI LIỆU SPEC (.md) — push cùng Git
│   │   ├── README.md            ← file này
│   │   ├── FE/
│   │   ├── BE/
│   │   └── API_Integrate/
│   ├── pages/                   ← mỗi route một page
│   ├── layouts/
│   ├── contexts/                ← AppContext, Theme, Toast
│   ├── types/index.ts           ← contract dữ liệu (quan trọng cho BE)
│   └── lib/
└── public/picture/              ← logo, banner PNG/SVG
```

### Đặt `prompt/` trong `src/` có ảnh hưởng gì?

| Khía cạnh | Kết quả |
|-----------|---------|
| **Chạy app (`npm run dev`)** | ✅ Không ảnh hưởng — Vite chỉ bundle file được `import` |
| **Build production** | ✅ Không đưa `.md` vào `dist/` |
| **TypeScript (`tsc`)** | ✅ Đã `exclude: ["src/prompt"]` trong `tsconfig.json` |
| **Git** | ✅ Commit/push bình thường — `.gitignore` không chặn |
| **Kích thước bundle** | ✅ Không tăng |

> Folder `BE/` trong `src/prompt/` chỉ là **tài liệu** — chưa có project `nextstep-api/` trong repo.

---

## 3. Yêu cầu môi trường

| Công cụ | Phiên bản gợi ý |
|---------|------------------|
| **Node.js** | 20 LTS trở lên |
| **npm** | 10+ (đi kèm Node) |
| **Git** | Bất kỳ bản mới |
| **Trình duyệt** | Chrome / Edge (dev) |

**Backend (khi implement sau):** Python 3.11+, PostgreSQL 15+, (tuỳ chọn) Docker.

**AI service:** Do thành viên khác phụ trách — contract xem [BE/BE-09-AI-INTEGRATION.md](./BE/BE-09-AI-INTEGRATION.md).

---

## 4. Setup & chạy Frontend

### 4.1 Clone và cài dependency

```powershell
git clone <repo-url>
cd nextstep-ai
npm install
```

### 4.2 Chạy development

```powershell
npm run dev
```

Mở trình duyệt theo URL Vite in ra (thường **http://localhost:5173**).

### 4.3 Build production (kiểm tra lỗi TypeScript)

```powershell
npm run build
```

### 4.4 Preview bản build

```powershell
npm run preview
```

### 4.5 Biến môi trường (phase API — chưa bắt buộc)

Khi bắt đầu tích hợp BE, tạo `.env` ở **root repo** (cạnh `package.json`):

```env
VITE_USE_API=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Chi tiết: [API_Integrate/FE-20-OVERVIEW.md](./API_Integrate/FE-20-OVERVIEW.md).

---

## 5. Demo nhanh trên FE hiện tại

MVP **không cần backend**. Dữ liệu lưu `localStorage` key `ns-app-state`.

| Bước | Hành động |
|------|-----------|
| 1 | Vào `/` → **Bắt đầu miễn phí** hoặc **Đăng nhập** |
| 2 | **Đăng ký** email/password → chuyển tab Login → đăng nhập → `/dashboard` |
| 3 | **Google demo** → luôn login `demo@nextstep.ai` (không dùng email trong form) |
| 4 | **Phân tích CV** → `/cv-scan` → upload/dán CV + JD → Bắt đầu phân tích |
| 5 | Xem kết quả → `/analysis` → click vào item → `/analysis/:id` |
| 6 | **Nâng cấp** → `/pricing` → mock confirm → badge Premium/VIP trên header |
| 7 | **Mock Interview** → cần VIP → `/mock-interview` |

**Theme:** Trang public (`/`, `/auth`, `/about`, `/privacy`) luôn dark. Toggle sáng/tối chỉ khi đã đăng nhập (icon mặt trăng trên header).

**Assets:** Logo và banner trong `public/picture/` — danh sách xem [FE/16-THEME-ASSETS-PAGES.md](./FE/16-THEME-ASSETS-PAGES.md).

---

## 6. Routes chính

| Route | Trang | Auth |
|-------|-------|------|
| `/` | Landing | Public |
| `/auth` | Đăng nhập / Đăng ký | Public |
| `/about`, `/privacy` | Static | Public |
| `/dashboard` | Tổng quan | ✅ |
| `/cv-scan` | Phân tích CV | ✅ |
| `/analysis` | Danh sách kết quả | ✅ |
| `/analysis/:id` | Chi tiết phân tích | ✅ |
| `/pricing` | Bảng giá | ✅ |
| `/mock-interview` | Luyện phỏng vấn | ✅ (VIP) |
| `/profile` | Hồ sơ & Cài đặt | ✅ |

Code routes: `src/App.tsx`.

---

## 7. Cấu trúc tài liệu `src/prompt/`

```
src/prompt/
├── README.md           ← onboarding dự án (file này)
├── FE/                 ← Frontend: design, từng page, checklist
├── BE/                 ← Backend: SQL, API spec, AI contract
└── API_Integrate/      ← Migrate FE từ mock sang REST API
```

### Ai đọc gì?

| Vai trò | Đọc trước | Sau đó |
|---------|-----------|--------|
| **FE dev** | File này → [FE/00-DESIGN-SYSTEM.md](./FE/00-DESIGN-SYSTEM.md) → [FE/MVP-CHECKLIST.md](./FE/MVP-CHECKLIST.md) | Spec page đang làm (`FE/01`–`FE/09`) |
| **BE dev** | File này → [BE/README.md](./BE/README.md) → [BE/BE-01-DATA-MODEL.md](./BE/BE-01-DATA-MODEL.md) | BE-02 … BE-08 theo module |
| **AI dev** | [BE/BE-09-AI-INTEGRATION.md](./BE/BE-09-AI-INTEGRATION.md) | Phối hợp BE về JSON output |
| **Full-stack / integrate** | [API_Integrate/README.md](./API_Integrate/README.md) | FE-20 → FE-24 theo phase |

---

## 8. Cách đọc file `.md` để implement code

### Nguyên tắc chung

1. **Design system trước, page sau** — [FE/00-DESIGN-SYSTEM.md](./FE/00-DESIGN-SYSTEM.md) là quy tắc màu, typography, component. Spec từng page **override** nếu mâu thuẫn.
2. **Infra trước khi sửa nhiều page** — [FE/11-GLOBAL-INFRA.md](./FE/11-GLOBAL-INFRA.md) mô tả `AppContext`, storage, toast, types.
3. **Một page = một file spec** — ví dụ sửa CV Scan → đọc [FE/05-CV-SCAN-PAGE.md](./FE/05-CV-SCAN-PAGE.md).
4. **BE/ và API_Integrate/** là **gợi ý** — có thể thay đổi khi triển khai; ưu tiên giữ **cùng shape JSON** với `src/types/index.ts`.

### Quy trình FE (sửa / thêm tính năng)

```
1. Đọc FE/00-DESIGN-SYSTEM.md
2. Xem FE/MVP-CHECKLIST.md — phase nào, task nào
3. Đọc FE/XX-<PAGE>.md tương ứng route
4. Mở file code tương ứng trong `src/pages/`, `src/contexts/`, …
5. (Tuỳ chọn) FE/15–17 nếu liên quan theme, animation, assets
6. Chạy npm run build để verify TypeScript
```

### Quy trình BE (khi bắt đầu implement)

```
1. Đọc BE/BE-00-OVERVIEW.md — cấu trúc FastAPI, env
2. Chạy script SQL trong BE/BE-01-DATA-MODEL.md
3. Implement lần lượt BE-02 (auth) → BE-08
4. Nối AI qua BE-09 (hoặc mock JSON giai đoạn đầu)
5. Swagger: http://localhost:8000/docs
```

### Quy trình tích hợp API (FE + BE)

```
1. Đọc API_Integrate/FE-20-OVERVIEW.md
2. FE-21 — bảng map AppContext method → endpoint
3. FE-22 — implement api client
4. FE-24 — tick từng phase (auth → scan → billing …)
5. Bật VITE_USE_API=true khi module đã xong
```

### Dùng với Cursor / AI assistant

Prompt mẫu:

```
Read src/prompt/README.md and src/prompt/FE/00-DESIGN-SYSTEM.md.
Then read src/prompt/FE/05-CV-SCAN-PAGE.md and implement changes in src/pages/CVScanPage.tsx.
Follow existing code conventions. UI text in Vietnamese.
```

---

## 9. File code quan trọng (FE)

| File | Vai trò |
|------|---------|
| `src/types/index.ts` | **Source of truth** types — BE cần mirror |
| `src/contexts/AppContext.tsx` | State, auth, scans, plan, notifications |
| `src/lib/storage.ts` | localStorage `ns-app-state` |
| `src/constants/index.ts` | Routes, plan limits, industries |
| `src/data/mockAnalysis.ts` | Mock kết quả phân tích (thay bằng API sau) |
| `src/index.css` | Theme tokens, animation utilities |
| `src/App.tsx` | Router |

---

## 10. Index tài liệu chi tiết

### Frontend — [FE/](./FE/)

| Nhóm | Files |
|------|-------|
| Onboarding FE | [FE/README.md](./FE/README.md), [FE/00-SETUP.md](./FE/00-SETUP.md) |
| Design | [FE/00-DESIGN-SYSTEM.md](./FE/00-DESIGN-SYSTEM.md) |
| Tracker | [FE/MVP-CHECKLIST.md](./FE/MVP-CHECKLIST.md) |
| Infra | [FE/10-APP-ROUTER.md](./FE/10-APP-ROUTER.md), [FE/11-GLOBAL-INFRA.md](./FE/11-GLOBAL-INFRA.md), [FE/12-LIGHT-THEME.md](./FE/12-LIGHT-THEME.md) |
| Pages | [01 Landing](./FE/01-LANDING-PAGE.md) · [02 Auth](./FE/02-AUTH-PAGE.md) · [03 Layout](./FE/03-APP-LAYOUT.md) · [04 Dashboard](./FE/04-DASHBOARD.md) · [05 CV Scan](./FE/05-CV-SCAN-PAGE.md) · [06 Analysis](./FE/06-ANALYSIS-LIST-PAGE.md) · [06 Detail](./FE/06-ANALYSIS-DETAIL-PAGE.md) · [07 Interview](./FE/07-MOCK-INTERVIEW-PAGE.md) · [08 Pricing](./FE/08-PRICING-PAGE.md) · [09 Profile](./FE/09-PROFILE-PAGE.md) |
| Polish | [FE/15-UI-POLISH.md](./FE/15-UI-POLISH.md), [FE/16-THEME-ASSETS-PAGES.md](./FE/16-THEME-ASSETS-PAGES.md), [FE/17-ANIMATIONS-RESPONSIVE.md](./FE/17-ANIMATIONS-RESPONSIVE.md) |
| Post-MVP | [FE/14-ONBOARDING-GUIDELINE.md](./FE/14-ONBOARDING-GUIDELINE.md) |

### Backend — [BE/](./BE/)

| File | Nội dung |
|------|----------|
| [BE/README.md](./BE/README.md) | Index BE |
| [BE-00-OVERVIEW.md](./BE/BE-00-OVERVIEW.md) | FastAPI monolith, env |
| [BE-01-DATA-MODEL.md](./BE/BE-01-DATA-MODEL.md) | ERD + **script SQL PostgreSQL** |
| [BE-02 … BE-08](./BE/BE-02-AUTH-API.md) | Auth, profile, scan, analysis, billing, interview, notifications |
| [BE-09-AI-INTEGRATION.md](./BE/BE-09-AI-INTEGRATION.md) | Hợp đồng AI (dễ hiểu, JSON mẫu) |

### API Integration — [API_Integrate/](./API_Integrate/)

| File | Nội dung |
|------|----------|
| [README.md](./API_Integrate/README.md) | Index |
| [FE-20-OVERVIEW.md](./API_Integrate/FE-20-OVERVIEW.md) | Chiến lược, `VITE_USE_API` |
| [FE-21-APP-CONTEXT-MAP.md](./API_Integrate/FE-21-APP-CONTEXT-MAP.md) | Map mock → REST endpoint |
| [FE-22-API-CLIENT.md](./API_Integrate/FE-22-API-CLIENT.md) | Code mẫu client |
| [FE-23-API-TYPES.md](./API_Integrate/FE-23-API-TYPES.md) | Types / OpenAPI |
| [FE-24-MIGRATION-CHECKLIST.md](./API_Integrate/FE-24-MIGRATION-CHECKLIST.md) | Phase rollout |

---

## 11. Setup Backend (tóm tắt — khi team BE bắt đầu)

Chi tiết đầy đủ trong [BE/BE-00-OVERVIEW.md](./BE/BE-00-OVERVIEW.md).

```powershell
# 1. Tạo database
createdb nextstep
psql -d nextstep -f scripts/init_db.sql   # SQL copy từ BE-01-DATA-MODEL.md

# 2. Scaffold FastAPI project (nextstep-api/ — tạo mới, chưa có trong repo)
# 3. Cấu hình .env: DATABASE_URL, JWT_SECRET, CORS_ORIGINS=http://localhost:5173
# 4. uvicorn app.main:app --reload --port 8000
```

Sau khi BE chạy → follow [API_Integrate/FE-24-MIGRATION-CHECKLIST.md](./API_Integrate/FE-24-MIGRATION-CHECKLIST.md).

---

## 12. Tech stack tóm tắt

| Layer | Stack | Trạng thái |
|-------|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind 3, React Router 7 | ✅ Có code |
| State MVP | React Context + localStorage | ✅ |
| Backend | FastAPI, PostgreSQL, JWT | 📄 Chỉ có spec |
| AI | Service riêng (REST) | 📄 Contract BE-09 |
| Payment | Mock → VNPay/Momo sau | 📄 Spec BE-06 |

---

## 13. Lưu ý cho cả team

- **FE thiết kế trước** → BE/database bám theo types và flow FE hiện có; spec có thể đổi khi implement.
- **Không commit** secret (.env, JWT secret, API keys).
- **UI luôn tiếng Việt**; metric labels, toast, tooltip đã chuẩn hoá trong design system.
- Có thắc mắc về **một trang cụ thể** → mở đúng file `FE/XX-*.md` + file `.tsx` tương ứng.
- Có thắc mắc **API / DB** → mở `BE/BE-XX-*.md`.
- Có thắc mắc **nối FE với BE** → mở `API_Integrate/`.

---

## 14. Liên hệ & cập nhật docs

Khi thêm route, đổi flow, hoặc chốt API mới:

1. Cập nhật file spec trong `src/prompt/FE/` hoặc `src/prompt/BE/`
2. Cập nhật `src/types/index.ts` nếu đổi shape dữ liệu
3. Tick [FE/MVP-CHECKLIST.md](./FE/MVP-CHECKLIST.md) hoặc [FE-24-MIGRATION-CHECKLIST.md](./API_Integrate/FE-24-MIGRATION-CHECKLIST.md)
