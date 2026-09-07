import { db, newId } from "./db";

function throwDb(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Database operation failed");
}

export async function trackEvent(name: string, opts: { userId?: string | null; meta?: Record<string, unknown> } = {}) {
  const eventId = newId("evt");
  const { error } = await db.from("tracking_events").insert({
    id: eventId,
    user_id: opts.userId ?? null,
    name,
    meta_json: opts.meta ?? {},
  });
  throwDb(error);
  const analyticsUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (analyticsUrl) {
    fetch(analyticsUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "event", eventId, timestamp: new Date().toISOString(), event: name, userId: opts.userId ?? "", properties: opts.meta ?? {} }),
      cache: "no-store",
    }).catch(() => {});
  }
}

export async function getAdminStats() {
  const [users, leads, assessments, payments, eventCounts, recentEvents, dailySignups, affiliates, affiliateCommissions, affiliatePayouts, referralLeads, blogPosts, blogEvents, userReferrals, dailyRewards] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("leads").select("id", { count: "exact", head: true }),
    db.from("assessments").select("overall_score"),
    db.from("credit_purchases").select("amount,currency,status,affiliate_commission").eq("status", "successful"),
    db.from("tracking_events").select("name").order("created_at", { ascending: false }).limit(5000),
    db.from("tracking_events").select("name, meta_json, created_at, users(email)").order("created_at", { ascending: false }).limit(50),
    db.from("users").select("created_at").order("created_at", { ascending: false }).limit(5000),
    db.from("affiliates").select("id,code,display_name,status,total_clicks,total_signups,total_sales,total_credits,total_commission,pending_commission,paid_commission,payout_account_number,payout_account_name,payout_bank_name").order("total_commission", { ascending: false }).limit(100),
    db.from("affiliate_commissions").select("amount,currency,status,created_at,affiliates(code,display_name)").order("created_at", { ascending: false }).limit(5000),
    db.from("affiliate_payout_requests").select("id,amount,currency,status,created_at,affiliates(code,display_name)").order("created_at", { ascending: false }).limit(200),
    db.from("affiliate_referral_leads").select("email,affiliate_code,user_id,converted_at,expires_at,created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("blog_posts").select("id,slug,title,topic,primary_keyword,search_intent,word_count,published_at,marketing" ).order("published_at", { ascending: false }).limit(100),
    db.from("blog_events").select("blog_id,event,created_at").order("created_at", { ascending: false }).limit(10000),
    db.from("user_referrals").select("id,inviter_user_id,invitee_email,status,inviter_reward,invitee_reward,created_at,completed_at").order("created_at", { ascending: false }).limit(1000),
    db.from("daily_login_rewards").select("id,user_id,reward_date,credits,created_at").order("created_at", { ascending: false }).limit(1000),
  ]);
  [users, leads, assessments, payments, eventCounts, recentEvents, dailySignups, affiliates, affiliateCommissions, affiliatePayouts, referralLeads, blogPosts, blogEvents, userReferrals, dailyRewards].forEach((r) => throwDb(r.error));
  const scores = (assessments.data ?? []).map((x) => Number(x.overall_score)).filter(Number.isFinite);
  const revenue = (payments.data ?? []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const revenueByCurrency: Record<string, number> = {};
  for (const row of payments.data ?? []) revenueByCurrency[row.currency] = (revenueByCurrency[row.currency] || 0) + Number(row.amount || 0);
  const counts = new Map<string, number>();
  for (const row of eventCounts.data ?? []) counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
  const days = new Map<string, number>();
  for (const row of dailySignups.data ?? []) { const day = String(row.created_at).slice(0, 10); days.set(day, (days.get(day) ?? 0) + 1); }
  const blogStats = new Map<string, { views: number; shares: number; ctas: number }>();
  for (const row of blogEvents.data ?? []) { const current = blogStats.get(row.blog_id) ?? { views: 0, shares: 0, ctas: 0 }; if (row.event === "view" || row.event === "read" || row.event === "blog_read" || row.event === "blog_open") current.views++; if (row.event === "share" || row.event === "blog_share") current.shares++; if (row.event === "cta_click" || row.event === "blog_cta_click") current.ctas++; blogStats.set(row.blog_id, current); }
  return {
    totalUsers: users.count ?? 0, totalLeads: leads.count ?? 0, totalAssessments: assessments.data?.length ?? 0, avgScore: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0,
    totalRevenue: revenue, revenueByCurrency, successfulPayments: payments.data?.length ?? 0, affiliateRevenue: (affiliateCommissions.data ?? []).reduce((s,x)=>s+Number(x.amount||0),0),
    affiliates: affiliates.data ?? [], affiliateCommissions: affiliateCommissions.data ?? [], affiliatePayouts: affiliatePayouts.data ?? [], referralLeads: referralLeads.data ?? [], userReferrals: userReferrals.data ?? [], dailyLoginRewards: dailyRewards.data ?? [],
    eventCounts: [...counts.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,20),
    recentEvents: (recentEvents.data ?? []).map((e:any)=>({name:e.name,meta_json:JSON.stringify(e.meta_json??{}),created_at:e.created_at,email:Array.isArray(e.users)?e.users[0]?.email??null:(e.users as any)?.email??null,meta:e.meta_json??{}})),
    dailySignups: [...days.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14).map(([day,count])=>({day,count})),
    blogProgress: (blogPosts.data ?? []).map((p:any)=>({ ...p, ...(blogStats.get(p.id) ?? {views:0,shares:0,ctas:0}) })),
  };
}

