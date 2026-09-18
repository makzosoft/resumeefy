const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL || "admin@resumeefy.site";
const name = process.env.ADMIN_NAME || "Resumeefy Admin";

if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first");

// SECURITY: there is no fallback password here on purpose. This used to
// default to "admin123" when ADMIN_PASSWORD was unset, which meant any
// deployment that forgot to set it got a real admin account anyone could log
// into by guessing a well-known default. Set a strong, unique password.
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12) {
  throw new Error(
    "Set ADMIN_PASSWORD to a strong, unique password (12+ characters) before running this script. There is no default."
  );
}

async function request(path, init = {}) {
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const list = await request(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
if (!list.ok) throw new Error(await list.text());
const users = await list.json();
let authUser = (users.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!authUser) {
  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
  });
  if (!created.ok) throw new Error(await created.text());
  authUser = await created.json();
}

const profile = await request("/rest/v1/users?on_conflict=id", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify({ id: authUser.id, name, email, role: "admin" }),
});
if (!profile.ok) throw new Error(await profile.text());

console.log(`Admin ready: ${email}`);
