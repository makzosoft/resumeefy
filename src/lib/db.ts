/**
 * Minimal Supabase PostgREST server client.
 * Uses fetch directly so the Vercel deployment has no native database driver.
 * This module must only run on the server and uses the Supabase service role key.
 */

import { DEMO_MODE, DEMO_USER_ID, DEMO_EMAIL, DEMO_NAME } from "./demo";

type DbResult<T> = { data: T | null; error: { message: string } | null; count?: number | null };

type Filter = { column: string; op: "eq" | "gte"; value: string | number | boolean | null };

type QueryState = {
  table: string;
  method: "GET" | "POST" | "PATCH";
  select?: string;
  body?: unknown;
  filters: Filter[];
  order?: { column: string; ascending: boolean };
  limit?: number;
  head?: boolean;
  countExact?: boolean;
  single?: boolean;
};

const baseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Small in-process store used only by demo mode. It intentionally disappears when the server restarts.
const demoTables: Record<string, any[]> = {
  users: [{ id: DEMO_USER_ID, name: DEMO_NAME, email: DEMO_EMAIL, role: "user", invite_code: "DEMO123", created_at: new Date().toISOString() }],
  credit_wallets: [{ user_id: DEMO_USER_ID, balance: 500, lifetime_earned: 500, lifetime_spent: 0 }],
  tracking_events: [], assessments: [], resumes: [], leads: [], payments: [], credit_purchases: [], credit_transactions: [],
  affiliates: [], affiliate_commissions: [], affiliate_payout_requests: [], affiliate_referral_leads: [], user_referrals: [], daily_login_rewards: [],
  courses: [], course_submissions: [], blog_posts: [], blog_events: []
};

if (!DEMO_MODE && (!baseUrl || !serviceRoleKey)) {
  throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables");
}

function encodeFilterValue(value: Filter["value"]): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).replace(/([,()])/g, "\\$1");
}

function demoExecute<T>(state: QueryState): DbResult<T> {
  const rows = demoTables[state.table] || (demoTables[state.table] = []);
  const matches = rows.filter((row) =>
    state.filters.every((f) =>
      f.op === "gte" ? row[f.column] >= (f.value as any) : row[f.column] === f.value
    )
  );
  if (state.method === "POST") {
    const incoming = Array.isArray(state.body) ? state.body : [state.body];
    rows.push(...incoming.map((x) => ({ ...(x as any) })));
    return { data: null, error: null };
  }
  if (state.method === "PATCH") {
    matches.forEach((row) => Object.assign(row, state.body as any));
    return { data: null, error: null };
  }
  let result = [...matches];
  if (state.order) result.sort((a,b) => { const av=a[state.order!.column], bv=b[state.order!.column]; return (av===bv?0:(av>bv?1:-1)) * (state.order!.ascending?1:-1); });
  if (state.limit !== undefined) result = result.slice(0, state.limit);
  if (state.single) return { data: (result[0] ?? null) as T, error: null, count: result.length };
  if (state.head) return { data: null, error: null, count: matches.length };
  return { data: result as T, error: null, count: matches.length };
}

