import { cookies } from "next/headers";
import { getUserProfile } from "./data";

const ACCESS_COOKIE = "resumeefy_sb_access";
const REFRESH_COOKIE = "resumeefy_sb_refresh";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL and SUPABASE_ANON_KEY environment variables");
}

export type SessionPayload = { sub: string; email: string; role: string; name: string };

type SupabaseUser = { id: string; email?: string; identities?: unknown[] };

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseUser | null;
  error_description?: string;
  msg?: string;
  error?: string;
  message?: string;
  code?: string;
  error_code?: string;
};

async function authRequest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin calls use the service key. Newer sb_secret keys go in the apikey header only.
async function adminRequest(path: string, init: RequestInit = {}) {
  if (!SERVICE_KEY) return null;
  return fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: SERVICE_KEY,
      ...(SERVICE_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SERVICE_KEY}` } : {}),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// Accounts are created already confirmed so people can sign in straight away instead of waiting for an email.
async function createConfirmedUser(email: string, password: string, name: string): Promise<"created" | "exists" | "failed"> {
  const r = await adminRequest("admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }) });
  if (!r) return "failed";
  if (r.ok) return "created";
  const body = (await r.json().catch(() => ({}))) as SupabaseAuthResponse;
  const text = `${body.error_code || ""} ${body.msg || ""} ${body.message || ""}`.toLowerCase();
  if (r.status === 422 || text.includes("exists") || text.includes("already")) return "exists";
  console.error("[signUp] admin create failed:", r.status, "error_code:", body.error_code || body.code || "n/a");
  return "failed";
}

// Unsticks accounts that were created before confirmation was switched off.
async function confirmExistingUser(email: string): Promise<boolean> {
  for (let page = 1; page <= 5; page++) {
    const r = await adminRequest(`admin/users?page=${page}&per_page=200`);
    if (!r || !r.ok) return false;
    const body = (await r.json().catch(() => ({}))) as { users?: { id: string; email?: string }[] };
    const found = (body.users || []).find((u) => String(u.email || "").toLowerCase() === email.toLowerCase());
    if (found) {
      const put = await adminRequest(`admin/users/${found.id}`, { method: "PUT", body: JSON.stringify({ email_confirm: true }) });
      return !!put && put.ok;
    }
    if (!body.users || body.users.length < 200) break;
  }
  return false;
}

function extractErrorMessage(body: SupabaseAuthResponse, status: number, fallback: string) {
  return (
    body.error_description ||
    body.msg ||
    body.error ||
    body.message ||
    body.code ||
    body.error_code ||
    `${fallback} (${status})`
  );
}

function isEmailNotConfirmed(body: SupabaseAuthResponse): boolean {
  const text = `${body.error_code || ""} ${body.error_description || ""} ${body.msg || ""}`.toLowerCase();
  return body.error_code === "email_not_confirmed" || text.includes("email not confirmed") || text.includes("email_not_confirmed");
}

function authError(message: string, code?: string) {
  return Object.assign(new Error(message), code ? { code } : {});
}

export async function signIn(email: string, password: string, retry = true): Promise<SupabaseUser> {
  const response = await authRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  if (!response.ok || !body.access_token || !body.refresh_token || !body.user) {
    console.error("[signIn] supabase status:", response.status, "error_code:", body.error_code || body.code || "n/a");
    if (isEmailNotConfirmed(body)) {
      if (retry && (await confirmExistingUser(email))) return signIn(email, password, false);
      throw authError(
        "Please confirm your email before signing in. Check your inbox (and spam folder) for the confirmation link we sent when you signed up.",
        "EMAIL_NOT_CONFIRMED"
      );
    }
    throw authError(extractErrorMessage(body, response.status, "Supabase sign in failed"));
  }
  await setAuthCookies(body.access_token, body.refresh_token);
  return body.user;
}

export async function signUp(email: string, password: string, name: string) {
  const created = await createConfirmedUser(email, password, name);
  if (created === "created") {
    const user = await signIn(email, password, false);
    return { user, hasSession: true };
  }
  if (created === "exists") throw authError("An account with this email already exists. Please log in instead.", "ALREADY_REGISTERED");

  // Explicit redirect target for the confirmation email — without this,
  // Supabase falls back to whatever Site URL is set in the dashboard, which
  // is easy to leave stale or unset and is the most common cause of
  // confirmation links landing somewhere unexpected.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://resumeefy.com";
  const response = await authRequest("signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { name }, options: { emailRedirectTo: `${baseUrl}/auth/callback` } }),
  });
  const body = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  // Log shape, not contents — the raw body can carry access/refresh tokens
  // when Supabase returns a session immediately (email confirmation off).
  console.log("[signUp] supabase status:", response.status, "hasUser:", !!body.user, "hasSession:", !!body.access_token);

  if (!response.ok) {
    console.error("[signUp] non-ok response:", response.status, "error_code:", body.error_code || body.code || "n/a");
    throw authError(extractErrorMessage(body, response.status, "Supabase signup failed"));
  }

  if (!body.user) {
    console.error("[signUp] 200 but no user object returned");
    throw authError(extractErrorMessage(body, response.status, "Supabase signup returned no user"));
  }

  const identities = Array.isArray(body.user.identities) ? body.user.identities : undefined;
  const alreadyRegistered = identities !== undefined && identities.length === 0;

  if (alreadyRegistered) {
    console.warn("[signUp] account already registered for this email");
    throw authError("An account with this email already exists. Please log in instead.", "ALREADY_REGISTERED");
  }

  if (body.access_token && body.refresh_token) {
    await setAuthCookies(body.access_token, body.refresh_token);
    return { user: body.user, hasSession: true };
  }

  return { user: body.user, hasSession: false };
}

async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set(ACCESS_COOKIE, accessToken, { ...common, maxAge: 60 * 60 });
  jar.set(REFRESH_COOKIE, refreshToken, { ...common, maxAge: 60 * 60 * 24 * 30 });
}

export async function resendConfirmation(email: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://resumeefy.com";
  const response = await authRequest("resend", {
    method: "POST",
    body: JSON.stringify({ type: "signup", email, options: { emailRedirectTo: `${baseUrl}/auth/callback` } }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;
    throw authError(extractErrorMessage(body, response.status, "Could not resend the confirmation email"));
  }
}

export async function setAuthCookiesFromTokens(accessToken: string, refreshToken: string) {
  await setAuthCookies(accessToken, refreshToken);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

async function refreshSession(refreshToken: string) {
  const response = await authRequest("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) return false;
  const body = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;
  if (!body.access_token || !body.refresh_token) return false;
  await setAuthCookies(body.access_token, body.refresh_token);
  return true;
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!access || !refresh) return null;

  let response = await authRequest("user", { headers: { Authorization: `Bearer ${access}` } });
  if (response.status === 401 && (await refreshSession(refresh))) {
    const nextJar = await cookies();
    access = nextJar.get(ACCESS_COOKIE)?.value;
    if (!access) return null;
    response = await authRequest("user", { headers: { Authorization: `Bearer ${access}` } });
  }
  if (!response.ok) {
    await clearSessionCookie();
    return null;
  }

  const authUser = (await response.json()) as { id: string; email?: string };
  const profile = await getUserProfile(authUser.id);
  if (!profile) return null;
  return { sub: profile.id, email: profile.email, role: profile.role, name: profile.name };
}
