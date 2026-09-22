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

---

## Phase 3 — redesign pass (desktop sim, navbar, courses, email capture)

This phase was a large, multi-part product/UX request. Everything below was
verified with the same syntax-only `tsc` check described above (no
`node_modules` in this environment, so no real `next build` was possible —
see "Before deploying").

### Interview-prep desktop simulation — rebuilt

The old simulation ran the same browser-copy → mail-paste → sheet-save loop
three times with different flavor text. It's now three genuinely different
tasks per attempt:

- `src/lib/desktop-sim.ts` (new): a deterministic task generator — no AI
  call, so this loads instantly and never fails on quota. Always returns
  `[basics task, browser+mail task, one role-specific task]`. The
  role-specific task is chosen from the target role text: design/UX/brand
  roles get a Canva-style **Design Studio** task; data/finance/ops roles get
  a spreadsheet task; everyone else gets a documents task.
- The basics task now grades minimize / restore / close window as real
  steps, not just "open an app."
- All copy/paste is real: `onCopy`/`onPaste` DOM events, Ctrl+C/Ctrl+V or
  right-click. There are no copy/paste buttons anywhere in the simulation.
- The module auto-submits ~1.2s after the last task completes (a status
  banner shows this happening) — no manual submit button.
- `src/components/AppIcons.tsx` (new): original icon set for the simulated
  apps. **The previous build had exact copies of Google's Chrome/Gmail/Sheets
  logos** (`public/brand/apps/{chrome,gmail,sheets}.svg`, matching brand hex
  colors) — these were trademark infringement risk and have been deleted.
  Everything in the simulation now uses the original icon set.
- `src/app/assessment/page.tsx`: the whole `DesktopStep` section was
  rewritten around the above (new `AppWindow` chrome with real
  minimize/close controls, per-task-kind content components).

### Navbar — decluttered

`src/components/Nav.tsx` was 8 flat top-level links. Now grouped into three
dropdowns (Resume Tools, Learn, Earn) plus a standalone, visually flagship
"Interview Prep" link and a Community link — 5 top-level items instead of 8,
each dropdown showing a one-line description per item. Mobile menu mirrors
the same grouping with section labels.

### Courses — real, hand-written courses added

The courses page was 100% AI-generated on demand, with no pre-written
content. It now leads with two complete, hand-written courses:

- `src/lib/courses-content.ts` (new): two designed instructor personas
  (Ngozi Chukwu — ex-Talent Acquisition Lead; David Okereke — workplace
  communication trainer) and two full courses — **Resume & Job Search
  Fundamentals** (5 lessons) and **Professional Communication at Work** (4
  lessons). Every lesson has real, specific, multi-paragraph content, a "try
  this" exercise, and a quiz question with an explanation — written once,
  not generated per visitor.
- `src/components/InstructorAvatar.tsx` (new): instructors are illustrated
  monogram marks, not photos — there's no real photo of "Ngozi" or "David"
  to use honestly, since they're editorial personas.
- `src/app/courses/[slug]/page.tsx` (new): the actual course-taking
  experience — lesson navigator, progress bar, per-lesson quiz gate, and a
  certificate claim on completion. Progress is stored in the browser
  (`localStorage`) per course, since these are static courses with no
  per-user database row.
- `src/app/courses/page.tsx`: rewritten — the two curated courses are now
  the primary, featured content. The old AI course generator (modules,
  quizzes, project submission, certificate purchase) is fully intact, just
  moved into a collapsed "Build a personalized path with AI" section below.
- `src/lib/schema.sql`: `course_certificates.course_id` no longer has a
  foreign key to `courses(id)`, since it now needs to hold either a real
  `courses` row id (AI-generated) or a curated course's slug (static). If
  you already ran the old schema, this needs a migration — see below.
- **Only two courses exist so far.** The system is built to add more
  cheaply (each course is just an entry in `CURATED_COURSES`), but writing
  genuinely in-depth, non-generic lesson content for a broad course takes
  real effort per course — two were completed to a standard worth shipping
  rather than more at lower depth.

### Email capture

