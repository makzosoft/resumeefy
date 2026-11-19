export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { notifyAdmin, siteUrl } from "@/lib/mail";
import { clean, logEvent, newToken, phase, publicJob, sendInvite, sendReceived, startTimer, type App, type Job } from "@/lib/hiring";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const op = q.get("op");

  if (op === "job") {
    const { data } = await db.from("hiring_jobs").select("*").eq("slug", clean(q.get("slug"), 60)).maybeSingle();
    if (!data) return err("This job link is not valid.", 404);
    const j = await startTimer(data as Job);
    if (q.get("f") === "1") await logEvent(j.id, null, "view", "Page viewed");
    return NextResponse.json({ job: publicJob(j) }, noStore);
  }

  // Tracked link from the approval email: sends people on to partner signup with their hire token.
  if (op === "go") {
    const t = clean(q.get("t"), 60);
    const origin = siteUrl() || req.nextUrl.origin;
    const { data: a } = await db.from("hiring_applications").select("*").eq("token", t).maybeSingle();
    if (!a) return NextResponse.redirect(`${origin}/`);
    const bot = /bot|crawl|spider|preview|scanner|curl|slurp/i.test(req.headers.get("user-agent") || "");
    if (!bot && !(a as any).signup_clicked_at) {
      await db.from("hiring_applications").update({ signup_clicked_at: new Date().toISOString() }).eq("id", (a as any).id);
      await logEvent((a as any).job_id, (a as any).id, "signup_click", `${(a as any).name} opened the partner signup link`);
    }
    return NextResponse.redirect(`${origin}/partner?hire=${encodeURIComponent(t)}`);
  }

  if (op === "research") {
    const { data: a } = await db.from("hiring_applications").select("*").eq("token", clean(q.get("t"), 60)).maybeSingle();
    if (!a) return err("This link is not valid.", 404);
    const { data: j } = await db.from("hiring_jobs").select("*").eq("id", (a as App).job_id).maybeSingle();
    if (!j) return err("This role no longer exists.", 404);
    const job = j as Job, app = a as App;
    const closed = !!(job.research_deadline && new Date(job.research_deadline).getTime() <= Date.now());
    return NextResponse.json({ name: app.name, status: app.status, closed, job: { title: job.title, researchDeadline: job.research_deadline, commissionPct: job.commission_pct }, research: ["submitted", "approved", "joined"].includes(app.status) ? app.research : "" }, noStore);
  }
  return err("Unknown op.");
}

export async function POST(req: NextRequest) {
  const op = req.nextUrl.searchParams.get("op");
  const b = await req.json().catch(() => ({}));

  if (op === "apply") {
    const limited = rateLimit(`hire-apply:${clientKey(req)}`, 6, 3600_000);
    if (!limited.ok) return tooManyRequests(limited.retryAfterMs);
    const { data: jd } = await db.from("hiring_jobs").select("*").eq("slug", clean(b.slug, 60)).maybeSingle();
    if (!jd) return err("This job link is not valid.", 404);
    const j = jd as Job;
    if (phase(j) !== "applying") return err("Applications for this role are closed.");
    const name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), whatsapp = clean(b.whatsapp, 25), why = clean(b.why, 1500);
    if (name.length < 2) return err("Enter your full name.");
    if (!EMAIL_RE.test(email)) return err("Enter a valid email address.");
    if (whatsapp.replace(/\D/g, "").length < 10) return err("Enter a valid WhatsApp number.");
    if (why.length < 30) return err("Tell us a little more about why we should choose you (at least a couple of sentences).");
    if (b.accept !== true) return err(`Please confirm that you accept the ${j.commission_pct}% commission.`);
    const { data: ex } = await db.from("hiring_applications").select("id").eq("job_id", j.id).eq("email", email).maybeSingle();
    if (ex) return err("You have already applied with this email.");
    const id = newId("happ");
    const { error } = await db.from("hiring_applications").insert({ id, job_id: j.id, name, email, whatsapp, why, token: newToken() });
    if (error) return err("Could not save your application. Try again.", 500);
    await logEvent(j.id, id, "apply", `${name} applied`);
    await notifyAdmin("New hiring application", { heading: "New application", paragraphs: [`${name} applied for ${j.title}.`], rows: [["Name", name], ["Email", email], ["WhatsApp", whatsapp]] });
    const { data: na } = await db.from("hiring_applications").select("*").eq("id", id).maybeSingle();
    if (j.auto_email && na) {
      const sent = await sendInvite(j, na as App);
      return NextResponse.json({ message: sent ? "Application received. We have emailed you your research task. Check your inbox and spam folder." : "Application received. Check your email for what happens next." });
    }
    await sendReceived(j, { name, email });
    return NextResponse.json({ message: "Application received. Check your email for what happens next." });
  }

  if (op === "research") {
    const { data: a } = await db.from("hiring_applications").select("*").eq("token", clean(b.t, 60)).maybeSingle();
    if (!a) return err("This link is not valid.", 404);
    const app = a as App;
    const { data: j } = await db.from("hiring_jobs").select("*").eq("id", app.job_id).maybeSingle();
    if (!j) return err("This role no longer exists.", 404);
    const job = j as Job;
    if (!["invited", "submitted"].includes(app.status)) return err(app.status === "applied" ? "The research stage has not opened for you yet. We will email you." : "You can no longer change this.");
    if (job.research_deadline && new Date(job.research_deadline).getTime() <= Date.now()) return err("The deadline has passed.");
    const text = clean(b.text, 8000);
    if (text.length < 300) return err("Write a little more. Aim for at least 300 characters.");
    await db.from("hiring_applications").update({ research: text, status: "submitted", submitted_at: new Date().toISOString() }).eq("id", app.id);
    await logEvent(job.id, app.id, "research", `${app.name} ${app.status === "submitted" ? "updated" : "submitted"} their research`);
    await notifyAdmin("New hiring research submitted", { heading: "Research submitted", paragraphs: [`${app.name} sent in their research for ${job.title}.`], rows: [["Name", app.name], ["Role", job.title]] });
    return NextResponse.json({ message: "Received. We will email you after we have read everything." });
  }
  return err("Unknown op.");
}