export async function saveLead(email: string, source: string) {
  const { error } = await db.from("leads").insert({ id: newId("lead"), email, source });
  throwDb(error);
}

export async function saveAssessment(userId: string, scores: Record<string, number>, targetRole?: string, targetCompany?: string, xp = 0) {
  const values = Object.values(scores);
  const overall = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const id = newId("asmt");
  const { error } = await db.from("assessments").insert({
    id,
    user_id: userId,
    target_role: targetRole ?? null,
    target_company: targetCompany ?? null,
    scores_json: scores,
    overall_score: overall,
    xp_earned: xp,
  });
  throwDb(error);
  return { id, overall };
}

export async function getUserAssessments(userId: string) {
  const { data, error } = await db.from("assessments").select("*").eq("user_id", userId).order("completed_at", { ascending: false });
  throwDb(error);
  return (data ?? []).map((a) => ({ ...a, scores_json: JSON.stringify(a.scores_json ?? {}) }));
}

export async function upsertResume(userId: string, resumeId: string | null, data: Record<string, unknown>) {
  if (resumeId) {
    const { error } = await db.from("resumes").update({ data_json: data, updated_at: new Date().toISOString() }).eq("id", resumeId).eq("user_id", userId);
    throwDb(error);
    return resumeId;
  }
  const id = newId("resume");
  const { error } = await db.from("resumes").insert({ id, user_id: userId, data_json: data });
  throwDb(error);
  return id;
}

export async function unlockResume(resumeId: string, tier = "boost") {
  const { error } = await db.from("resumes").update({ is_unlocked: true, selected_tier: tier }).eq("id", resumeId);
  throwDb(error);
}

export async function getResume(resumeId: string, userId: string) {
  const { data, error } = await db.from("resumes").select("id, data_json, is_unlocked").eq("id", resumeId).eq("user_id", userId).maybeSingle();
  throwDb(error);
  if (!data) return undefined;
  return { id: data.id, data_json: JSON.stringify(data.data_json ?? {}), is_unlocked: data.is_unlocked };
}

