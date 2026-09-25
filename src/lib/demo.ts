// Previously DEMO_MODE was hardcoded to `false` here, so the documented
// RESUMEEFY_DEMO_MODE environment variable did nothing at all. It now
// actually controls demo mode, as .env.example describes.
export const DEMO_MODE = process.env.RESUMEEFY_DEMO_MODE === "true";
export const DEMO_USER_ID = "demo_user_resumeefy";
export const DEMO_EMAIL = "demo@resumeefy.local";
export const DEMO_NAME = "Makzo";

// Client-side twin of RESUMEEFY_DEMO_MODE, used ONLY to decide whether the
// "Skip sign-in" dev button renders on the login/signup pages. The actual
// bypass is enforced server-side in the dev_skip auth action, which reads
// the real (server-only) DEMO_MODE above — this flag being true with the
// server flag unset would show a button that does nothing, never the
// reverse. Both must be unset (or "false") to fully remove this for
// production; see the comment in .env.example.
export const DEMO_MODE_PUBLIC = process.env.NEXT_PUBLIC_RESUMEEFY_DEMO_MODE === "true";
