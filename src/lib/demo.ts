/** Demo mode lets the full product UI run without real third party credentials.
 * Turn on with RESUMEEFY_DEMO_MODE=true. Turn it off to restore production integrations.
 */
export const DEMO_MODE = /^(1|true|yes|on)$/i.test(process.env.RESUMEEFY_DEMO_MODE || "true");
export const DEMO_USER_ID = "demo_user_resumeefy";
export const DEMO_EMAIL = "demo@resumeefy.local";
export const DEMO_NAME = "Demo User";
