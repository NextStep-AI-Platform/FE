# NextStep AI

Nền tảng AI hỗ trợ người tìm việc — Frontend MVP (React + TypeScript + Vite).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # kiểm tra TypeScript + build production
```

## Tài liệu dự án

**Đọc trước khi code:** [`src/prompt/README.md`](./src/prompt/README.md)

| Folder | Nội dung |
|--------|----------|
| [`src/prompt/FE/`](./src/prompt/FE/) | Spec Frontend |
| [`src/prompt/BE/`](./src/prompt/BE/) | Spec Backend (FastAPI + PostgreSQL) |
| [`src/prompt/API_Integrate/`](./src/prompt/API_Integrate/) | Tích hợp FE ↔ API |

## Cấu trúc source

```
nextstep-ai/
├── src/
│   ├── prompt/          ← tài liệu spec (.md) — cùng repo Git
│   ├── pages/           ← các trang app
│   ├── contexts/        ← AppContext, theme, toast
│   └── types/           ← contract dữ liệu
├── public/picture/      ← logo, banner
└── package.json
```

> Folder `src/prompt/` **không** được import vào bundle — chỉ là docs, không ảnh hưởng runtime.
