# Resumeefy Complete Project Documentation

> Consolidated documentation. README.md remains separate as requested.

---

# Source: AFFILIATES.md

# Resumeefy Affiliate Program

## Referral attribution

Affiliate links use `?ref=CODE` and are captured globally across the site. The server stores the referral code in an HTTP only cookie for 60 days. The browser cannot set or edit the attribution cookie directly.

Referred email signups are stored in `affiliate_referral_leads` with the email, affiliate code, expiry and eventual user ID. On account creation or login, the referral is attached to the user when still within the 60 day window. Credit purchases then carry the affiliate ID and code so successful purchases can create the commission record atomically.

## Affiliate registration

The Partner Program uses the normal Resumeefy account system. Partner signup passes `affiliate=1`, and the server creates a unique affiliate code immediately after account creation. Codes are collision checked and backed by a database unique constraint.

## Commission

The default commission rate is 40% of qualifying successful credit purchases. The purchase completion RPC locks the purchase row before crediting the wallet and creating the affiliate commission, preventing double commissions during concurrent verification or webhook calls.

## Payout details

Affiliates can provide an account number, account name and bank name from `/refer`. The account number is stored server side. The admin dashboard masks the account number in the UI while retaining the full value in Supabase for controlled payout processing.

## Admin control

Admins can review affiliate performance, referred emails, clicks, signups, sales, credits sold, commissions and payout requests. Affiliates can be suspended or reactivated, and payout requests can be marked paid.


---

# Source: AUTOBLOG.md

# AutoBlog

The `/api/blog?action=autopublish` endpoint is protected by `CRON_SECRET` and is scheduled ten times each day by Supabase Cron.

Each run tries to collect Google Trends Nigeria RSS signals and TikTok Creative Center signals. If a source is unavailable, the other source or a small evergreen fallback topic set is used. OpenAI turns the signals into a short original career article, then the post is stored in Supabase.

AutoBlog does not copy source text. Trend signals are context only. If a platform changes its public page structure, the fallback still allows publishing, but production monitoring should be added for source quality.

## Scheduling note

The project deliberately does not use Vercel Cron for AutoBlog. Vercel Hobby limits cron frequency to once per day, while Resumeefy needs ten runs per day. The supplied `SUPABASE_AUTOBLOG_SETUP.sql` uses Supabase Cron (`pg_cron`) plus `pg_net` to call the protected Vercel route ten times daily. Supabase documents Cron as supporting recurring schedules and HTTP requests. 

## Quality and promotion

Each article now receives a primary keyword, search intent and a service recommendation. The model can choose `none` when a promotion would be distracting. If a generated article is too short or duplicates an existing title or primary keyword, the run is skipped instead of publishing thin search content.


---

# Source: CREDIT_SYSTEM.md

# Resumeefy Credit System

New accounts receive 100 free credits automatically from a Supabase Auth trigger.

Nigeria pricing is intentionally lower. The minimum Resumeefy resume product is CV Boost at 100 credits, priced at NGN 5,000. Credits are reusable across the app and are not tied to one feature.

## Resume tiers

- CV Boost: 100 credits
- Professional: 140 credits
- Executive: 180 credits
- International CV: 220 credits

## Other examples

- AI resume generation: 20 credits
- Resume quality review: 8 credits
- Job match: 10 credits
- Interview generation: 15 credits
- Interview feedback: 8 credits
- Desktop simulation generation: 20 credits
- Course generation: 25 credits
- Course certificate: 40 credits
- Readiness certificate: free

Credits are deducted atomically by Supabase RPC functions so simultaneous requests cannot overspend a wallet.

When a feature returns `402` with `code: INSUFFICIENT_CREDITS`, the UI should open or redirect to `/shop`.

## Geographic pricing

Pricing is resolved server side from the visitor's country. Nigeria uses the dedicated NGN packs. International users start from the higher USD pricing tier, then supported local Flutterwave currencies are calculated from a refreshed USD FX rate and rounded to practical local price points. The client cannot choose a cheaper country's pack.


---

# Source: FINAL_SETUP.md

# Resumeefy final setup

## 1. Supabase

Create a Supabase project and run `src/lib/schema.sql` in SQL Editor.

Supabase provides Auth, Postgres, RLS, the credit wallet and backend data.

## 2. Vercel environment variables

Copy `.env.example` to `.env.local` for local development. Do not commit real secrets.

Required production variables:

- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_TTS_MODEL`
- `OPENAI_TTS_VOICE`
- `OPENAI_TTS_SPEED`
- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_HASH`
- `GOOGLE_APPS_SCRIPT_URL`
- `CRON_SECRET`

The supplied `.env` is only a placeholder template. Replace every placeholder before production.

## 3. Flutterwave

Set the webhook URL to:

`https://YOUR_DOMAIN/api/payment?action=webhook`

Use the same webhook secret hash in `FLW_WEBHOOK_HASH`.

## 4. Google Apps Script

Deploy `code.gs` as a Web App and copy its `/exec` URL to `GOOGLE_APPS_SCRIPT_URL`.

