/**
 * Minimal Supabase PostgREST server client.
 * Uses fetch directly so the Vercel deployment has no native database driver.
 * This module must only run on the server and uses the Supabase service role key.
 */


type DbResult<T> = { data: T | null; error: { message: string } | null; count?: number | null };

type Scalar = string | number | boolean | null;
type Filter = { column: string; expr: string };

type QueryState = {
  table: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  select?: string;
  returning?: boolean;
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

if (!baseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables");
}

// Legacy service_role keys are JWTs and are sent as both `apikey` and a Bearer token.
// The newer `sb_secret_...` keys are not JWTs and must only be sent in the `apikey` header.
const authHeaders: Record<string, string> = serviceRoleKey.startsWith("eyJ")
  ? { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  : { apikey: serviceRoleKey };

function encodeFilterValue(value: Scalar): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).replace(/([,()])/g, "\\$1");
}

async function execute<T>(state: QueryState): Promise<DbResult<T>> {
  try {
    const params = new URLSearchParams();
    if (state.method === "GET" || (state.returning && state.select)) params.set("select", state.select || "*");
    if (state.order) params.set("order", `${state.order.column}.${state.order.ascending ? "asc" : "desc"}`);
    if (state.limit !== undefined) params.set("limit", String(state.limit));
    for (const filter of state.filters) params.set(filter.column, filter.expr);

    const headers: Record<string, string> = {
      ...authHeaders,
      Accept: "application/json",
    };
    if (state.method === "POST" || state.method === "PATCH") headers["Content-Type"] = "application/json";
    if (state.method !== "GET") headers.Prefer = state.returning ? "return=representation" : "return=minimal";
    if (state.countExact) headers.Prefer = `${headers.Prefer ? headers.Prefer + "," : ""}count=exact`;

    const response = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(state.table)}?${params.toString()}`, {
      method: state.method,
      headers,
      body: state.method === "GET" || state.method === "DELETE" ? undefined : JSON.stringify(state.body),
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
    if (this.state.method !== "GET") this.state.returning = true; // insert/update/delete(...).select() returns the rows
    return this;
  }
  insert(body: unknown) { this.state.method = "POST"; this.state.body = body; return this; }
  update(body: unknown) { this.state.method = "PATCH"; this.state.body = body; return this; }
  delete() { this.state.method = "DELETE"; return this; }
  eq(column: string, value: Scalar) { this.state.filters.push({ column, expr: `eq.${encodeFilterValue(value)}` }); return this; }
  neq(column: string, value: Scalar) { this.state.filters.push({ column, expr: `neq.${encodeFilterValue(value)}` }); return this; }
  gte(column: string, value: Scalar) { this.state.filters.push({ column, expr: `gte.${encodeFilterValue(value)}` }); return this; }
  is(column: string, value: null | boolean) { this.state.filters.push({ column, expr: `is.${value === null ? "null" : value}` }); return this; }
  not(column: string, op: "eq" | "neq" | "is" | "gte", value: Scalar) { this.state.filters.push({ column, expr: `not.${op}.${op === "is" && value === null ? "null" : encodeFilterValue(value)}` }); return this; }
  in(column: string, values: Scalar[]) { this.state.filters.push({ column, expr: `in.(${values.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",")})` }); return this; }
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
  try {
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${encodeURIComponent(fn)}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json", Accept: "application/json" },
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
