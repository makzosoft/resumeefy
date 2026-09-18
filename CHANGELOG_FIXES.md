# Resumeefy — fix pass changelog

Everything below was found in a full code review and then fixed. Read the
"Before deploying" section at the bottom first.

## Renamed: OpenAI → Gemini

The app only ever called Google Gemini — the file was just misnamed and the
`.env` templates documented the wrong variables.

- `src/lib/openai.ts` → `src/lib/gemini.ts`; both files that imported it
  (`api/ai/route.ts`, `api/blog/route.ts`) updated.
- `.env.example` / `.env.local.example`: removed `OPENAI_API_KEY`,
  `OPENAI_MODEL`, `OPENAI_TTS_*`; added `GEMINI_API_KEYS` (comma-separated,
  round-robins on quota/auth failure) and `GEMINI_MODEL`.
- `README.md` / `RESUMEEFY_DOCUMENTATION.md`: every OpenAI mention replaced;
  the "voice coach" section now correctly says server-side TTS is disabled
  (the `tts` action returns `410 TTS_DISABLED` on purpose — the app uses the
  browser's speech engine).
- A leftover customer-facing `alert(...)` in `resume-builder/page.tsx` that
  said "Check OPENAI_API_KEY" — a real end user could have seen this — now
  says something a non-developer can read.

## The bug that broke every AI feature

`src/lib/gemini.ts` called `callGemini(apiKey, input, schema, schemaName,
instructions)` with the arguments in the wrong order, so the JSON payload
was sent as the auth token and the real key was sent as the system prompt.
Every AI call failed auth immediately and exhausted all configured keys on
the first request. Fixed to pass arguments in the declared order.

## The reported Supabase / signup / login issue

Two separate things were going on:

1. **`.env.example` was missing `SUPABASE_ANON_KEY` entirely.** Without it,
   `src/lib/auth.ts` throws at import time and every signup/login request
   fails — this can look exactly like "Supabase keeps erroring" even though
   Supabase itself is fine. Added it to both env templates with a comment
   calling out why it matters.
2. **The frontend showed a successful "check your email" result using the
   same red error styling as a real failure.** `signup/page.tsx` called
   `setError(result.message)` for the `needsEmailConfirmation` case, so a
   successful signup (Supabase really did send the confirmation email)
   rendered identically to a failure. Fixed: signup now shows a dedicated
   "Check your email" screen, styled distinctly from errors.

Also added, since they follow directly from the same flow:
- `signIn()` now detects Supabase's "email not confirmed" response
  specifically and returns a clear, actionable message instead of a generic
  error (with an `EMAIL_NOT_CONFIRMED` code).
- Login page shows a working **Resend confirmation email** button when that
  specific error occurs (new `resend_confirmation` action in
  `api/auth/route.ts`, using Supabase's own resend endpoint).
- `auth.ts` no longer logs full Supabase response bodies — those can contain
  live access/refresh tokens when Supabase returns a session immediately.

## Security fixes

- **IDOR on resume unlock**: `unlockResume()` only filtered by `id`, so any
  logged-in user could unlock (and overwrite the tier of) another user's
  resume. Now requires the caller's `userId` to match, like every other
  resume function already did.
- **Hardcoded `admin123` default password, in two places**:
  `scripts/seed-admin.mjs` now refuses to run without an explicit
  `ADMIN_PASSWORD` (12+ characters, no default). `code.gs`'s own admin
  system now generates a random password on first setup and prints it once
  to the Apps Script execution log instead of using a fixed default.
- **Stored XSS in `code.gs`'s analytics dashboard**: event/page/device
  strings (attacker-controllable via the public `/api/track` endpoint) were
  inserted into the dashboard via `innerHTML` with no escaping. Added an
  `esc()` helper and applied it everywhere dynamic data is rendered there.
- **No rate limiting anywhere.** Added `src/lib/rate-limit.ts` (a documented,
  best-effort, in-memory limiter — see its header comment for the real
  limitation: it's per-instance, not distributed, so treat it as a stopgap
  and put real traffic behind Upstash/Vercel KV) and applied it to login,
  signup, resend-confirmation, `/api/leads`, and the public actions on
  `/api/track` and `/api/blog`.
- **Unbounded payload sizes** on public/authenticated endpoints that accept
  free-form JSON (`resume`, `candidate`, tracking `meta`) — added explicit
  character caps.
- **Non-constant-time comparisons** for the Flutterwave webhook signature
  and the cron secret — both now use `crypto.timingSafeEqual`.
- `login`/`signup` `next` redirect param is now validated to a same-origin
  relative path (`safeNext()` in `client.ts`) before being used, closing off
  a possible open-redirect vector.

## Reliability / correctness fixes

- **`/shop` now verifies payment on return** instead of relying entirely on
  the Flutterwave webhook. Previously the redirect page ignored `tx_ref`/
  `transaction_id` entirely, so a delayed or misconfigured webhook meant a
  successful charge with no credits and no error shown.
- **Credit pack IDs are now stable** (`intl_100`, etc.) instead of being
  built from the resolved currency (`usd_100`) — previously a purchase could
  fail to match its pack if IP-based country detection resolved slightly
  differently between the pricing fetch and the purchase request.
- **`demo.ts`**: `DEMO_MODE` was hardcoded `false`, so the documented
  `RESUMEEFY_DEMO_MODE` env var did nothing. Now actually reads it.
- **`course_certificate`** charged credits and returned an ID that was never
  stored anywhere. Added a `course_certificates` table (`schema.sql`) and
  `saveCourseCertificate`/`getCourseCertificates`; certificates are now
  listable via `GET /api/assessment?action=certificates`.
- **`blog_preview`** was checked for (`isPublic`) but never actually
  implemented — it always 400'd. Implemented it as a public, uncharged
  preview generator.
- Signup's "account already exists, log in instead" fallback path used to
  skip `createAffiliate()` even when the person had checked "sign up as an
  affiliate" — fixed to match the normal signup path.
- `admin/page.tsx`: a logged-out visitor never saw an error or a sign-in
  prompt — just an infinite "Loading…" spinner, because the gating logic
  only handled "logged in but not admin". Also stopped firing a doomed
  `/api/admin` request for non-admins.
- FX-rate fetch failures (`pricing.ts`) now log a warning instead of
  silently falling back to hardcoded (and slowly staling) exchange rates.
- Trend-scraping failures in the autoblog job (`api/blog/route.ts`) now log
  a warning instead of failing silently into an 8-topic fallback pool.

## Cleanup

- Removed four fully dead functions (`createPendingPayment`,
  `markPaymentSuccessful`, `markPaymentFailed`, `getPaymentByTxRef`) and the
  orphaned direct-payment flow they supported — nothing in the app called
  them; resume unlocks are paid for out of the credit wallet.
  `public.payments` is left in `schema.sql` (dropping a live table isn't
  something a schema file should do for you) but is now commented as
  currently unused.
- `schema.sql` had `public.affiliates` and `public.affiliate_commissions`
  each defined twice (harmless due to `IF NOT EXISTS`, but confusing).
  Removed the duplicates.
- Removed the leftover `/data` directory and its `.gitignore` entries — a
  SQLite-era artifact; the app has used Supabase Postgres for a while.
- `validateResumeCopy()` (the em-dash/first-person/filler-language checker)
  was written but never called from anywhere. It's now run after every
  resume generation, with one automatic silent regeneration attempt if the
  first draft fails the check.
- Reformatted the densest single-line files (`data.ts`, and the `resume`,
  `assessment`, `auth`, `blog` route handlers) into normal multi-line code.
- `.env.example` had `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL` each listed
  twice, and documented an unused `AUTH_SECRET` that no code reads. Fixed;
  both env template files now list the same, complete, correct set of
  variables.
- `README.md` previously said Supabase Postgres "should not be treated as a
  permanent production datastore" and described the app as storing data in
  a local `data/` folder — both leftover from a pre-Supabase SQLite
  prototype and actively wrong. Corrected.

## Before deploying

1. **Run a real build.** These fixes were made without network access in a
   sandboxed environment, so `npm install` / `next build` / `tsc` could not
   be run against the real `next`/`react`/`zod`/`@types/node` packages. A
   syntax-only check (TypeScript parsing with type resolution disabled) was
   run over every changed file and found no syntax errors, but that is not
   a substitute for a real build — do that before deploying.
2. **Run the updated `schema.sql`** in the Supabase SQL editor — it's
   idempotent and safe to re-run, but it now includes the new
   `course_certificates` table the certificate feature depends on.
3. **Set `SUPABASE_ANON_KEY`** if it wasn't already set outside of the
   `.env.example` template — see above.
4. **Set `GEMINI_API_KEYS`** (comma-separated) — this replaces whatever
   OpenAI variable was configured before.
5. If you use `code.gs`, re-run `setupSystem()` (or just note the new
   random admin password) and check the Apps Script execution log once for
   the generated password.
