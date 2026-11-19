import { randomBytes } from "node:crypto";
import { db, newId } from "@/lib/db";
import { emailShell, notifyAdmin, sendHtml, siteUrl } from "@/lib/mail";

export type Job = { id: string; slug: string; title: string; description: string; commission_pct: number; open: boolean; apply_duration_h: number | null; research_duration_h: number | null; opened_at: string | null; apply_deadline: string | null; research_deadline: string | null; auto_email: boolean; auto_approve: boolean; group_url: string; invites_sent_at: string | null; approvals_run_at: string | null };
export type App = { id: string; job_id: string; name: string; email: string; whatsapp: string; why: string; status: string; token: string; research: string };

export const newToken = () => randomBytes(18).toString("base64url");
export const clean = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n);
export const slugify = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

export function phase(j: Job): "applying" | "applications_closed" | "closed" {
  if (!j.open) return "closed";
  if (j.apply_deadline && new Date(j.apply_deadline).getTime() <= Date.now()) return "applications_closed";
  return "applying";
}
export const publicJob = (j: Job) => ({ slug: j.slug, title: j.title, description: j.description, commissionPct: j.commission_pct, applyDeadline: j.apply_deadline, phase: phase(j) });

export async function logEvent(jobId: string | null, appId: string | null, type: string, text: string) {
  try { await db.from("hiring_events").insert({ id: newId("hev"), job_id: jobId, app_id: appId, type, text }); } catch { /* best effort */ }
}

// The timer starts the first time anyone opens the job link.
export async function startTimer(j: Job): Promise<Job> {
  if (j.opened_at) return j;
  const now = new Date();
  const upd: Record<string, string> = { opened_at: now.toISOString() };
  if (j.apply_duration_h) {
    upd.apply_deadline = new Date(now.getTime() + j.apply_duration_h * 3600000).toISOString();
    if (j.research_duration_h) upd.research_deadline = new Date(new Date(upd.apply_deadline).getTime() + j.research_duration_h * 3600000).toISOString();
  }
  const { data } = await db.from("hiring_jobs").update(upd).eq("id", j.id).is("opened_at", null).select("*");
  if (data && (data as Job[]).length) { await logEvent(j.id, null, "link_opened", "Link opened for the first time. Timer started."); return (data as Job[])[0]; }
  const { data: again } = await db.from("hiring_jobs").select("*").eq("id", j.id).maybeSingle();
  return (again as Job) || j;
}

const researchUrl = (a: App) => `${siteUrl()}/hire/research?t=${a.token}`;
const signupUrl = (a: App) => `${siteUrl()}/api/hire?op=go&t=${a.token}&to=signup`;
const first = (a: App) => a.name.split(" ")[0] || "there";

export async function sendInvite(j: Job, a: App): Promise<boolean> {
  await db.from("hiring_applications").update({ status: "invited", invited_at: new Date().toISOString() }).eq("id", a.id).in("status", ["applied", "invited"]);
  await logEvent(j.id, a.id, "invited", `Research task sent to ${a.name}`);
  const dl = j.research_deadline ? ` Send it in before ${new Date(j.research_deadline).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}.` : "";
  return sendHtml(a.email, `Your research task: ${j.title}`, emailShell({
    heading: `Hi ${first(a)}, here is your research task`,
    paragraphs: ["Thank you for applying. The next step is a short piece of research so we can see how you think.", "Tell us: (1) three places where job seekers gather, such as WhatsApp groups, campuses or NYSC camps, (2) how you would introduce Resumeefy in each one, and (3) how many people you could realistically reach in your first 30 days.", `Write at least a few paragraphs.${dl}`],
    cta: { label: "Send my research", url: researchUrl(a) },
  }));
}

export async function sendApproval(j: Job, a: App): Promise<boolean> {
  await db.from("hiring_applications").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", a.id).in("status", ["applied", "invited", "submitted", "approved"]);
  await logEvent(j.id, a.id, "approved", `${a.name} approved`);
  return sendHtml(a.email, `You are in: ${j.title}`, emailShell({
    heading: `Congratulations ${first(a)}, you are approved`,
    paragraphs: [`We liked your research. You can now create your Resumeefy partner account and start earning ${j.commission_pct}% commission.`, `Please sign up with this same email address (${a.email}). Your account will be activated straight away.`],
    cta: { label: "Create my partner account", url: signupUrl(a) },
  }));
}

export const sendRejected = (j: Job, a: App) => sendHtml(a.email, `Update on your ${j.title} application`, emailShell({ heading: `Hi ${first(a)}`, paragraphs: ["Thank you for the time you put into applying. We are not taking your application forward this time, but we really appreciate your interest and you are welcome to apply again in future."] }));
export const sendReceived = (j: Job, a: { name: string; email: string }) => sendHtml(a.email, `We received your application: ${j.title}`, emailShell({ heading: `Thanks ${a.name.split(" ")[0]}, we got your application`, paragraphs: ["We will email you soon with what happens next. Please check your spam folder too."] }));

export async function sendGroupInvite(j: Job, a: { name: string; email: string }) {
  if (!j.group_url) return false;
  return sendHtml(a.email, "Join the Resumeefy partner group", emailShell({ heading: "Welcome to the team", paragraphs: ["Join our partner group chat for tips, updates and support."], cta: { label: "Join the group", url: j.group_url } }));
}

// Run by the daily job and whenever the admin opens the hiring screen.
export async function processDue() {
  const now = Date.now();
  const { data } = await db.from("hiring_jobs").select("*").eq("open", true);
  const out = { invited: 0, approved: 0 };
  for (const j of (data as Job[]) || []) {
    if (j.auto_email && j.apply_deadline && new Date(j.apply_deadline).getTime() <= now && !j.invites_sent_at) {
      const { data: apps } = await db.from("hiring_applications").select("*").eq("job_id", j.id).eq("status", "applied");
      for (const a of (apps as App[]) || []) if (await sendInvite(j, a)) out.invited++;
      await db.from("hiring_jobs").update({ invites_sent_at: new Date().toISOString() }).eq("id", j.id);
    }
    if (j.auto_approve && j.research_deadline && new Date(j.research_deadline).getTime() <= now && !j.approvals_run_at) {
      const { data: apps } = await db.from("hiring_applications").select("*").eq("job_id", j.id).eq("status", "submitted");
      for (const a of (apps as App[]) || []) if (await sendApproval(j, a)) out.approved++;
      await db.from("hiring_jobs").update({ approvals_run_at: new Date().toISOString() }).eq("id", j.id);
    }
  }
  return out;
}

export { notifyAdmin };