## 5. AutoBlog

Do not add high-frequency Vercel Cron on Hobby. Run `SUPABASE_AUTOBLOG_SETUP.sql` after replacing the Vercel domain and `CRON_SECRET`. It schedules ten AutoBlog runs per day through Supabase Cron and `pg_net`.

## 6. First deployment

Run:

```bash
npm install
npm run build
```

Then deploy the repository to Vercel.

The application has nine `/api` route handlers, so it remains below the requested ten-route limit.

# Optional live FX endpoint. Defaults to open.er-api.com if omitted.
EXCHANGE_RATE_API_URL=

## Affiliate and SEO additions

Run the current `src/lib/schema.sql` after updating the Supabase database. It now includes the affiliate ledger, 60 day attribution records, commission records and payout requests. Affiliates use `/refer` and earn 40% of successful attributed credit purchases.

The credit shop now uses Nigeria specific NGN pricing and higher international USD based pricing. For supported Flutterwave currencies, international prices are converted from the USD tier using a refreshed FX rate. Unsupported local currencies fall back to USD so checkout remains compatible with the payment gateway.

SEO routes include `/sitemap.xml` and `/robots.txt`. Major pages have unique metadata, canonical URLs and structured data. AutoBlog stores primary keyword, search intent, word count and service promotion choice. The admin dashboard reports article reads, shares and service CTA clicks.


---

# Source: RESUMEEFY_CV_STANDARD.md

# Resumeefy CV Standard

This document is the canonical writing and formatting policy for Resumeefy CV generation, rewriting, review and export.

The application source of truth is `src/lib/resume-rules.ts`, especially `RESUMEEFY_CV_SYSTEM_PROMPT` and `validateResumeCopy()`.

## Non-negotiables

1. Never invent candidate facts, metrics, achievements, dates, employers, qualifications, skills or responsibilities.
2. Never use first-person language in the CV.
3. Never use em dash or en dash punctuation in CV sentences. Rewrite with normal punctuation or connecting words.
4. Keep summaries concise and specific.
5. Turn experience into impact-focused bullets only when the source supports the impact.
6. Do not manufacture metrics.
7. Do not include workplace street addresses beside employer names.
8. Keep skills relevant and organized. Do not keyword stuff.
9. Tailor the CV to the target role using evidenced experience.
10. Maintain consistent tense, grammar and punctuation.
11. Keep dates consistently aligned and use a clean invisible layout grid.
12. Do not use spaces or tabs to fake alignment.
13. Prioritize readability and ATS parsing over decoration.
14. Prefer one page for students and candidates with limited experience, but do not damage readability to force one page.
15. Remove unnecessary personal information unless an application explicitly requires it.

## Content hierarchy

Summary → Experience → Education → Skills → Projects/Certifications where relevant.

## Experience formula

Use: **Action + what was done + relevant method/context + supported result or impact**.

If the source does not contain an outcome, do not invent one.


---

# Source: SEO.md

# Resumeefy SEO System

Resumeefy uses a people first SEO strategy rather than publishing pages only to target keywords.

## Implemented

- Unique page titles and descriptions for major routes.
- Canonical URLs.
- Open Graph and Twitter metadata.
- XML sitemap with published blog URLs.
- Robots rules that keep account, admin, shop and API routes out of search.
- Organization and Article structured data.
- Search intent and primary keyword stored per blog post.
- Internal service links through contextual soft calls to action.
- Blog engagement analytics for reads, shares and service CTA clicks.
- Mobile friendly layout and semantic headings.
- Original article generation with a quality oriented prompt.
- Duplicate and thin content safeguards should be maintained as AutoBlog volume grows.
- No cloaking, hidden text, doorway pages or keyword stuffing.

## Content strategy

Target real questions across informational, commercial and transactional intent. Build topic clusters around resumes, ATS, interviews, job search, career transitions, workplace readiness and role specific preparation. Refresh articles that lose relevance instead of endlessly creating near duplicates.

## AutoBlog rule

Ten scheduled attempts per day do not mean ten low value pages should be published. The publishing process should reject or revise weak, duplicate or overly promotional topics. Every article should have a clear reader problem, a useful answer and only one service promotion when that promotion genuinely helps the reader.

## Search performance

The current dashboard reports on site engagement. Connect Google Search Console for impressions, clicks, average position and query data. Those metrics should be used to refresh titles, content depth, internal links and search intent rather than chasing keywords blindly.


---

# Source: SUPABASE_SETUP.md

# Resumeefy Supabase Backend Setup

Resumeefy uses Supabase as the backend platform and Postgres database. Supabase Auth is the identity and password system. Next.js on Vercel is primarily the web application and a thin secure integration layer for browser requests.

## 1. Create Supabase project

Create a Supabase project and copy the project URL, anon key and service role key.

## 2. Create the database

Open Supabase SQL Editor and run:

`src/lib/schema.sql`

The schema creates the application profile table, resumes, assessments, payments, leads and tracking events. It also installs a trigger that creates a `public.users` profile whenever Supabase Auth creates a user.

