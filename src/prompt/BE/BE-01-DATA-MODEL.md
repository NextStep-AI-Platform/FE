# BE-01 — Data Model & SQL Schema

> Draft schema dựa trên `src/types/index.ts` và `AppContext.tsx`.  
> **Có thể thay đổi** khi BE/AI team refine — đây là baseline để implement.

---

## 1. ERD (tóm tắt)

```
users ──┬── user_plans (1:1 active)
        ├── scan_sessions ── analysis_results (1:1)
        ├── cv_files
        ├── notifications
        ├── notification_settings (1:1)
        └── interview_sessions ── interview_messages (1:N)

subscription_orders (billing mock/real)
refresh_tokens (auth)
ai_jobs (optional — track AI pipeline)
```

---

## 2. Bảng ↔ TypeScript FE

| PostgreSQL | FE type / field |
|------------|-----------------|
| `users` | `User` (trừ password plain → `password_hash`) |
| `user_plans` | `PlanInfo` + `User.plan` |
| `scan_sessions` | `ScanRecord` (metadata + status) |
| `analysis_results.result_json` | `CVAnalysisResult` |
| `cv_files` | `CVFileRecord` |
| `notifications` | `AppNotification` |
| `notification_settings` | `User.notificationSettings` |
| `interview_sessions` | phần setup + `InterviewReport` |
| `interview_messages` | `InterviewMessage[]` |

---

## 3. Script SQL (PostgreSQL 15+)

Chạy file này để tạo schema ban đầu:

```sql
-- ============================================================
-- NextStep AI — Initial Schema (draft)
-- Align with FE types — 2026-06-22
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM types ──────────────────────────────────────────────

CREATE TYPE plan_type AS ENUM ('free', 'premium', 'vip');
CREATE TYPE scan_status AS ENUM ('draft', 'pending', 'processing', 'completed', 'failed');
CREATE TYPE document_input_mode AS ENUM ('file', 'text');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'promo');
CREATE TYPE interview_status AS ENUM ('setup', 'in_progress', 'completed', 'failed');
CREATE TYPE interview_mode AS ENUM ('text', 'voice');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE subscription_status AS ENUM ('pending', 'paid', 'cancelled', 'expired');

-- ── users ───────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    location        VARCHAR(255),
    bio             TEXT,
    avatar_url      TEXT,
    target_role     VARCHAR(255),
    target_industry VARCHAR(255),
    scans_used      INTEGER NOT NULL DEFAULT 0,
    scans_month_key VARCHAR(7) NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;

-- ── user_plans (gói hiện tại) ───────────────────────────────

CREATE TABLE user_plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type               plan_type NOT NULL DEFAULT 'free',
    started_at              TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    interview_sessions_left INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- ── refresh_tokens ──────────────────────────────────────────

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

-- ── cv_files (lịch sử upload) ───────────────────────────────

CREATE TABLE cv_files (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name    VARCHAR(512) NOT NULL,
    file_size    BIGINT NOT NULL,
    mime_type    VARCHAR(128) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cv_files_user ON cv_files (user_id, uploaded_at DESC);

-- ── scan_sessions ───────────────────────────────────────────

CREATE TABLE scan_sessions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(512) NOT NULL,
    role           VARCHAR(255) NOT NULL,
    company        VARCHAR(255) NOT NULL,
    overall_score  INTEGER,
    status         scan_status NOT NULL DEFAULT 'draft',
    -- ScanConfig
    config_company       VARCHAR(255) NOT NULL,
    config_industry      VARCHAR(255),
    config_role          VARCHAR(255),
    config_experience_from INTEGER,
    config_experience_to   INTEGER,
    -- CV input (DocumentInput)
    cv_mode          document_input_mode NOT NULL,
    cv_file_name     VARCHAR(512),
    cv_file_size     BIGINT,
    cv_mime_type     VARCHAR(128),
    cv_text_content  TEXT,
    cv_file_id       UUID REFERENCES cv_files(id) ON DELETE SET NULL,
    cv_storage_path  TEXT,
    -- JD input
    jd_mode          document_input_mode NOT NULL,
    jd_file_name     VARCHAR(512),
    jd_file_size     BIGINT,
    jd_mime_type     VARCHAR(128),
    jd_text_content  TEXT,
    jd_storage_path  TEXT,
    analyzed_at      TIMESTAMPTZ,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_sessions_user ON scan_sessions (user_id, analyzed_at DESC NULLS LAST);
CREATE INDEX idx_scan_sessions_status ON scan_sessions (status);

-- ── analysis_results (JSON mirror CVAnalysisResult) ─────────

CREATE TABLE analysis_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_session_id     UUID NOT NULL UNIQUE REFERENCES scan_sessions(id) ON DELETE CASCADE,
    result_json         JSONB NOT NULL,
    is_premium_content  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_results_scan ON analysis_results (scan_session_id);
CREATE INDEX idx_analysis_results_score ON analysis_results ((result_json->'scores'->>'overall'));

-- ── ai_jobs (track gọi AI service — optional nhưng hữu ích) ──

CREATE TABLE ai_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_session_id UUID REFERENCES scan_sessions(id) ON DELETE CASCADE,
    interview_id    UUID,
    job_type        VARCHAR(50) NOT NULL,  -- 'cv_analysis' | 'interview_reply' | 'interview_report'
    external_job_id VARCHAR(255),
    status          VARCHAR(50) NOT NULL DEFAULT 'queued',
    request_json    JSONB,
    response_json   JSONB,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_ai_jobs_scan ON ai_jobs (scan_session_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs (status);

-- ── notifications ───────────────────────────────────────────

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    body       TEXT NOT NULL,
    read       BOOLEAN NOT NULL DEFAULT FALSE,
    type       notification_type NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);

-- ── notification_settings ───────────────────────────────────

CREATE TABLE notification_settings (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_scan    BOOLEAN NOT NULL DEFAULT TRUE,
    feature_updates BOOLEAN NOT NULL DEFAULT TRUE,
    career_news     BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── subscription_orders (billing) ───────────────────────────

CREATE TABLE subscription_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type       plan_type NOT NULL,
    billing_cycle   VARCHAR(20) NOT NULL DEFAULT 'monthly',  -- monthly | quarterly
    amount_vnd      INTEGER NOT NULL,
    status          subscription_status NOT NULL DEFAULT 'pending',
    payment_ref     VARCHAR(255),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_orders_user ON subscription_orders (user_id, created_at DESC);

-- ── interview_sessions ──────────────────────────────────────

CREATE TABLE interview_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_role     VARCHAR(255) NOT NULL,
    difficulty      difficulty_level NOT NULL DEFAULT 'medium',
    mode            interview_mode NOT NULL DEFAULT 'text',
    status          interview_status NOT NULL DEFAULT 'setup',
    overall_score   INTEGER,
    report_json     JSONB,
    duration_label  VARCHAR(50),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_user ON interview_sessions (user_id, created_at DESC);

-- ── interview_messages ──────────────────────────────────────

CREATE TABLE interview_messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    role             VARCHAR(10) NOT NULL CHECK (role IN ('ai', 'user')),
    content          TEXT NOT NULL,
    question_number  INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_messages_session ON interview_messages (session_id, created_at);

-- ── triggers updated_at ─────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_user_plans_updated_at
    BEFORE UPDATE ON user_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_scan_sessions_updated_at
    BEFORE UPDATE ON scan_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── seed: welcome notifications template (optional) ─────────
-- Tạo khi user register qua application code, không seed global.
```