export async function getLatestResume(userId: string) {
  const { data, error } = await db.from("resumes").select("id, data_json, is_unlocked, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  throwDb(error);
  if (!data) return undefined;
  return { id: data.id, data_json: JSON.stringify(data.data_json ?? {}), is_unlocked: data.is_unlocked, updated_at: data.updated_at };
}

export async function createPendingPayment(userId: string, resumeId: string, txRef: string, amount: number) {
  const { error } = await db.from("payments").insert({ id: newId("pay"), user_id: userId, resume_id: resumeId, tx_ref: txRef, amount });
  throwDb(error);
}

export async function markPaymentSuccessful(txRef: string, flwTransactionId: string) {
  const { error } = await db.from("payments").update({ status: "successful", flw_transaction_id: flwTransactionId, verified_at: new Date().toISOString() }).eq("tx_ref", txRef);
  throwDb(error);
}

export async function markPaymentFailed(txRef: string) {
  const { error } = await db.from("payments").update({ status: "failed" }).eq("tx_ref", txRef);
  throwDb(error);
}

export async function getPaymentByTxRef(txRef: string) {
  const { data, error } = await db.from("payments").select("id, user_id, resume_id, amount, status").eq("tx_ref", txRef).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}


export async function getUserInviteProfile(userId: string) {
  const { data, error } = await db.from("users").select("id,name,email,invite_code").eq("id", userId).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}

export async function recordUserReferral(code: string, email: string, userId?: string | null) {
  const result = await (await import("./db")).rpc<any>("record_user_referral", { p_invite_code: code, p_email: email, p_user_id: userId ?? null });
  throwDb(result.error);
  return result.data ?? null;
}

export async function getUserInviteReferralByEmail(email: string) {
  const { data, error } = await db.from("user_referrals").select("invite_code,status,created_at").eq("invitee_email", email.toLowerCase()).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}

export async function completeUserReferral(userId: string, email: string, code: string) {
  const result = await (await import("./db")).rpc<any>("complete_user_referral", { p_invitee_user_id: userId, p_email: email, p_invite_code: code });
  throwDb(result.error);
  return result.data ?? null;
}

export async function claimDailyLoginReward(userId: string) {
  const result = await (await import("./db")).rpc<any>("claim_daily_login_reward", { p_user_id: userId });
  throwDb(result.error);
  return result.data ?? null;
}

export async function getUserReferralStats(userId: string) {
  const [profile, referrals, rewards] = await Promise.all([
    getUserInviteProfile(userId),
    db.from("user_referrals").select("invitee_email,status,inviter_reward,completed_at,created_at").eq("inviter_user_id", userId).order("created_at", { ascending: false }).limit(100),
    db.from("credit_transactions").select("amount,created_at,feature,metadata").eq("user_id", userId).eq("type", "user_referral").order("created_at", { ascending: false }).limit(100),
  ]);
  throwDb(referrals.error); throwDb(rewards.error);
  const completed = (referrals.data ?? []).filter((r:any) => r.status === "completed");
  return { profile, referrals: referrals.data ?? [], rewards: rewards.data ?? [], completedCount: completed.length, earned: completed.reduce((sum:number,r:any)=>sum+Number(r.inviter_reward||0),0) };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await db.from("users").select("id, name, email, role").eq("id", userId).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}



export const CREDIT_COSTS = {
  resume_boost: 100,
  resume_professional: 140,
  resume_executive: 180,
  resume_international: 220,
  resume_ai: 20,
  job_match: 10,
  resume_quality: 8,
  interview: 15,
  interview_feedback: 8,
  desktop_sim: 20,
  assessment_module: 10,
  course_generation: 25,
  course_late_unlock: 20,
  course_certificate: 40,
} as const;

export const CREDIT_PACKS = [
  { id: "ng_100", credits: 100, amount: 5000, currency: "NGN", label: "Starter" },
  { id: "ng_250", credits: 250, amount: 10000, currency: "NGN", label: "Popular" },
  { id: "ng_600", credits: 600, amount: 20000, currency: "NGN", label: "Growth" },
  { id: "ng_1400", credits: 1400, amount: 40000, currency: "NGN", label: "Power" },
] as const;

export const INTERNATIONAL_CREDIT_PACKS = [
  { id: "intl_100", credits: 100, amount: 15, currency: "USD", label: "Starter" },
  { id: "intl_250", credits: 250, amount: 30, currency: "USD", label: "Popular" },
  { id: "intl_600", credits: 600, amount: 55, currency: "USD", label: "Growth" },
  { id: "intl_1400", credits: 1400, amount: 100, currency: "USD", label: "Power" },
] as const;

export function getCreditPacks(country = "NG") { return country.toUpperCase() === "NG" ? CREDIT_PACKS : INTERNATIONAL_CREDIT_PACKS; }

export async function getCreditBalance(userId: string) {
  const { data, error } = await db.from("credit_wallets").select("balance,lifetime_earned,lifetime_spent").eq("user_id", userId).maybeSingle();
  throwDb(error);
  if (!data) { const { data: created, error: createError } = await db.from("credit_wallets").insert({ user_id: userId, balance: 100, lifetime_earned: 100 }); throwDb(createError); return { balance: 100, lifetimeEarned: 100, lifetimeSpent: 0 }; }
  return { balance: Number(data.balance), lifetimeEarned: Number(data.lifetime_earned), lifetimeSpent: Number(data.lifetime_spent) };
}

export async function spendCredits(userId: string, amount: number, feature: string, referenceId?: string) {
  const { rpc } = await import("./db");
  const result = await rpc<any>("spend_credits", { p_user_id: userId, p_amount: amount, p_feature: feature, p_reference_id: referenceId ?? null });
  throwDb(result.error);
  return { balance: Number(result.data?.balance ?? 0), amount };
}

export async function addCredits(userId: string, amount: number, type = "purchase", feature?: string, referenceId?: string, metadata?: Record<string, unknown>) {
  const { rpc } = await import("./db");
  const result = await rpc<any>("add_credits", { p_user_id: userId, p_amount: amount, p_type: type, p_feature: feature ?? null, p_reference_id: referenceId ?? null, p_metadata: metadata ?? {} });
  throwDb(result.error);
  return { balance: Number(result.data?.balance ?? 0), amount };
}

export async function getAffiliateByCode(code: string) {
  const { data, error } = await db.from("affiliates").select("*").eq("code", code.toUpperCase()).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}

export async function getAffiliateByUser(userId: string) {
  const { data, error } = await db.from("affiliates").select("*").eq("user_id", userId).maybeSingle();
  throwDb(error);
  return data ?? undefined;
}

export async function createAffiliate(userId: string, displayName: string) {
  const existing = await getAffiliateByUser(userId);
  if (existing) return existing;
  const base = displayName.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "PARTNER";
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = attempt === 0 ? "" : String(1000 + Math.floor(Math.random() * 9000));
    const code = `RESU${base}`.slice(0, 10) + suffix;
    const existingCode = await getAffiliateByCode(code);
    if (existingCode) continue;
    const { error } = await db.from("affiliates").insert({ id: newId("aff"), user_id: userId, code, display_name: displayName, status: "active", commission_rate: 0.40 });
    if (!error) return getAffiliateByUser(userId);
    if (!/duplicate|unique/i.test(error.message || "")) throwDb(error);
  }
  throw new Error("Could not generate a unique affiliate referral code");
}

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
  const available = (data ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
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
