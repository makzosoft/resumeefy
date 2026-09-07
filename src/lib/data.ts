

export async function recordAffiliateClick(code: string, path?: string, source?: string, userAgent?: string) {
  const affiliate = await getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") return null;
  const result = await (await import("./db")).rpc<any>("record_affiliate_click", { p_affiliate_id: affiliate.id, p_code: affiliate.code, p_path: path ?? null, p_source: source ?? null, p_user_agent: userAgent ?? null });
  throwDb(result.error);
  return affiliate;
}

export async function recordAffiliateLead(code: string, email: string, userId?: string | null) {
  const result = await (await import("./db")).rpc<any>("record_affiliate_lead", { p_code: code, p_email: email, p_user_id: userId ?? null });
  throwDb(result.error);
  return result.data ?? null;
}

export async function updateAffiliatePayoutAccount(userId: string, input: { accountNumber: string; accountName?: string; bankName?: string }) {
  const affiliate = await getAffiliateByUser(userId);
  if (!affiliate) throw new Error("Affiliate account not found");
  const { error } = await db.from("affiliates").update({ payout_account_number: input.accountNumber, payout_account_name: input.accountName ?? null, payout_bank_name: input.bankName ?? null, updated_at: new Date().toISOString() }).eq("id", affiliate.id);
  throwDb(error);
  return getAffiliateByUser(userId);
}

export async function getActiveAffiliateLeadByEmail(email: string) {
  const { data, error } = await db.from("affiliate_referral_leads").select("affiliate_code,expires_at").eq("email", email.toLowerCase()).gte("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}

export async function recordAffiliateAttribution(userId: string, code: string) {
  const result = await (await import("./db")).rpc<any>("record_affiliate_attribution", { p_user_id: userId, p_code: code });
  throwDb(result.error);
  return result.data ?? null;
}

export async function createCreditPurchase(userId: string, pack: { id: string; credits: number; amount: number; currency: string; rate?: number; country?: string }, txRef: string, affiliate?: { id: string; code: string; commission: number } | null) {
  const { error } = await db.from("credit_purchases").insert({ id: newId("cp"), user_id: userId, pack_id: pack.id, credits: pack.credits, amount: pack.amount, currency: pack.currency, tx_ref: txRef, affiliate_id: affiliate?.id ?? null, affiliate_code: affiliate?.code ?? null, affiliate_commission: affiliate?.commission ?? 0, affiliate_commission_status: affiliate ? "pending" : "none", currency_rate: pack.rate ?? null, country: pack.country ?? null });
  throwDb(error);
}
export async function getCreditPurchase(txRef: string) { const { data, error } = await db.from("credit_purchases").select("*").eq("tx_ref", txRef).maybeSingle(); throwDb(error); return data ?? undefined; }
export async function completeCreditPurchase(txRef: string) { const { rpc } = await import("./db"); const result = await rpc<any>("complete_credit_purchase", { p_tx_ref: txRef }); throwDb(result.error); return result.data; }
export async function failCreditPurchase(txRef: string) { const { error } = await db.from("credit_purchases").update({ status: "failed" }).eq("tx_ref", txRef); throwDb(error); }

export async function saveCourse(userId: string | null, course: Record<string, unknown>) { const id = newId("course"); const { error } = await db.from("courses").insert({ id, user_id: userId, title: course.title, description: course.description, target_role: course.targetRole ?? null, difficulty: course.difficulty ?? null, estimated_hours: course.estimatedHours ?? null, hero_type: course.heroType ?? "svg", hero_asset: course.heroAsset ?? null, content_json: course }); throwDb(error); return id; }
export async function getCourses(userId: string) { const { data, error } = await db.from("courses").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(20); throwDb(error); return data ?? []; }
export async function saveCourseSubmission(input: Record<string, unknown>) { const { error } = await db.from("course_submissions").insert({ id: newId("sub"), ...input }); throwDb(error); }

export async function getAffiliateDashboard(userId: string) {
  const affiliate = await getAffiliateByUser(userId);
  if (!affiliate) return null;
  const [commissions, clicks, attributions] = await Promise.all([
    db.from("affiliate_commissions").select("amount,currency,status,created_at,purchase_id").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(100),
    db.from("referral_clicks").select("id,landing_path,source,created_at").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(100),
    db.from("affiliate_attributions").select("created_at,first_seen_at,last_seen_at,expires_at").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(100),
  ]);
  [commissions, clicks, attributions].forEach(r => throwDb(r.error));
  return { affiliate, commissions: commissions.data ?? [], clicks: clicks.data ?? [], attributions: attributions.data ?? [] };
}

export async function createAffiliatePayoutRequest(userId: string, amount: number, currency: string) {
  const affiliate = await getAffiliateByUser(userId);
  if (!affiliate || affiliate.status !== "active") throw new Error("Affiliate account is not active");
  const { data, error } = await db.from("affiliate_commissions").select("amount").eq("affiliate_id", affiliate.id).eq("currency", currency.toUpperCase()).eq("status", "pending");
  throwDb(error);
  const available = (data ?? []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  if (amount <= 0 || amount > available) throw new Error(`Only ${available.toLocaleString()} ${currency.toUpperCase()} is currently available for payout`);
  const { error: insertError } = await db.from("affiliate_payout_requests").insert({ id: newId("payout"), affiliate_id: affiliate.id, amount, currency: currency.toUpperCase(), status: "requested" });
  throwDb(insertError);
  return true;
}

export async function setAffiliateStatus(affiliateId: string, status: "active" | "suspended") {
  const { error } = await db.from("affiliates").update({ status, updated_at: new Date().toISOString() }).eq("id", affiliateId);
  throwDb(error);
  return true;
}

export async function markAffiliatePayoutPaid(payoutId: string) {
  const result = await (await import("./db")).rpc<any>("mark_affiliate_payout_paid", { p_payout_id: payoutId });
  throwDb(result.error);
  return true;
}

export async function getAffiliatePayoutRequests() {
  const { data, error } = await db.from("affiliate_payout_requests").select("*,affiliates(code,display_name)").order("created_at", { ascending: false }).limit(200);
  throwDb(error);
  return data ?? [];
}

export async function saveBlogPost(post: Record<string, unknown>) { const id = newId("blog"); const { error } = await db.from("blog_posts").insert({ id, ...post }); throwDb(error); return id; }
export async function getBlogPosts(limit = 30) { const { data, error } = await db.from("blog_posts").select("*").order("published_at", { ascending: false }).limit(limit); throwDb(error); return data ?? []; }
export async function getBlogPostBySlug(slug: string) { const { data, error } = await db.from("blog_posts").select("*").eq("slug", slug).maybeSingle(); throwDb(error); return data ?? undefined; }
export async function trackBlogEvent(blogId: string, event: string, userId?: string | null, metadata?: Record<string, unknown>) { const { error } = await db.from("blog_events").insert({ id: newId("be"), blog_id: blogId, user_id: userId ?? null, event, metadata: metadata ?? {} }); throwDb(error); }