- `src/components/NewsletterModal.tsx` (new): a dismissible modal that
  appears once, ~18 seconds in, remembered via `localStorage`. Mounted
  globally in `layout.tsx`.
- Landing page (`src/app/page.tsx`): a dedicated newsletter section above
  the footer.
- `src/components/PromoRail.tsx` (new): native, on-brand cross-promotion
  cards (Resume Builder, Resume Analyzer, Courses, Interview Prep, plus a
  newsletter signup card) — **not** styled like a third-party ad unit: no
  "Ad"/"Sponsored" label, no boxed blue-link look. Placed on the blog page;
  the component is reusable anywhere else you'd like it. No pre-existing
  ad-styled component was found in the codebase to "fix" directly — this was
  built fresh in the on-brand style, since the request implied one should
  exist.
- All three post to the existing `/api/leads` endpoint with
  `source: "newsletter"`, a value the lead schema already accepted but that
  no UI previously used.

### Micro-interactions

Core primitives (`.btn`, `.card`, `.input`, `.nav-button`) got press states
(scale-down on `:active`) and smoother easing, alongside every new
component built in this phase (nav dropdowns, desktop-sim windows, course
cards, quiz options, promo cards). A sweep of the resume-builder,
resume-analyzer and shop pages found and fixed one remaining static control
(the resume tier pill-selector). This wasn't an exhaustive file-by-file
audit of the whole codebase — those three primitives cover the large
majority of buttons/cards sitewide, so this is where the effort was spent.

### Interview-prep flow — reviewed for speed/conversion

Not code changes, except one small one below — this is a review, based on
reading the actual flow in `assessment/page.tsx`:

1. **The email gate is the very first thing shown**, before any context
   about what the assessment involves or how long it takes. Standard
   conversion practice is to show a little value before the ask. Consider
   moving the gate to after the first short module, once the user has some
   investment.