async function execute<T>(state: QueryState): Promise<DbResult<T>> {
  if (DEMO_MODE) return demoExecute<T>(state);
  try {
    const params = new URLSearchParams();
    if (state.method === "GET") params.set("select", state.select || "*");
    if (state.order) params.set("order", `${state.order.column}.${state.order.ascending ? "asc" : "desc"}`);
    if (state.limit !== undefined) params.set("limit", String(state.limit));
    for (const filter of state.filters) params.set(filter.column, `${filter.op}.${encodeFilterValue(filter.value)}`);

    const headers: Record<string, string> = {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    };
    if (state.method === "POST") {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=minimal";
    } else if (state.method === "PATCH") {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=minimal";
    }
    if (state.countExact) headers.Prefer = `${headers.Prefer ? headers.Prefer + "," : ""}count=exact`;

    const response = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(state.table)}?${params.toString()}`, {
      method: state.method,
      headers,
      body: state.method === "GET" ? undefined : JSON.stringify(state.body),
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!response.ok) {
      const message = typeof data === "object" && data && "message" in data ? String((data as { message: unknown }).message) : `Supabase request failed (${response.status})`;
      return { data: null, error: { message } };
    }

    let count: number | null = null;
    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      const match = contentRange.match(/\/([0-9*]+)$/);
      if (match && match[1] !== "*") count = Number(match[1]);
    }

    if (state.head) return { data: null, error: null, count };
    if (state.single) {
      const rows = Array.isArray(data) ? data : [];
      return { data: (rows[0] ?? null) as T | null, error: null, count };
    }
    return { data: data as T, error: null, count };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Database request failed" } };
  }
}

class QueryBuilder<T = unknown> implements PromiseLike<DbResult<T>> {
  private state: QueryState;
  constructor(table: string) { this.state = { table, method: "GET", filters: [] }; }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.state.select = columns;
    this.state.countExact = options?.count === "exact";
    this.state.head = options?.head === true;
    return this;
  }
  insert(body: unknown) { this.state.method = "POST"; this.state.body = body; return this; }
  update(body: unknown) { this.state.method = "PATCH"; this.state.body = body; return this; }
  eq(column: string, value: string | number | boolean | null) { this.state.filters.push({ column, op: "eq", value }); return this; }
  gte(column: string, value: string | number | boolean | null) { this.state.filters.push({ column, op: "gte", value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.state.order = { column, ascending: options?.ascending !== false }; return this; }
  limit(value: number) { this.state.limit = value; return this; }
  maybeSingle() { this.state.single = true; return this; }
  then<TResult1 = DbResult<T>, TResult2 = never>(onfulfilled?: ((value: DbResult<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) {
    return execute<T>(this.state).then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

export const db = {
  from<T = any>(table: string) { return new QueryBuilder<T>(table); },
};

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<DbResult<T>> {
  if (DEMO_MODE) {
    const userId = String(args.p_user_id || args.p_invitee_user_id || DEMO_USER_ID);
    const wallet = (demoTables.credit_wallets.find((x) => x.user_id === userId) || (() => { const x={user_id:userId,balance:100}; demoTables.credit_wallets.push(x); return x; })());
    if (fn === "ensure_credit_wallet") return { data: wallet.balance as T, error: null };
    if (fn === "spend_credits") { const amount=Number(args.p_amount||0); if(wallet.balance<amount) return {data:null,error:{message:"INSUFFICIENT_CREDITS"}}; wallet.balance-=amount; demoTables.credit_transactions.push({id:newId("ctx"),user_id:userId,amount:-amount,type:"spend",feature:args.p_feature||"demo",created_at:new Date().toISOString()}); return {data:{balance:wallet.balance} as T,error:null}; }
    if (fn === "add_credits") { const amount=Number(args.p_amount||0); wallet.balance+=amount; demoTables.credit_transactions.push({id:newId("ctx"),user_id:userId,amount,type:args.p_type||"reward",feature:args.p_feature||null,created_at:new Date().toISOString()}); return {data:{balance:wallet.balance} as T,error:null}; }
    if (fn === "record_user_referral") return {data:null,error:null};
    if (fn === "complete_user_referral") return {data:null,error:null};
    if (fn === "claim_daily_login_reward") { const today=new Date().toISOString().slice(0,10); if(demoTables.daily_login_rewards.some(x=>x.user_id===userId&&x.reward_date===today)) return {data:0 as T,error:null}; wallet.balance+=1; demoTables.daily_login_rewards.push({id:newId("login"),user_id:userId,reward_date:today,credits:1,created_at:new Date().toISOString()}); return {data:1 as T,error:null}; }
    if (fn === "complete_credit_purchase") { const ref=String(args.p_tx_ref||""); const purchase=demoTables.credit_purchases.find(x=>x.tx_ref===ref); if(purchase&&purchase.status!=="successful"){purchase.status="successful"; const w=demoTables.credit_wallets.find(x=>x.user_id===purchase.user_id)||{user_id:purchase.user_id,balance:0}; if(!demoTables.credit_wallets.includes(w)) demoTables.credit_wallets.push(w); w.balance+=Number(purchase.credits||0); } return {data:true as T,error:null}; }
    return { data: null, error: null };
  }
  try {
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${encodeURIComponent(fn)}`, {
      method: "POST",
      headers: { apikey: serviceRoleKey!, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(args), cache: "no-store",
    });
    const text = await response.text();
    let data: unknown = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) return { data: null, error: { message: typeof data === "object" && data && "message" in data ? String((data as any).message) : `Supabase RPC failed (${response.status})` } };
    return { data: data as T, error: null };
  } catch (error) { return { data: null, error: { message: error instanceof Error ? error.message : "Supabase RPC failed" } };
  }
}