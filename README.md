# Resumeefy

Resumeefy is a Next.js CV and job-readiness application with authentication, Supabase Postgres persistence, Flutterwave payments, an admin dashboard, AI CV generation and adaptive AI interview coaching.

## AI setup

AI features run on **Google Gemini** (`src/lib/gemini.ts`), called from server-side route handlers only — the key is never exposed to the browser. Resumeefy does not use OpenAI.

```bash
npm install
cp .env.example .env.local
```

Add:

```env
GEMINI_API_KEYS=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEYS` accepts a comma-separated list (`key_one,key_two`) — Resumeefy rotates to the next key when one runs out of quota or fails auth. `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`.

All AI features go through a single consolidated route, `POST /api/ai`, with an `action` field in the body selecting the feature: `resume`, `resume_quality`, `job_match`, `interview_questions`, `interview_feedback`, `desktop`, `course`, `course_recommendation`, or the public/unauthenticated `blog_preview`. Every action except `blog_preview` requires an authenticated session and spends credits (see `CREDIT_COSTS` in `src/lib/data.ts`).

## Resume generation behaviour

The generator is instructed to preserve candidate facts, avoid fabricated achievements and metrics, keep ATS readability, use consistent tense and alignment-friendly text, and enforce the Resumeefy no-dash punctuation rule (`src/lib/resume-rules.ts`). Generated copy is checked against those rules after generation, and regenerated once automatically if it fails the check. The structured response separates summary, experience, education, certifications, projects, skills and quality checks.

## Assessment behaviour

The assessment adds an adaptive interview round after the role simulation. Questions are generated after the candidate enters the target role and company. Each answer is evaluated before the candidate moves on, making the interview interactive rather than a static question bank. Course completion certificates (`course_certificate` action) are persisted to `course_certificates` in Supabase and can be listed via `GET /api/assessment?action=certificates`.

## Assessment voice coach

Server-side (Gemini) text-to-speech has been **disabled** — the `tts` action on `/api/ai` returns a `410 TTS_DISABLED` response on purpose. The assessment uses the browser's built-in speech engine only. There is no `OPENAI_TTS_*`/Gemini TTS configuration to set.

## Other setup

- `APP_URL` and `NEXT_PUBLIC_SITE_URL` are used for Flutterwave redirects, sitemap/robots generation, and page metadata.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are all required — see "Supabase database setup" below. Missing `SUPABASE_ANON_KEY` specifically causes every signup/login request to fail at startup, which can look like "Supabase is broken" when it's really a missing env var.
- `FLW_SECRET_KEY` and `FLW_WEBHOOK_HASH` are required for payments.
- `RESUMEEFY_DEMO_MODE=true` runs the app against an in-memory demo data store with simulated payments, with no real Supabase/Gemini/Flutterwave credentials needed. Never enable this in production.

Run locally with:

```bash
npm run dev
```

Run `npm install` and then `npm run build` before deploying — this project could not be built inside the environment these fixes were made in (no network access), so treat a clean `npm run build` as a required last step, not optional.

## Deployment architecture

The API surface is intentionally consolidated so deployments create fewer serverless functions. There are currently **9 Next.js route handlers**:

1. `/api/auth` — login, signup, session lookup, logout, resend-confirmation-email
2. `/api/ai` — CV generation, quality scoring, job matching, interview questions/feedback, desktop simulation, course generation, blog preview
3. `/api/resume` — resume save, retrieval, and tier unlock
4. `/api/assessment` — assessment save/retrieval, course submissions, course certificates
5. `/api/payment` — payment initiation, redirect verification, and the Flutterwave webhook
6. `/api/blog` — public blog reads, blog event tracking, and the cron-triggered autopublish action
7. `/api/track` — analytics events, referral/invite tracking, affiliate actions
8. `/api/leads` — lead capture
9. `/api/admin` — protected admin statistics (requires `role = admin`)

Each API route explicitly uses the **Node.js runtime**. Verify the count before deployment:

```bash
find src/app/api -name route.ts | sort
```

`code.gs` is a separate, optional Google Apps Script analytics dashboard that runs independently on Google Apps Script — it is **not** a Vercel serverless function, and the Next.js app only ever calls it for one thing: a generic `action: "event"` POST per tracked event (see `trackEvent` in `src/lib/data.ts`). Its own Users/Resumes/Interviews/Payments/Leads sheets and admin login system are not otherwise wired up to the live app; the canonical record is always Supabase. Deploy it as a Web App and run `setupSystem()` once in the bound Google Sheet if you want it — it's entirely optional. On first run it prints a random initial admin password to the Apps Script execution log (View > Logs); copy it and call `changeAdminPassword()` immediately.

## Supabase database setup

Run `src/lib/schema.sql` once in the Supabase SQL Editor (it's idempotent — `create table if not exists` / `add column if not exists` throughout — so re-running it is safe). Supabase Postgres is the durable, primary datastore for users, resumes, credits, courses, and blog content; it is not ephemeral and does not need a separate migration before production use. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to your environment. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_` or sent to the browser.

To create the first admin account, set `ADMIN_EMAIL`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` (12+ characters — there is no default) and run:

```bash
node scripts/seed-admin.mjs
```

## AutoBlog

`POST /api/blog?action=autopublish` generates and publishes a blog post from current trend signals, guarded by a `CRON_SECRET` bearer token. `SUPABASE_AUTOBLOG_SETUP.sql` schedules this via Supabase Cron (so up to ten runs a day don't depend on a Vercel Hobby plan's cron allowance) — it contains two placeholders (`YOUR-VERCEL-DOMAIN`, `YOUR_CRON_SECRET`) that **must** be replaced with your real values before running it, or the scheduled job will silently fail every time.
