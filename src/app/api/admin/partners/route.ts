export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { emailShell, sendHtml, siteUrl } from "@/lib/mail";
import { clean, logEvent, newToken, processDue, sendApproval, sendInvite, sendRejected, slugify, type App, type Job } from "@/lib/hiring";
import { lastClicks } from "@/lib/partner-activity";

const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
const hours = (v: unknown) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n > 0 && n <= 24 * 365 ? n : null; };
async function admin() { const s = await getCurrentSession(); return s && s.role === "admin" ? s : null; }

export async function GET() {
  if (!(await admin())) return err("Admins only", 403);
  await processDue();
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const [partners, activity, jobs, apps, events, clicks] = await Promise.all([
    db.from("affiliates").select("id,full_name,email,phone,status,code,created_at,approved_at,last_login,last_seen,inactivity_warned_at,total_clicks,total_signups,total_sales,total_commission").not("email", "is", null).order("created_at", { ascending: false }).limit(500),
    db.from("partner_activity").select("kind,detail,created_at,affiliates(full_name,email)").order("created_at", { ascending: false }).limit(150),
    db.from("hiring_jobs").select("*").order("created_at", { ascending: false }),
    db.from("hiring_applications").select("id,job_id,name,email,whatsapp,why,status,research,invited_at,submitted_at,approved_at,joined_at,created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("hiring_events").select("id,job_id,type,text,created_at").neq("type", "view").order("created_at", { ascending: false }).limit(200),
    lastClicks(since),
  ]);
  return NextResponse.json({
    partners: ((partners.data as any[]) || []).map((p) => ({ ...p, last_click: clicks[p.id] || null })),
    activity: activity.data || [], jobs: jobs.data || [], applications: apps.data || [], events: events.data || [], site: siteUrl(),
  });
}

export async function POST(req: Request) {
  if (!(await admin())) return err("Admins only", 403);
  const b = await req.json().catch(() => ({}));
  const act = String(b.action || "");

  if (act === "partner_status" && b.id && ["active", "suspended"].includes(String(b.status))) {
    const { data: p } = await db.from("affiliates").select("id,email,full_name,status").eq("id", String(b.id)).maybeSingle();
    if (!p) return err("Partner not found", 404);
    const upd: Record<string, unknown> = { status: b.status };
    if (b.status === "active") Object.assign(upd, { approved_at: new Date().toISOString(), reactivated_at: new Date().toISOString(), inactivity_warned_at: null });
    await db.from("affiliates").update(upd).eq("id", String(b.id));
    if (b.status === "active" && (p as any).status === "pending" && (p as any).email) {
      await sendHtml((p as any).email, "Your Resumeefy partner account is approved", emailShell({ heading: `Welcome aboard, ${String((p as any).full_name || "").split(" ")[0] || "partner"}`, paragraphs: ["Your partner account has been approved. Sign in to get your referral link and start earning."], cta: { label: "Open my dashboard", url: `${siteUrl()}/partner` } }));
    }
    return NextResponse.json({ ok: true });
  }

  if (act === "job_save") {
    const title = clean(b.title, 80);
    if (title.length < 3) return err("Give the job a title.");
    const groupUrl = clean(b.group_url, 300);
    if (groupUrl && !/^https?:\/\/[^\s]+$/i.test(groupUrl)) return err("The group chat link must start with https://");
    const row: Record<string, unknown> = {
      title, description: clean(b.description, 3000), commission_pct: Math.min(90, Math.max(1, Math.round(Number(b.commission_pct) || 40))),
      open: b.open !== false, apply_duration_h: hours(b.apply_duration_h), research_duration_h: hours(b.research_duration_h),
      auto_email: b.auto_email !== false, auto_approve: !!b.auto_approve, group_url: groupUrl,
    };
    if (b.id) {
      const { error } = await db.from("hiring_jobs").update(row).eq("id", String(b.id));
      if (error) return err("Could not save.", 500);
      await logEvent(String(b.id), null, "job", `Job "${title}" edited`);
      return NextResponse.json({ ok: true });
    }
    let slug = slugify(title) || "job";
    for (let i = 0; i < 6; i++) {
      const id = newId("hjob");
      const { error } = await db.from("hiring_jobs").insert({ ...row, id, slug });
      if (!error) { await logEvent(id, null, "job", `Job "${title}" created`); return NextResponse.json({ ok: true, slug }); }
      if (/duplicate|unique/i.test(error.message)) { slug = `${slugify(title).slice(0, 40)}-${newToken().slice(0, 4).toLowerCase().replace(/[^a-z0-9]/g, "x")}`; continue; }
      return err("Could not create the job.", 500);
    }
    return err("Could not create the job.", 500);
  }

  if (act === "job_delete" && b.id) { await db.from("hiring_jobs").delete().eq("id", String(b.id)); return NextResponse.json({ ok: true }); }

  if (act === "job_invite_all" && b.id) {
    const { data: j } = await db.from("hiring_jobs").select("*").eq("id", String(b.id)).maybeSingle();
    if (!j) return err("Job not found", 404);
    const { data: apps } = await db.from("hiring_applications").select("*").eq("job_id", String(b.id)).eq("status", "applied");
    let n = 0; for (const a of (apps as App[]) || []) if (await sendInvite(j as Job, a)) n++;
    await db.from("hiring_jobs").update({ invites_sent_at: new Date().toISOString() }).eq("id", String(b.id));
    return NextResponse.json({ ok: true, message: `Research task sent to ${n} of ${(apps || []).length} applicant(s).` });
  }

  if (act === "app_action" && b.id) {
    const { data: a } = await db.from("hiring_applications").select("*").eq("id", String(b.id)).maybeSingle();
    if (!a) return err("Application not found", 404);
    const { data: j } = await db.from("hiring_jobs").select("*").eq("id", (a as App).job_id).maybeSingle();
    if (!j) return err("Job not found", 404);
    const what = String(b.what || "");
    if (what === "invite") return NextResponse.json({ ok: true, message: (await sendInvite(j as Job, a as App)) ? "Research task emailed." : "Moved on, but the email could not be sent (check your email settings)." });
    if (what === "approve") return NextResponse.json({ ok: true, message: (await sendApproval(j as Job, a as App)) ? "Approved and emailed the signup link." : "Approved, but the email could not be sent (check your email settings)." });
    if (what === "reject") { await db.from("hiring_applications").update({ status: "rejected" }).eq("id", (a as App).id); await logEvent((j as Job).id, (a as App).id, "rejected", `${(a as App).name} not taken forward`); await sendRejected(j as Job, a as App); return NextResponse.json({ ok: true, message: "Marked as not taken forward." }); }
    if (what === "reset") { await db.from("hiring_applications").update({ status: "applied" }).eq("id", (a as App).id); return NextResponse.json({ ok: true, message: "Moved back to applied." }); }
  }
  return err("Invalid action");
}