## 3. Environment variables

Copy `.env` to `.env.local` for local development and fill in the values. `.env` in this package is a placeholder template only.

In Vercel, add:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_HASH`
- `APP_URL`
- `OPENAI_MODEL`
- `OPENAI_TTS_MODEL`
- `OPENAI_TTS_VOICE`
- `OPENAI_TTS_SPEED`

Never use `NEXT_PUBLIC_` for the service role key, OpenAI key or Flutterwave secret.

## 4. Authentication

Supabase Auth handles passwords, access tokens and refresh tokens. Resumeefy stores only profile information and role data in `public.users`; it does not store user passwords.

For production, configure your Supabase Auth email settings and site URL/redirect URLs for your Vercel domain.

## 5. Seed the admin

After setting the environment variables locally:

`npm run seed-admin`

The script creates or updates the admin in Supabase Auth and marks the corresponding `public.users` profile as `admin`.

## 6. Analytics

Supabase stores application tracking events. `code.gs` remains the Google Apps Script reporting/analytics layer and can mirror or aggregate events into Google Sheets.

## 7. Vercel

Deploy the Next.js project to Vercel. The current app keeps the API surface consolidated into 8 route handlers. Supabase is the actual backend and database platform; Vercel runs the web application and thin server-side integrations.


---

# Source: VERCEL_ARCHITECTURE.md

# Resumeefy Production Architecture

## Platform choice

- **Vercel**: Next.js application hosting, rendering and a small secure HTTP integration layer.
- **Supabase**: primary backend platform, authentication, PostgreSQL database, RLS and scheduled jobs.
- **Google Apps Script + Google Sheets**: analytics reporting layer.
- **OpenAI**: AI generation and voice services, accessed server side.
- **Flutterwave**: payment processing, accessed server side.

## API footprint

The Next.js project intentionally stays under ten route handlers. There are currently **9**:

1. `/api/auth`
2. `/api/ai`
3. `/api/resume`
4. `/api/assessment`
5. `/api/payment`
6. `/api/track`
7. `/api/leads`
8. `/api/admin`
9. `/api/blog`

Referral tracking and affiliate dashboard actions are consolidated into `/api/track`, so the affiliate system does not add another Vercel function.

## Credits and international pricing

Supabase Postgres is the source of truth for the credit wallet and purchase ledger. Nigeria uses dedicated NGN pricing. International pricing starts from the higher USD tier and is converted to supported local Flutterwave currencies using a refreshed FX rate.

## Affiliate system

Affiliate attribution is server controlled. `/refer?ref=CODE` sets a 60 day HTTP only referral cookie. Successful credit purchases resolve the cookie server side and award 40% commission to the affiliate. Admins control affiliate activation, payout approval and analytics.

## AutoBlog

AutoBlog is scheduled by Supabase Cron, not Vercel Cron. Ten daily schedules call the protected `/api/blog?action=autopublish` endpoint. Supabase documents Cron as supporting recurring jobs and HTTP requests through `pg_net`.

## Authentication

Supabase Auth is the source of truth for identities and passwords. Resumeefy stores profile and role information in `public.users`. Password hashes are never stored in the application database.

## Secrets

Only server side variables may contain:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FLW_SECRET_KEY`
- `FLW_WEBHOOK_HASH`

Never expose these through `NEXT_PUBLIC_*` variables.


---

# Source: AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


---

# Source: CLAUDE.md

@AGENTS.md


---

# User Growth Incentives

Resumeefy includes deliberately small user incentives designed to improve retention and word of mouth without replacing paid credit purchases.

## Daily login reward

A logged in user can receive **1 credit once per calendar day**. The reward is granted automatically during login and is recorded in `daily_login_rewards` and `credit_transactions`.

The reward is intentionally tiny. It is meant to bring users back into the product, not to let regular logins fund premium usage indefinitely.

## Friend invite reward

Every normal Resumeefy user receives a unique personal invite code. This is completely separate from the affiliate programme and its 40% affiliate code.

A personal invite link looks like:

`https://resumeefy.com/?invite=RFXXXXXXXXX`

The invite attribution is stored in an HTTP only cookie for 60 days. A referred friend receives **5 credits** after completing the referral flow, while the inviting user receives **10 credits**.

Self referrals are rejected. Duplicate referral records do not generate additional rewards.

The reward is intentionally small so that sharing acts as a motivation to discover Resumeefy and return to the platform, while paid credit packs remain the primary way to unlock higher value features.

## Analytics and control

Admin analytics record user referrals and daily login rewards separately from paid affiliate activity. This makes it possible to measure whether the incentives increase activation, retention, referrals and subsequent credit purchases without confusing ordinary users with affiliates.

## Demo Mode
Set `RESUMEEFY_DEMO_MODE=true` to run the product locally without Supabase, OpenAI or Flutterwave credentials. Demo mode provides an in-process demo data store, demo authentication, sample AI responses and simulated credit purchases. Set it to `false` to restore the normal production integrations. Demo data is not durable and should never be treated as production data.
