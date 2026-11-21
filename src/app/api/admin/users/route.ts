export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db, rpc } from "@/lib/db";

const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
async function admin() { const s = await getCurrentSession(); return s && s.role === "admin" ? s : null; }

export async function GET(req: NextRequest) {
  if (!(await admin())) return err("Admins only", 403);
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const [u, w, a, p] = await Promise.all([
    db.from("users").select("id,name,email,role,created_at").order("created_at", { ascending: false }).limit(3000),
    db.from("credit_wallets").select("user_id,balance,lifetime_spent").limit(5000),
    db.from("assessments").select("user_id").limit(30000),
    db.from("credit_purchases").select("user_id,status").limit(20000),
  ]);
  const wallet: Record<string, any> = Object.fromEntries((((w.data as any[]) || [])).map((x) => [x.user_id, x]));
  const taken: Record<string, number> = {}; ((a.data as any[]) || []).forEach((x) => { taken[x.user_id] = (taken[x.user_id] || 0) + 1; });
  const bought: Record<string, number> = {}; ((p.data as any[]) || []).filter((x) => x.status === "successful").forEach((x) => { bought[x.user_id] = (bought[x.user_id] || 0) + 1; });
  let rows = ((u.data as any[]) || []);
  const total = rows.length;
  if (q) rows = rows.filter((x) => String(x.email).toLowerCase().includes(q) || String(x.name).toLowerCase().includes(q));
  return NextResponse.json({
    total, users: rows.slice(0, 100).map((x) => ({ ...x, balance: wallet[x.id]?.balance ?? 0, spent: wallet[x.id]?.lifetime_spent ?? 0, assessments: taken[x.id] || 0, purchases: bought[x.id] || 0 })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await admin())) return err("Admins only", 403);
  const b = await req.json().catch(() => ({}));
  if (b.action === "grant" && b.userId) {
    const amount = Math.round(Number(b.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 10000) return err("Enter an amount from 1 to 10000.");
    const { error } = await rpc("add_credits", { p_user_id: String(b.userId), p_amount: amount, p_type: "admin_adjustment", p_feature: "admin_grant", p_reference_id: null, p_metadata: { note: String(b.note || "").slice(0, 200) } });
    if (error) return err("Could not add credits.", 500);
    return NextResponse.json({ ok: true, message: `Added ${amount} credits.` });
  }
  return err("Invalid action");
}
