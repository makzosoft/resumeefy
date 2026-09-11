# Resumeefy

Resumeefy is a Next.js CV and job-readiness application with authentication, Supabase Postgres persistence, Flutterwave payments, an admin dashboard, AI CV generation and adaptive AI interview coaching.

## AI setup

The AI features use OpenAI's Responses API from server-side route handlers. The API key is never exposed to the browser.

```bash
npm install
cp .env.example .env.local
```

Add:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.6-luna
```

`OPENAI_MODEL` is optional. The default is GPT-5.6 Luna, chosen for cost-sensitive, high-volume generation. Change it if you prefer another model available to your API account.

AI endpoints:

- `POST /api/ai/resume` generates structured CV content using the Resumeefy CV Standard in `src/lib/resume-rules.ts`.
- `POST /api/ai/interview/questions` generates role and company-aware interview questions dynamically.
- `POST /api/ai/interview/feedback` evaluates an answer and returns a score, strengths, improvements, a stronger version and a follow-up question.

All AI endpoints require an authenticated session.

## Resume generation behaviour

The generator is instructed to preserve candidate facts, avoid fabricated achievements and metrics, keep ATS readability, use consistent tense and alignment-friendly text, and enforce the Resumeefy no-dash punctuation rule. The structured response separates summary, experience, education, certifications, projects, skills and quality checks.

## Assessment behaviour

The assessment now adds an adaptive interview round after the role simulation. Questions are generated after the candidate enters the target role and company. Each answer is evaluated before the candidate moves on, making the interview interactive rather than a static question bank.

## Other setup

- `APP_URL` is used by Flutterwave redirects.
- `FLW_SECRET_KEY` and `FLW_WEBHOOK_HASH` are required for payments.
- Supabase Postgres is stored in `data/` by default. Use a persistent volume or migrate `src/lib/db.ts` to Postgres before production deployment on an ephemeral filesystem platform.


Run locally with:

```bash
npm run dev
```

The project was not built as part of this update, per request. Run `npm install` and then `npm run build` locally before deployment.

## Assessment voice coach

The assessment includes an OpenAI generated voice coach that is **enabled by default**. It reads assessment prompts and interview questions at a normal conversational pace. Candidates can switch it off at any point; the preference is remembered in the browser.

Voice configuration lives in `.env.local`:

```env
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=coral
OPENAI_TTS_SPEED=1
# Optional
# OPENAI_TTS_INSTRUCTIONS=Warm, eloquent female career coach. Natural, calm and encouraging. Normal conversational pace.
```

The TTS key remains server-side. The app also falls back to the browser speech engine if the OpenAI voice service is unavailable or browser autoplay policy blocks the generated audio.

The current assessment design also includes a local career-coach illustration so the experience is not text-only, with responsive visual treatment on the landing page and interview screen.

## Deployment architecture

The API surface is intentionally consolidated to **8 Next.js route handlers** so deployments create fewer serverless functions:

- `/api/auth` for login, signup, logout, and current session
- `/api/ai` for CV generation, interview questions, interview feedback, and TTS
- `/api/payment` for checkout, verification, and Flutterwave webhooks
- `/api/admin` for protected admin statistics
- `/api/assessment` for assessment save and history
- `/api/resume` for resume save and retrieval
- `/api/leads` for lead capture
- `/api/track` for product analytics events

The Google Apps Script analytics backend is included at `code.gs`. Deploy it as the analytics Web App and run `setupSystem()` once in the bound Google Sheet. Configure the Flutterwave webhook URL to use `/api/payment?action=webhook`.

## Vercel serverless architecture

Resumeefy is structured for Vercel deployment with a deliberately consolidated API surface. There are currently **8 Next.js API route handlers**, so the application stays below the requested 10 serverless function threshold.

API surface:

1. `/api/auth` — login, signup, session lookup and logout
2. `/api/ai` — CV generation, interview questions, interview feedback and TTS
3. `/api/resume` — resume save and retrieval
4. `/api/assessment` — assessment save and retrieval
5. `/api/payment` — payment initiation, redirect verification and Flutterwave webhook
6. `/api/track` — analytics event collection
7. `/api/leads` — lead capture
8. `/api/admin` — protected admin statistics

Each API route explicitly uses the **Node.js runtime**, which is required by the current Supabase Postgres/Supabase Postgres implementation.

`code.gs` is included at the project root and runs independently on Google Apps Script. It is **not** a Vercel serverless function.

### Important Vercel data note

The current application still uses Supabase Postgres through `Supabase Postgres`. Vercel serverless instances have ephemeral local storage, so Supabase Postgres should not be treated as a permanent production datastore. The included Google Apps Script system is intended for analytics. For durable production user, resume and payment records, migrate the application datastore to a hosted database before relying on Vercel for long-term persistence.

### Function-count verification

Before deployment, run:

```bash
find src/app/api -name route.ts | sort
```

The project should report exactly 8 API route handlers unless you intentionally add another route. Keep the total below 10.

## Supabase database setup

Run `src/lib/schema.sql` once in the Supabase SQL Editor. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_`.

## Production architecture update

Supabase is the primary backend: Auth, Postgres, credit wallet, transactions, courses, submissions and blog data. Vercel hosts the Next.js application and nine thin Node.js API route handlers. The project has no SQLite dependency.

Google Apps Script remains the reporting analytics layer. Server-side tracking events are mirrored to the configured `GOOGLE_APPS_SCRIPT_URL` in near real time while the canonical event record remains in Supabase.

AutoBlog is scheduled by Supabase Cron rather than Vercel Cron so ten publishing runs per day do not depend on a Vercel Hobby cron allowance. See `SUPABASE_AUTOBLOG_SETUP.sql`.