---

## 4. Ghi chú thiết kế

### JSONB `result_json`

Lưu nguyên structure `CVAnalysisResult` từ FE để AI service trả về đúng shape:

```json
{
  "id": "...",
  "cvName": "CV_Frontend.pdf",
  "analyzedRole": "Frontend Developer",
  "scores": { "overall": 72, "ats": 68, "keyword": 75, "experience": 74, "presentation": 70 },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "atsIssues": [{ "issue": "...", "severity": "high", "fix": "..." }],
  "keywords": { "matched": ["React"], "missing": ["TypeScript"] },
  "improvements": [{ "priority": "high", "title": "...", "description": "..." }],
  "experienceComment": "...",
  "companies": [],
  "courses": [],
  "isPremiumContent": true
}
```

Premium-only fields (`companies`, `courses`) có thể null/[] với free user — FE đã có gate.

### Quota scan

Khi `user_plans.plan_type = 'free'`:
- Trước mỗi `POST /scans/{id}/run`: check `scans_used` vs `PLAN_LIMITS.free.scansPerMonth` (3)
- Nếu `scans_month_key != current YYYY-MM` → reset `scans_used = 0`

### Soft delete user

`DELETE /users/me` set `deleted_at`, revoke tokens — align FE `deleteAccount()`.

---

## 5. Migration

Khuyến nghị **Alembic** — file SQL trên là `revision 001_initial`. Các thay đổi sau thêm migration mới, không sửa script gốc.

---

## 6. Liên quan

- [BE-00-OVERVIEW.md](./BE-00-OVERVIEW.md)
- [BE-09-AI-INTEGRATION.md](./BE-09-AI-INTEGRATION.md) — payload AI ghi vào `result_json`
