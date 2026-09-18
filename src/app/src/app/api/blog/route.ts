export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { generateBlog } from "@/lib/gemini";
import { getBlogPostBySlug, getBlogPosts, saveBlogPost, trackBlogEvent } from "@/lib/data";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 90) +
    "-" +
    Date.now().toString(36)
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function googleTrends(): Promise<string[]> {
  try {
    const r = await fetch("https://trends.google.com/trending/rss?geo=NG", { cache: "no-store" });
    const t = await r.text();
    return [...t.matchAll(/<ht:news_item_title>(.*?)<\/ht:news_item_title>/g)]
      .slice(0, 20)
      .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, ""));
  } catch (e) {
    console.warn("[blog:trends] Google Trends fetch failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

async function tiktokTrends(): Promise<string[]> {
  try {
    const r = await fetch("https://www.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en", {
      headers: { "user-agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const t = await r.text();
    // Note: this page is largely client-rendered, so this regex frequently
    // finds nothing against the static HTML — that's expected, not a sign
    // something else is broken. Treat TikTok as a bonus signal, not a
    // dependable one.
    const hits = [...t.matchAll(/(?:hashtag|challenge)[^\n]{0,160}?([A-Za-z][A-Za-z0-9_ ]{2,40})/gi)]
      .slice(0, 20)
      .map((m) => m[1].trim());
    return [...new Set(hits)];
  } catch (e) {
    console.warn("[blog:trends] TikTok fetch failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

const fallback = [
  "how to tailor a resume to a job description",
  "best interview answers for career changers",
  "skills employers want in entry level roles",
  "how to build a portfolio with no experience",
  "how to prepare for a remote interview",
  "salary negotiation for first job",
  "how to explain a career gap",
  "how to make a resume ATS friendly",
];

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const post = await getBlogPostBySlug(slug);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  }
  return NextResponse.json({ posts: await getBlogPosts(30) });
}

async function handleAutopublish(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const cron = process.env.CRON_SECRET;
  if (!cron || !timingSafeEqual(auth, `Bearer ${cron}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [google, tiktok] = await Promise.all([googleTrends(), tiktokTrends()]);
  const signals = [...google.map((x) => `Google trend: ${x}`), ...tiktok.map((x) => `TikTok trend: ${x}`)];
  if (signals.length === 0) {
    console.warn("[blog:autopublish] no live trend signals — using the static fallback topic pool");
  }

  const existingPosts = await getBlogPosts(100);
  const existingTopics = existingPosts.map((p: any) => ({
    title: p.title,
    keyword: p.primary_keyword,
    slug: p.slug,
  }));

  const generated = await generateBlog({
    trendSignals: (signals.length ? signals : fallback).slice(0, 20),
    existingTopics,
    brand: "Resumeefy",
    audience: "job seekers in Nigeria and globally",
    serviceCatalog: ["resume_builder", "resume_analyzer", "interview", "assessment", "courses", "job_match", "desktop_sim"],
    marketingRequirement:
      "Every published article must softly promote exactly one relevant Resumeefy service. Mention the service naturally in the body where it solves the reader's problem, then end with a gentle next step. Never use hype, fake urgency, aggressive sales language or irrelevant promotion.",
  });

  const serviceMap: Record<string, string> = {
    resume_builder: "resume_builder",
    resume_analyzer: "resume_analyzer",
    interview: "interview",
    assessment: "assessment",
    courses: "courses",
    job_match: "job_match",
    desktop_sim: "desktop_sim",
  };
  if (!serviceMap[generated.recommendedService]) generated.recommendedService = "assessment";
  if (!generated.softCta?.trim()) {
    generated.softCta =
      "If you want to practise this before your next application, Resumeefy can help you turn the advice into a practical readiness session.";
  }

  const wordCount = generated.content.trim().split(/\s+/).filter(Boolean).length;
  const normalizedTitle = generated.title.toLowerCase();
  const duplicate = existingPosts.some(
    (p: any) =>
      p.title.toLowerCase() === normalizedTitle ||
      (generated.primaryKeyword && p.primary_keyword && p.primary_keyword.toLowerCase() === generated.primaryKeyword.toLowerCase())
  );
  if (duplicate || wordCount < 650) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: duplicate ? "duplicate_topic" : "thin_content" },
      { status: 422 }
    );
  }

  const slug = generated.slug || slugify(generated.title);
  const blogId = await saveBlogPost({
    slug,
    title: generated.title,
    excerpt: generated.excerpt,
    content: generated.content,
    topic: generated.topic,
    source_signals: { google, tiktok, generatedAt: new Date().toISOString() },
    marketing: { recommendedService: generated.recommendedService, softCta: generated.softCta },
    seo_title: generated.seoTitle,
    seo_description: generated.seoDescription,
    primary_keyword: generated.primaryKeyword,
    search_intent: generated.searchIntent,
    word_count: wordCount,
    cover_type: generated.coverType,
  });

  await trackBlogEvent(blogId, "autopublished", null, {
    primaryKeyword: generated.primaryKeyword,
    searchIntent: generated.searchIntent,
    recommendedService: generated.recommendedService,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    title: generated.title,
    slug,
    primaryKeyword: generated.primaryKeyword,
    recommendedService: generated.recommendedService,
  });
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "event";

  if (action === "autopublish") {
    return handleAutopublish(req);
  }

  // Public event-tracking branch (blog view/click events) — unauthenticated,
  // so it gets the same lightweight rate limiting as /api/track.
  const limited = rateLimit(`blog-event:${clientKey(req)}`, 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfterMs);

  const session = await getCurrentSession();
  const body = await req.json().catch(() => null);
  if (!body?.blogId || !body?.event) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  await trackBlogEvent(String(body.blogId), String(body.event), session?.sub ?? null, body.metadata || {});
  return NextResponse.json({ ok: true });
}