2. **The onboarding screen didn't say how long the assessment takes or how
   many modules there are** — now fixed (added "6 short modules · about 15
   minutes total"). Hidden-length multi-step flows lose more people
   mid-flow than ones that set expectations upfront.
3. **The longest module (the desktop simulation, up to 5 minutes) runs
   first**, before any shorter module. Ordering a small, quick module first
   tends to improve completion — people who've already finished one thing
   are more likely to keep going than people asked for the biggest chunk
   immediately.
4. **No score preview until the very end.** The full flow (6 timed modules
   plus an adaptive interview) likely runs 20–30 minutes for a first
   attempt. A partial insight after 2–3 modules could re-engage users
   tempted to abandon partway through.

Items 1, 3 and 4 are real product decisions (what order, what to show, when
to ask for an email) rather than obvious bugs, so they weren't changed
without you weighing in — happy to implement any of them on request.

### Also fixed while in the area

- `src/lib/auth.ts`: signup and resend-confirmation now pass an explicit
  `emailRedirectTo` (`{NEXT_PUBLIC_SITE_URL}/auth/callback`) to Supabase,
  instead of relying on the dashboard's Site URL setting — this was flagged
  during the earlier Supabase settings discussion as a likely contributor
  to confirmation-link issues.

### If you already ran the old `schema.sql`

Two changes need a manual migration since `schema.sql` only runs on a fresh
database:

```sql
alter table public.course_certificates drop constraint if exists course_certificates_course_id_fkey;
```

(No change needed for anything else in Phase 3 — the rest is application
code, not schema.)

### Not done in this phase

- A full line-by-line micro-interaction pass across every component in the
  codebase (only the highest-traffic pages were swept — see above).
- A third curated course (e.g. spreadsheets/Excel fundamentals would pair
  naturally with the new spreadsheet desktop-sim task) — straightforward to
  add to `courses-content.ts` following the existing two as a template.
- Implementing any of the four flow-review recommendations above.

---

## Phase 4 — desktop-sim variety, credits, learning experience, dark theme

Another large multi-part request. As with Phase 3, everything below is
syntax-checked only (`tsc`, no real `node_modules`) — see "Before deploying."

### Desktop simulation — 3 more role-specific tasks

`pickRoleTask()` in `src/lib/desktop-sim.ts` now also covers:
- **Slides** (marketing / sales / management / HR roles): pick a layout, type
  a title, add a bullet, present.
- **Helpdesk** (support / success roles): read a ticket, tag it correctly,
  pick the response that actually matches the issue, resolve it.
- **Code Editor** (engineering / developer / IT roles — previously these
  fell through to the generic Documents task, which didn't fit at all): find
  and fix a one-line bug, run the test, save.

Each has its own icon in `src/components/AppIcons.tsx`, window content
component in `assessment/page.tsx`, and CSS. Design/spreadsheet/documents
routing is unchanged.

### Digital Marketing Fundamentals — third curated course

A new instructor, **Kemi Adeyemi** (Digital Marketing Lead), and a full
5-lesson course in `src/lib/courses-content.ts`: how channels fit together,
writing copy that gets clicked, social media that builds an audience,
reading metrics that matter, and running a first small campaign. Same
depth and hand-written-not-generated standard as the first two courses.

**A real bug caught before shipping**: the first draft of this course used
straight double-quotes for inline emphasis inside double-quoted string
literals (e.g. `"...about "growth strategy," I..."`), which breaks the
string at the first inner quote — a genuine syntax error. Caught by the
`tsc` check, not skipped past. Fixed by using proper Unicode escape
sequences (`\u201c`/`\u201d` for curly quotes, `\u2014` for em dash) instead
of literal straight quotes inside the string content.

### Instructor system extended

`Instructor` now also carries:
- `greeting`: a first-person welcome, shown on the course page and read
  aloud by the narrator — this is what makes an instructor feel present
  rather than like a bio blurb.
- `voiceProfile`: pitch/rate/gender-hint used to give each instructor a
  distinct browser TTS voice (see below).

Ngozi and David both got a `greeting` added to match.

### Learning experience — narrated lessons, word sync, talking avatar

- `src/components/LessonNarrator.tsx` (new): reads a lesson's paragraphs
  aloud via the browser's speech synthesis, using each instructor's own
  pitch/rate/voice preference. As it reads, the **current word is
  highlighted in blue and bold** in real time, using the browser's word
  boundary events. The rest of the lesson stays visible (dimmed) rather
  than disappearing, so it's still skimmable while listening.
- `src/components/TalkingInstructorAvatar.tsx` (new): an illustrated face
  (not a photo — there's no real photo of an editorial persona to use
  honestly) whose mouth animates while the narrator is speaking. This is a
  **stylized approximation of talking**, timed to a steady cycle while
  speech is active — not real phoneme-accurate lip sync, which would need
  audio analysis the browser's TTS API doesn't expose. Worth being upfront
  about: it looks lively and roughly in-sync, not frame-accurate.
- Word-boundary events aren't equally well supported across every browser,
  so on browsers where they don't fire, narration and the talking mouth
  still work — only the per-word highlight degrades gracefully to
  paragraph-level.

### Post-lesson practice

- `src/components/BulletBootcampGame.tsx` (new): a 5-round mini-game —
  given a weak bullet point, pick the rewrite that actually proves impact.
  Shown after correctly answering the quiz on the resume course's "bullets"
  lesson specifically, since it's a direct extension of that lesson's
  content.
- Every other lesson instead shows a short nudge toward the interview
  simulator. **This is a starting point, not a full system** — one lesson
  has a purpose-built game, the rest have a generic link. Building a
  distinct game per lesson would be a meaningfully larger project.

### Credits: lessons now cost credits, with a floating balance + daily reward

- New `course_lesson_unlocks` table (migration note below) and
  `course_lesson` cost (5 credits) in `src/lib/credit-costs.ts` — pulled
  out of `src/lib/data.ts` into its own dependency-free file. **This
  mattered for a real reason**: the course viewer is a client component,
  and importing the old `CREDIT_COSTS` from `data.ts` would have pulled the
  Supabase admin client (and its service-role credentials) into the
  browser bundle. Everything server-side still imports `CREDIT_COSTS` from
  `data.ts` unchanged, which now just re-exports it.
- Every course's first lesson is free; each lesson after that costs 5
  credits to unlock, spent via `POST /api/assessment` action
  `course_lesson_unlock` and checked via `GET ?action=lesson_unlocks`.
  Insufficient credits triggers the existing global `CreditGate` purchase
  modal automatically, same as everywhere else credits are spent.
- `src/components/FloatingCreditWidget.tsx` (new): bottom-right, shows the
  signed-in user's balance, click to go to `/shop`.
- `src/components/CreditCoin.tsx` (new): the coin icon used consistently
  across the widget, the daily reward modal, and locked lessons.
- **The daily login reward already existed server-side** (a working
  Postgres function and a `/api/track` endpoint) but nothing called it, and
  it was also being silently auto-claimed on every login *and* signup with
  no UI at all. Fixed: the silent auto-claim is removed from the shared
  signup/login helper; claiming now happens only through the new modal,
  and only after a real sign-in (`resumeefy:signed-in` event), never a
  fresh signup.
- `src/components/DailyRewardModal.tsx` (new): appears 30 seconds after a
  real sign-in (once per day, tracked in `localStorage` so it doesn't nag
  across page loads), with a Claim button. On claim, coins animate from the
  button to the floating widget's actual on-screen position before the
  balance number updates.

### Dark theme

- `src/components/ThemeToggle.tsx` (new): floating bottom-left toggle,
  persisted in `localStorage`, with an inline script in `<head>` that
  applies the saved theme (or OS preference) before first paint to avoid a
  flash of the wrong theme.
- Full palette override under `[data-theme="dark"]` in `globals.css`,
  covering the core CSS variables plus every hardcoded white-background
  primitive in real site chrome (cards, inputs, nav, course viewer, promo
  cards, etc).
- **Deliberately not applied** to two things: the landing page hero's
  browser-mockup illustration, and the entire desktop simulation screen.
  Both are meant to look like a fixed "screenshot" of a light-mode computer
  regardless of the site's own theme — the same reason a screenshot in a
  dark-mode blog post doesn't invert. Everything else real and interactive
  should adapt.

### Also fixed / small items

- Dev-only "Skip sign-in" / "Skip account creation" buttons on
  login/signup, visible only when `NEXT_PUBLIC_RESUMEEFY_DEMO_MODE=true`
  and functional only when the server-side `RESUMEEFY_DEMO_MODE=true` too
  — the button itself 404s if the server flag is off, so a stray client
  flag alone can't bypass anything. Both documented in `.env.example`.
- Question banks substantially expanded (verbal 4→19, quant 4→18,
  behavioral 4→14, SJT 4→8, plus larger role-specific pools) so repeat
  assessment attempts stop showing the same handful of questions. Every
  quant answer key was hand-checked against the actual math — two were
  wrong in the first draft and are now fixed.
- Landing page reveal animations: 0.8s → 0.38s with less travel distance: a
  duplicate, slower copy of the same CSS rule was also removed.
- Tool cards on the landing page: stay at 2 columns down to very narrow
  phones instead of collapsing to 1 column early.
- Newsletter copy (modal, landing section, promo card) broadened from
  "career tips" to job alerts + tips + product updates.
- Supabase signup/resend now pass an explicit `emailRedirectTo`.

### If you already ran the old `schema.sql`

One more migration, in addition to the Phase 3 one:

```sql
create table if not exists public.course_lesson_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_slug text not null,
  lesson_id text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, course_slug, lesson_id)
);
create index if not exists idx_lesson_unlocks_user_course on public.course_lesson_unlocks(user_id, course_slug);
alter table public.course_lesson_unlocks enable row level security;
```

### Not done in this phase

- A systematic "every design should be unique" pass across the whole
  codebase — only newly-built components got distinct treatment; existing
  pages weren't re-skinned.
- Per-lesson custom illustrations beyond the talking avatar (the "be more
  pictorial" ask is only partly addressed).
- A game for every lesson — only the bullets lesson has one so far.
- True phoneme-accurate lip sync (see the honest caveat above).
