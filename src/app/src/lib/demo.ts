// Previously DEMO_MODE was hardcoded to `false` here, so the documented
// RESUMEEFY_DEMO_MODE environment variable did nothing at all. It now
// actually controls demo mode, as .env.example describes.
export const DEMO_MODE = process.env.RESUMEEFY_DEMO_MODE === "true";
export const DEMO_USER_ID = "demo_user_resumeefy";
export const DEMO_EMAIL = "demo@resumeefy.local";
export const DEMO_NAME = "Demo User";
