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
sequences (`“`/`”` for curly quotes, `—` for em dash) instead
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

---

## Phase 5 — full curated course library (10 courses) + folder restructure

The two curated courses from Phase 3 are now ten, each with its own
instructor. `src/lib/courses-content.ts` (a single file, 68K+ by the end of
Phase 3) has been split into `src/lib/courses-content/`, one file per
course plus shared `types.ts` and `instructors.ts`, wired together by
`index.ts`. **The import path everything else uses is unchanged**
(`@/lib/courses-content` resolves to the folder's `index.ts` automatically),
so `courses/page.tsx` and the course viewer needed zero changes for this
restructure. Delete the old `src/lib/courses-content.ts` file if it's still
present — it's fully superseded by the folder.

### The ten courses

| Course | Instructor | Lessons |
|---|---|---|
| Resume & Job Search Fundamentals | Ngozi Chukwu | 5 |
| Professional Communication at Work | David Okereke | 4 |
| Digital Marketing Fundamentals | Kemi Adeyemi | 5 |
| Customer Service Fundamentals | Yakubu Bello | 5 |
| Virtual Assistant Fundamentals | Blessing Etim | 5 |
| AI Automation for Everyday Work | Tobi Fashola | 5 |
| Prompt Engineering Essentials | Halima Sani | 5 |
| AI Illustrated Book Design | Zainab Yusuf | 5 |
| Introduction to Programming | Chuka Nnamdi | 5 |
| Spreadsheets with Excel | Musa Danladi | 5 |

Every lesson follows the same standard as the original two: real,
specific, hand-written content in a distinct instructor voice, a "try
this" exercise, and a quiz question with an explanation — not
AI-generated per visitor.

### How each course was verified

Every course, before being wired into `index.ts`, went through the same
two checks:
1. `tsc` syntax check (isolated, no `node_modules` — see "Before
   deploying"), to catch broken string literals or type errors.
2. An automated bounds-check confirming every quiz's `correct` index is
   valid for its `options` array, plus a manual read-through confirming
   the marked answer is actually the right one, not just in-bounds.

**Final tally: 49 quizzes across 10 courses, all verified, zero bad answer
keys.** One real class of bug did surface during this work and is worth
flagging here in case it recurs when adding an 11th course by hand:
straight double-quotes used for inline emphasis inside an already
double-quoted string (`"...about "growth strategy," I..."`) break the
string at the first inner quote. Every course file after that was written
with `“` / `”` (curly quotes) and `—` (em dash) as Unicode
escapes from the start instead, which sidesteps the issue entirely — worth
keeping if you hand-write a new one.

### Adding an 11th course

Following the pattern in `src/lib/courses-content/index.ts`'s own comment:
1. Add the instructor to `instructors.ts`, if it's a new one.
2. Add a new `<course-slug>.ts` file in the same folder, following any
   existing one as a template.
3. Import it in `index.ts` and add it to the `CURATED_COURSES` array.

Nothing else needs to change — the listing page, the course viewer,
lesson credit-gating, and certificates all read from `CURATED_COURSES`
and `getCourseBySlug` generically.

## Phase 6 — deep course expansion (Course 1 COMPLETE: 31/31; Course 2 "Public Speaking Mastery" COMPLETE: 26/26; Course 3 "Digital Marketing Mastery" in progress: 3/30; Courses 4–10 not started)

**Correction:** earlier entries in this phase said Course 1 had 4 modules. Going back to the originally
approved outline to confirm scope before continuing turned up 5: Foundations · Building the Resume ·
Tailoring · Supporting Documents · The Job Search System (5+9+5+4+8 = 31 lessons, matching the approved total).
The "Modules 3–4" phrasing in earlier entries below should be read as "Modules 3–5."

The 10-course library from Phase 5 is being rebuilt at much greater depth: a 304-lesson curriculum
(30+ lessons per course, each a full lesson rather than a short primer). Course 1 is being built first
and becomes the standard every later course is replicated from.

### New lesson format (backward compatible)
`src/lib/courses-content/types.ts` — a `Lesson` can now use EITHER:
- **new structured format:** `intro` + `sections: LessonSection[]`, where each section is
  `{ heading, paragraphs, illustration? }`
- **legacy flat format:** `body: string[]` (now optional). The 9 courses not yet rebuilt still use this
  and render exactly as before.

`LessonNarrator.tsx` accepts either shape, flattens it into one playback array (so text-to-speech and the
word-by-word blue highlight work identically), and renders section headings as real `<h3>` elements.

### Illustrations
`src/components/LessonIllustrations.tsx` — custom inline SVG diagrams drawn in the app's own palette
(not stock imagery). Each is registered in `LESSON_ILLUSTRATIONS` under a string key, and a lesson section
opts in with `illustration: "<key>"`. The narrator renders it directly under that section's heading.

| Key | Used in | What it shows |
|---|---|---|
| `course-roadmap` | Lesson 1 | The 4-module course sequence |
| `six-second-scan` | Lesson 2 | A resume with a spotlight and a clock |
| `two-audiences` | Lesson 2 | One resume branching to a human reader and to ATS software |
| `ats-parsing` | Lesson 3 | A document being broken into structured fields |
| `formatting-comparison` | Lesson 3 | Single-column (parses cleanly) vs two-column (scrambles) |
| `three-formats` | Lesson 4 | Chronological / functional / combination layouts |
| `halo-effect` | Lesson 5 | One strong first line coloring perception of the whole page |

Illustration cards stay light in dark mode on purpose: the diagrams use fixed dark-on-light colors, the same
reasoning as the hero mockup and desktop-sim screen.

**Verification went beyond `tsc` for these:** SVG layout and color bugs are invisible to a type checker, so each
illustration was actually rendered (compiled standalone, mounted via a minimal React shim, screenshotted with
headless Chromium at mobile and desktop widths) and inspected as an image before shipping. That caught three bugs
`tsc` passed clean:
- `course-roadmap`'s 4-across layout: title and sub-label text overflowed their 88px-wide boxes at the viewBox
  level (not a scaling issue — the text was simply wider than the box in absolute units, so it would have overflowed
  at any render size). Redesigned as a vertical 4-row stack, giving each label ~350 units of width instead of 88.
- `three-formats`: the header-highlight condition was `i < 1 && h > 1.3`, so only row index 0 ever got colored.
  Functional's data models two repeated category headers (rows 0 and 3, both tall) but only the first was
  highlighted, making it look almost identical to Combination. Fixed to `h > 1.3` alone, so both of Functional's
  headers color correctly and all three formats now read as visually distinct.
- The downward connector arrows in the roadmap rendered as a broken jagged shape: the arrowhead path was hand-drawn
  already pointing down, then `orient="auto"` rotated it another 90° to match the vertical path, double-rotating it.
  Fixed by drawing the arrowhead pointing right (marker default) and letting `orient="auto"` do the one rotation
  it's meant to do — the same pattern the horizontal arrows already used correctly.
- Separately (found by tracing CSS variables, not the screenshots): `.lesson-illustration` and its parent
  `.lesson-narrator` both resolved to the exact same `--paper-dim`, so an illustration card would have been
  invisible against its own container in light mode. Changed to a white inset card, matching how `.instructor-card`
  already insets a tinted box into a white `.card` elsewhere in the app.

**To add a new illustration:** (1) write a component in `LessonIllustrations.tsx`, (2) add its key to
`LESSON_ILLUSTRATIONS`, (3) put `illustration: "your-key"` on a section. A key that isn't in the registry
renders nothing (no crash), so cross-check keys after editing.

### Course 1 — "Career Readiness & Job Search Mastery" (Module 1 of 4 done: 5 of 31 lessons)
Lessons 1-5: course roadmap, what a resume is for, how ATS really works (corrects common myths), resume
formats, the psychology of hiring. `src/lib/courses-content/career-readiness-job-search-mastery.ts`
replaces the old `resume-job-search-fundamentals.ts` (deleted; slug changed).

### Course 1 — Module 2: "Building the Resume" (9 of 9 lessons)
The full approved outline, at the same depth standard as Module 1 (intro + sections, ~850–1400 words per
lesson, quiz, illustrations where they genuinely reinforce a concept — 7 new ones, not one per lesson):

| # | Lesson id | Title | Illustration(s) |
|---|---|---|---|
| 1 | `contact-info-and-summary` | Contact info, headline, summary | `resume-header-anatomy` |
| 2 | `structuring-experience` | Structuring your experience section | `job-entry-anatomy` |
| 3 | `bullets` | Bullets that prove impact | `duty-vs-impact`, `so-what-test` |
| 4 | `quantifying-your-work` | Quantifying without obvious numbers | `five-number-types` |
| 5 | `handling-employment-gaps` | Handling gaps and career changes | — |
| 6 | `education-section` | The education section, done right | — |
| 7 | `skills-section` | Skills sections & keyword strategy | `hard-vs-soft-skills` |
| 8 | `resume-design-and-formatting` | Design & formatting for humans and ATS | `type-hierarchy` |
| 9 | `resume-mistakes-that-disqualify` | Mistakes that quietly disqualify | — |

Each new lesson explicitly builds on what Module 1 already established rather than repeating it — e.g. the
gaps lesson doesn't re-litigate the format-choice advice from Module 1's formats lesson, it starts from "you
already know reverse-chronological is right" and goes straight into phrasing technique.

**`bullets` is a deliberate id, not a leftover:** it's the exact id the course viewer already checks for
(`lesson.id === "bullets"`) to swap the generic practice nudge for `<BulletBootcampGame />`. The game itself
has no dependency on any course-content file, so it started working the moment this lesson landed — no
other code changed. It had been orphaned since Phase 4/5, keyed to a lesson id that didn't exist in the new
course structure until now.

**A content-originality catch worth recording:** while drafting the `bullets` lesson, an earlier search in
this same session had pulled the old deleted shallow-course version of this lesson into view, and several
passages — an example (Instagram growth numbers), a worked example (customer-complaint bullets, which had
also become that lesson's quiz), and a few connector sentences — ended up reproduced almost verbatim rather
than freshly written. Caught by diffing the new lesson against the old text before shipping (one exact
123-character match, several 20–40 character ones); all of it was rewritten with original examples (a
warehouse/inventory example replaces the social-media one, a data-entry example and a fresh quiz replace the
customer-complaints one) before this ever reached the project.

**Two real illustration bugs, caught the same way as Module 1's — by actually rendering them, not by reading
the code:**
- `resume-header-anatomy`: the right-column labels were positioned using the mockup's own varying bar
  heights (26/20/14/40px) instead of their own spacing, so the two-line label+caption text blocks overlapped
  — "Summary" rendered directly on top of "phone, email, city, LinkedIn". Fixed by giving the labels a
  fixed 44px-per-row rhythm independent of the mockup, with a small color swatch linking each label back to
  its bar instead of relying on pixel alignment.
- `job-entry-anatomy`: three em dashes rendered as the literal text `—` instead of a dash character. Cause:
  `—` is only interpreted as an escape sequence inside a quoted string — written as bare JSX text
  (between tags, no quotes) it's passed through completely literally. Fixed by wrapping each in `{"..."}` so
  it's a real string literal again. (A `TS2879` fragment-factory error surfaced separately while compiling for
  the render check, from using `<>...</>` shorthand under classic-mode JSX; harmless under the project's real
  `react-jsx` transform, but fixed anyway by using `<g>` — correct either way, and proper SVG grouping besides.)

### Course 1 — Module 2 practice simulations: "Fix This Resume" and "Tailor It"
The two simulations flagged as pending are built, verified, and wired in — completing Module 2 as originally
scoped (9 lessons + 2 simulations + the reconnected game).

**`FixThisResumeGame`** (`src/components/FixThisResumeGame.tsx`) — attached to `resume-mistakes-that-disqualify`.
A spot-the-mistake task: 10 individually-judgeable resume lines (6 flawed, 4 fine), shown one at a time.
The learner calls each one a mistake or fine-as-is, gets an immediate why, and sees a running score. Shuffles
on mount and on replay for variety.

**`TailorItGame`** (`src/components/TailorItGame.tsx`) — attached to `skills-section`. Two job-posting
scenarios (Financial Analyst; Customer Support Specialist), each with a short list of required skills and a
7-item candidate skill list mixing exact matches, same-skill-different-wording matches (the lesson's keyword-
alignment point, made concrete), genuinely irrelevant skills, and one reasonable "not requested but still
worth including" case. The learner taps which skills they'd keep for that specific posting, checks their
answer, and gets a per-skill note plus a score. "Try again" resets the same scenario; "Next scenario" cycles
to the other one and wraps back around.

**The practice slot is now a small registry, not a single hardcoded check.** `lesson.id === "bullets"` in the
course viewer became `LESSON_PRACTICE_GAMES: Record<string, () => JSX.Element>`, keyed by lesson id, falling
back to the generic interview-simulator nudge for any lesson without a dedicated one. Adding a simulation to a
future lesson is now one line in that map, not another branch in the ternary.

**Two more instances of the same escape-sequence bug class found in Module 1's illustration work, caught the
same way — by actually clicking through the components in a real browser, not just type-checking them:**
a `\u2014` and a `\u00b7` were each written as raw JSX text (between tags, not inside a quoted string), so they
rendered as the literal 6-character escape text instead of a dash or a middle dot. Same root cause as before:
the escape only gets interpreted inside an actual string literal. Both fixed by wrapping in `{"..."}`; going
forward, raw JSX text in this codebase uses the real character directly (matching how `BulletBootcampGame`
already did it), and `\u` escapes stay scoped to quoted-string data fields.

**Verification for these two, beyond `tsc`:** since these are stateful and interactive (not static SVGs), the
render-and-screenshot approach from the illustration work wasn't enough on its own. Built a small custom
test harness — real DOM via headless Chromium, a from-scratch ~70-line `createElement`/`useState` runtime
(full-tree re-render on every state change, no diffing, since correctness was the goal, not performance) —
and scripted full playthroughs: every line of Fix This Resume answered and scored correctly including the
play-again reshuffle; Tailor It checked for a verified-perfect answer (7/7), a deliberately wrong one, both
reset paths, and scenario wraparound. All of it screenshotted, not just assertion-checked.

**A documentation bug, unrelated to the app itself:** this same file had picked up close to 30 instances of
literal `\u2014`-style escape text in this session's earlier Phase 6 additions — correct inside a `.tsx` string
literal (where it's interpreted at runtime), meaningless in a plain `.md` file nothing ever parses, so it was
rendering as literal backslash-u-text for anyone reading this changelog. Earlier phases of this same file
always used the real character directly; this session's additions didn't, until now — replaced throughout.

### Course 1 — Module 3: "Tailoring" (5 of 5 lessons)
Same depth standard as Modules 1–2 (760–890 words per lesson this time — slightly leaner than Module 2's
peak lessons but consistent with Module 1's range), 4 new illustrations, no new simulation this pass.

| # | Lesson id | Title | Illustration |
|---|---|---|---|
| 1 | `reading-job-descriptions` | Reading a job description like a hiring manager | `posting-priority-signals` |
| 2 | `tailoring-without-rewriting` | Tailoring without rewriting | `master-resume-branching` |
| 3 | `resume-variations-by-path` | Variations for different paths | — |
| 4 | `career-changers-and-nontraditional-backgrounds` | Career changers & non-traditional backgrounds | `skill-translation-bridge` |
| 5 | `new-graduates-limited-experience` | New graduates with limited experience | `entry-level-resume-layout` |

**Deliberate continuity, checked before writing, not after:** Module 1 already has brief "special case"
sections on employment gaps, career changes, and new graduates (one paragraph each, inside the formats
lesson), and Module 2's gaps lesson briefly touches career-change framing too. Before writing lessons 4 and 5
here, I pulled the exact existing text for all three special cases to (a) make sure this module builds on
them rather than contradicting them — e.g. Module 1 already argues against functional format for career
changers, so lesson 4 explicitly reaffirms combination format rather than re-opening that question — and
(b) avoid reusing the same specific examples. Module 1's career-change example is retail management →
project coordination; Module 2's gaps lesson uses a teacher → corporate training example. Lesson 4 here uses
three different ones (military → operations, hotel front-desk → office administration, nursing → medical
sales), diffed against both existing passages afterward to confirm no meaningful overlap beyond one
intentional, explicitly-signposted callback sentence ("Earlier in this course you learned...").

**A layout bug caught before it ever got registered, this time — by checking the arithmetic, not just
screenshotting after the fact:** `entry-level-resume-layout` stacks four blocks of different heights inside a
fixed-size card. The first draft's y-position math had a redundant offset that didn't match the card's actual
top padding, and the computed stack height (166) exceeded the card's height (150) by enough to visibly
overflow. Caught by printing the actual numbers before rendering anything, not after — recomputed the padding
properly (4px top, 6px bottom) and sized the card to exactly contain the result (162).

### A lesson-1 / roadmap consistency fix, found while starting Module 4
Lesson 1's course overview and the `course-roadmap` illustration both described this course as having four
parts — accurate when written, but stale as of the correction above (Course 1 actually has five modules).
Fixed both before writing any Module 4 content, not after: the roadmap illustration now shows five steps
(Foundations, Building, Tailoring, **Supporting Docs**, Job Search), and the lesson-1 overview text was split
so the old combined "fourth part" paragraph became two accurate paragraphs for parts four and five.

### Course 1 — Module 4: "Supporting Documents" (4 of 4 lessons)
Same depth standard as the rest of Course 1 (690–875 words per lesson), 3 new illustrations.

| # | Lesson id | Title | Illustration |
|---|---|---|---|
| 1 | `cover-letters-that-dont-repeat-the-resume` | Cover letters that don't repeat the resume | `resume-vs-cover-letter` |
| 2 | `linkedin-that-matches-and-extends-it` | LinkedIn that matches and extends it | — |
| 3 | `references-and-recommendations` | References and recommendations | `reference-sheet-anatomy` |
| 4 | `portfolios-and-work-samples` | Portfolios and work samples | `portfolio-piece-anatomy` |

Each lesson calls back explicitly to something already established rather than re-deriving it: the cover
letter lesson reuses the priority-reading skill from the tailoring module instead of re-teaching it; the
references lesson opens by naming that "references available upon request" is already on the mistakes list
from Module 2, then moves past it into the actual practice; the portfolio lesson reuses the same
quality-over-quantity instinct from tailoring a resume.

### A mid-session sandbox reset, and how it was handled
Partway through building Module 4, the sandbox environment reset — the persistent project directory and all
scratch files were gone, though the global `tsc` installation and the last successfully delivered zip
(end of Module 3) survived on a different mount. Recovery: restored the working directory from that zip,
confirmed it matched the expected Module 3 state exactly (19 lessons, byte-identical file sizes to what was
being worked on before the reset), then re-applied everything written in this session since that point —
the lesson-1/roadmap fix and all of Module 4 — from the exact text already composed earlier in the same
conversation, rather than reconstructing from memory. Re-verified from scratch afterward (`tsc`, real
headless-Chromium rendering of all 21 illustrations) rather than assuming the restored content was correct
just because it matched what came before.

### Course 1 — Module 5: "The Job Search System" (8 of 8 lessons) — Course 1 complete
Same depth standard throughout (roughly 700–950 words per lesson), 4 new illustrations. This finishes Course
1 at the full approved 31 lessons across all 5 modules: Foundations (5) · Building the Resume (9) · Tailoring
(5) · Supporting Documents (4) · The Job Search System (8).

| # | Lesson id | Title | Illustration |
|---|---|---|---|
| 1 | `where-jobs-actually-are` | Where jobs actually are | `job-channel-yield` |
| 2 | `networking-without-feeling-transactional` | Networking without feeling transactional | — |
| 3 | `tracking-applications-like-a-project` | Tracking applications like a project | `application-tracker-anatomy` |
| 4 | `following-up-well` | Following up well | — |
| 5 | `beating-application-bottlenecks` | Beating application bottlenecks | `job-search-funnel-bottlenecks` |
| 6 | `handling-recruiters-and-referrals` | Handling recruiters and referrals | — |
| 7 | `salary-research-and-knowing-your-worth` | Salary research and knowing your worth | `three-numbers` |
| 8 | `staying-resilient-through-a-long-search` | Staying resilient through a long search | — |

The module is internally cross-referenced rather than eight standalone lessons: the application tracker
built in lesson 3 is what lesson 5 uses to actually diagnose a bottleneck, and what lesson 8 leans on to
separate "needs a strategy change" from "just needs more time." Lesson 7 delivers on something the course's
own metadata already promised ("salary negotiation") but nothing written so far had actually covered —
checked against the metadata before writing, not assumed.

The final lesson (resilience, covering genuine job-search stress) stays at the level of practical, supportive
coaching — routine, process metrics, staying connected — and suggests talking to a doctor or trusted person
if things feel like more than ordinary search stress. It doesn't attempt anything clinical, which isn't
appropriate for this course and isn't what this lesson is for.

### A course-wide quiz integrity issue, found by checking the pattern, not by assuming it was fine
While finishing this module, checking all 31 quizzes' answer-position distribution at once (not just this
session's own additions) turned up something worth fixing immediately: **27 of 31 correct answers sat at the
same position** (index 1, the second option), with the first and last positions never used as the correct
answer across the entire course. A student could have scored well on nearly every quiz by always picking the
second option, without reading a single question. This wasn't specific to any one module — it was present
across Modules 1–4 too, an unconscious authoring pattern (write the wrong option, then the right one, then
two more wrong ones) that only became visible once counted across the whole course rather than quiz by quiz.

Fixed with a script, not by hand, to avoid introducing new transcription errors while fixing this one: for
each of the 31 quizzes, it extracted the correct answer's actual text, deterministically shuffled the three
wrong options (seeded per-quiz for reproducibility), and reinserted the correct answer at a target position
cycling 0→1→2→3 across the 31 quizzes in lesson order. Result: 8/8/8/7 across the four positions. Verified
after: `tsc` clean, all 31 still in bounds, and a manual read of several full quiz blocks in context (not
just the shuffled index) to confirm every wrong option still reads as genuinely wrong and matches its
explanation — the shuffle changed position only, never content.

### Course 2 redirected: "Public Speaking Mastery" (Module 1 of 6: 4 of ~26 lessons)
The user redirected Course 2 away from the originally planned broad "Professional Communication Mastery"
(30 lessons) toward a narrower, more specific course: public speaking. This is a new outline, not one
retrieved from an earlier approved plan — proposed fresh and confirmed before writing: Foundations (4) ·
Structuring a Talk (5) · Delivery (5) · Visual Aids & Data (3) · Formats & Situations (6) · Advanced (3),
~26 lessons across 6 modules.

The old shallow course (`professional-communication-at-work.ts`, slug `professional-communication-at-work`,
5 lessons) is deleted; the new file is `public-speaking-mastery.ts`, slug `public-speaking-mastery`,
registered in `index.ts` in the same list position. Checked for and found zero other references to the old
course name or slug anywhere else in the app before deleting it.

Instructor David Okereke is kept — his background (corporate training, years briefing leadership and
defending decisions on the spot) already supported a speaking-coach framing — but his title, bio, and
greeting were rewritten to foreground presentation and public-speaking coaching specifically rather than
general workplace communication.

Module 1 ("Foundations," 4 lessons: intro & why it matters, overcoming the fear, knowing your audience,
finding an authentic style) built at the same depth standard as all of Course 1, with 2 new illustrations
(a 6-step course roadmap — longer module names than Course 1's roadmap ever used, so text-fit was checked
directly rather than assumed to still be safe; and a "your priorities vs. their needs" comparison for the
audience lesson).

**The same quiz-position bias from Course 1, caught this time before it ever reached the file:** after
writing these 4 quizzes, a quick check showed all four correct answers at index 1 again — the identical
pattern just fixed course-wide for Course 1. Rather than let it recur and need a second batch fix later, the
four were rebalanced by hand immediately (0, 2, 3, 1), each correct answer's text reconfirmed in its new
position before moving on.

### Course 2, Module 2: "Structuring a Talk" (5 of 5 lessons)
Hooks and openings, organizing content (the rule of three), finding a throughline, memorable closings, and
smooth transitions — same depth standard, 2 new illustrations (five hook types as an icon row; one topic
branching into three main points).

**Quiz balance treated as an ongoing discipline, not a one-time fix.** Drafting this batch the same way as
before produced the same lopsided default — a quick check mid-batch showed three of five correct answers
already sitting at index 1. Rebalanced two of the five by hand before moving on (target spread 0,1,0,2,3),
each corrected answer's text re-confirmed against its new position. The full 9-lesson course now reads
3/2/2/2 across the four positions — the natural result of honestly distributing answers, not forced equality.

### Course 2, Module 3: "Delivery" (5 of 5 lessons)
Voice and pacing, body language, filler words and pauses, rehearsal technique, and managing nerves in the
moment — 1 new illustration. Quiz positions varied deliberately while drafting rather than fixed afterward;
final spread across all 14 lessons is 4/4/3/3.

**The nerves lesson here (tactical, in-the-moment) is deliberately distinct from Module 1's "overcoming the
fear" (psychological: why the fear happens, reframing, preparation, gradual exposure) rather than a repeat of
it** — checked directly before writing, not assumed: diffed the two lessons afterward and found zero prose
overlap beyond shared TypeScript field syntax (`heading:`, `paragraphs: [`, etc.).

**A real illustration bug, but a different kind than the ones caught so far — not a technical error, a
communication failure.** The first version of the posture-comparison illustration tried to depict literally
crossed arms using two short diagonal strokes near the shoulders, rendered in the same low-contrast muted
color as the torso fill. It compiled clean and rendered without error — and was still wrong, because the
crossed-arms detail was visually illegible, indistinguishable from a vaguely lumpy torso, caught only by
actually looking at the rendered image rather than trusting that "no render error" meant "communicates the
concept." Redesigned around a clearer, more reliable signal instead — a visibly narrow, compact stick
figure (limbs held close to the body) against a visibly wide, expansive one (limbs and stance spread out) —
and updated the caption text to match what the new version actually shows, since the original captions
("hunched, arms crossed") no longer described the redesigned image.

### Course 2, Module 4: "Visual Aids & Data" (3 of 3 lessons)
Slides that help instead of hurt, presenting data clearly, and knowing when to skip slides entirely — 2 new
illustrations, both visually verified rather than just compiled (including the pie-chart icon's arc, checked
directly since an arc is exactly the kind of thing that can compile clean and still render wrong).

**The quiz-position habit slipped again, same as the batch before it** — all three of this module's quizzes
landed at index 1 on the first pass, despite the stated intention to vary them while drafting. Caught by the
same check as every batch before it, rebalanced by hand (1, 2, 3 — the best spread available for three items),
each answer's text reconfirmed. Worth stating plainly rather than glossing over: deliberately varying position
while drafting hasn't fully stuck as a habit yet, so the after-the-fact check remains the real safeguard, not
something to phase out. Course 2 now reads 5/4/4/4 across all 17 lessons so far.

### Course 2, Module 5: "Formats & Situations" (6 of 6 lessons)
Speaking up in meetings, impromptu speaking and Q&A, large audiences, virtual presentations, panels, and
informal speaking (toasts, introductions). 2 new illustrations. The largest single-module batch since
Module 2, and the one that surfaced the two most important corrections of this whole session.

**A new quiz-balancing approach, tried because varying positions "as I go" had already failed twice:**
positions were pre-assigned before writing each quiz's options (2, 0, 3, 1, 2, 0 across the six lessons),
instead of trying to vary them in the moment. The positions themselves landed exactly on target this time.
But this surfaced a sharper problem underneath: for two of the six quizzes (`speaking-on-panels` and
`virtual-presentations`), the `correct:` number matched the intended target position, but the options array
hadn't actually been reordered to put the correct content there — so each one pointed `correct:` at a wrong,
distractor answer. Bounds-checking (0–3, within range) would never catch this, because the index was
perfectly valid; it just pointed at the wrong thing. Caught by doing something not yet done as a dedicated
step before this module: printing every question with its options and explanation laid out together and
actually reading each one as a quiz-taker would, to confirm the marked answer is the one the explanation
describes — not just that it's a number between 0 and 3. Both fixed by reordering the options so the
correct content genuinely sits at its intended index. A crude automated cross-check (word overlap between
the marked answer and its explanation) was added as a supplementary signal afterward, but it's a noisy
backstop, not a replacement — it missed both real answers it should have flagged as fine due to word-form
mismatches, and would have missed these two bugs just as easily if run alone. All 23 lessons read 6/6/6/5
across the four positions now.

**The camera-vs-screen illustration took three real rounds to get right, and the last round wasn't even
about the illustration.** Round one: both panels' gaze lines pointed at nearly the same spot, a genuine
geometry bug. Round two: fixed the geometry, but a leftover neutral "camera position" dot, rendered in both
panels, sat close enough to the dashed line's visual path that the eye still connected the line to the wrong
dot — correct math, still a misleading picture. Round three looked like it hadn't fixed anything — until
checking the actual HTML being screenshotted showed the fix script had regenerated the underlying SVG data
but the intermediate HTML file screenshotted right after still held the previous version, because rebuilding
that file was a separate step that got skipped. The illustration was already right by round two's edit; the
verification pipeline was showing stale output and very nearly caused a correct fix to be second-guessed, or
worse, an actually-broken version to be approved by coincidence. Re-verified from a confirmed-fresh render
(checked the live HTML contained the expected color codes before trusting the screenshot at all) before
calling it done.

### Course 2, Module 6: "Advanced" (3 of 3 lessons) — Course 2 COMPLETE
Handling tough questions (the steel-man technique, not taking the bait, deferring gracefully), humor that
lands (a risk spectrum from safe self-deprecating humor to genuinely risky territory), and building a
reputation as a speaker over time — the course's closing lesson, which deliberately bookends back to lesson
one's opening case for why public speaking is worth learning at all. 1 new illustration, reusing the
`three-numbers` scale pattern already proven safe rather than inventing a new abstraction. This finishes
Course 2 at 26 lessons across all 6 modules: Foundations (4) · Structuring a Talk (5) · Delivery (5) ·
Visual Aids & Data (3) · Formats & Situations (6) · Advanced (3).

This module applied, proactively, the two disciplines Module 5 established reactively: quiz options were
constructed with the correct answer placed directly at its intended index while writing, not relabeled
afterward, and a full manual read-through (question, every option, the marked answer, the explanation) was
done as a standard step before trusting the quizzes at all — not only after something already looked
wrong. All three passed clean on the first full read. Course 2's 26 lessons finish at a 7/7/6/6 split across
the four answer positions.

**A second mid-session sandbox reset happened during this module**, handled the same way as the first:
confirmed the last delivered zip (end of Module 5) survived on its separate mount, restored from it, verified
the restored state matched exactly what had been in progress (23 lessons, byte-identical staging file line
counts), then re-applied Module 6 from the text already composed earlier in the conversation and re-verified
everything from scratch rather than assuming the restore was correct. Git history was lost again for the same
structural reason as before (never included in delivered zips) and re-initialized; the delivered project
itself was unaffected.

### Stopping point, per explicit instruction
The user asked to continue through the end of Course 2 and then stop before starting Course 3. Course 2 is
now complete and fully verified. Work on this phase pauses here by request — Courses 3–10 (8 courses,
roughly 240+ lessons at this depth standard) remain, with Course 1 and Course 2 both now serving as complete,
verified templates for however that work resumes.

### Pause lifted: Course 3, "Digital Marketing Mastery" (Module 1 of 5: 3 of 30 lessons)
The user asked to continue with Course 3, lifting the pause above. Unlike Course 2, no redirect was
requested, so this follows the originally approved outline — retrieved from the transcript rather than
reconstructed from memory — of 30 lessons across 5 modules: Foundations (3) · Content & Copy (5) · Channels
(10) · Measurement (6) · Execution (6).

The old shallow course (`digital-marketing-fundamentals.ts`, 5 lessons) is deleted and replaced by
`digital-marketing-mastery.ts`, registered in the same list position in `index.ts`. Searched the whole app for
the old slug, export name, and title before and after — no other references. Instructor Kemi Adeyemi is kept
unchanged: her persona (two startups, small-business consulting on limited budgets) already matches this
course's "no buzzwords, small budget" framing.

Module 1 ("Foundations," 3 lessons: how channels fit together as a system, understanding your audience before
choosing tactics, brand voice and positioning), 2 new illustrations (a 5-step course roadmap and a customer-
profile anatomy), both re-rendered and zoomed on their tightest text rather than trusted at thumbnail size.
Quiz positions landed on 2, 0, 3.

**Three real findings this turn, none of them about the marketing content itself:**

1. **My own file-building process silently lost a lesson.** Lesson 1 was written to a staging file, then
   edited (its quiz answer moved to a different position), then lessons 2 and 3 were written to the same
   file — and that second write overwrote instead of appending, destroying lesson 1 along with the edit just
   made to it. It was only noticed because the manual quiz read-through printed two lessons instead of three.
   The deeper problem was the verification script itself: it silently processed whatever it found rather
   than asserting how many lessons to expect, so a missing lesson looked identical to a complete file.
   Lesson 1 was rebuilt from its original text with the edit reapplied, and every verification script now
   asserts the expected count up front (three lessons, found three) so an undercount fails loudly instead of
   passing quietly.
2. **The quiz-position habit slipped again, in the same message that stated the plan.** Lesson 1's correct
   answer was first written at index 1 — the exact default being avoided — immediately after stating a target
   of index 2. Correctness was fine; the placement wasn't. Fixed to match the plan, not rationalized away.
3. **A third sandbox reset, and a stranger one.** This time scratch files in `/tmp` survived but the project
   directory did not — only the single new course file just created remained, which is why `index.ts`
   appeared not to exist. Recovered the same way as before, with extra care: backed up the new file first,
   restored from the last delivered zip, confirmed Course 1 (31 lessons) and Course 2 (26 lessons) intact,
   and diffed the new file against its backup to confirm it was byte-identical.

### Known gaps (stated plainly)
- Modules 2–5 of Course 3 (27 lessons: Content & Copy, Channels, Measurement, Execution) are not written yet,
  and Courses 4–10 (7 courses) have not been started.
- Verification is syntax-only (`tsc`) for TypeScript, plus real headless-Chromium rendering for both the SVG
  illustrations and the two interactive simulations; a real `next build` has still not been run, since the
  sandbox has no network access.
- Git history was lost along with the rest of the sandbox state on all three resets (the delivered zips never
  included `.git`, by design, so this doesn't affect the delivered project itself — it only affects this
  sandbox's own internal diff-tracking, re-initialized each time).
