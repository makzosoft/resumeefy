export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://resumeefy.com";
  const staticRoutes = ["/", "/resume-builder", "/resume-analyzer", "/assessment", "/courses", "/blog", "/invite", "/refer"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
  const posts = await getBlogPosts(100).catch(() => []);
  return [...staticRoutes, ...posts.map((post: any) => ({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.published_at), changeFrequency: "monthly" as const, priority: 0.8 }))];
}
