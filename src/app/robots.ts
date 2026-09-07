import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://resumeefy.com";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/shop", "/login", "/signup"] }], sitemap: `${base}/sitemap.xml` };
}
