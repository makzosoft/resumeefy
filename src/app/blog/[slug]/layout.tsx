import type { Metadata } from "next";
import { getBlogPostBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getBlogPostBySlug(slug).catch(() => null)) as { title?: string; excerpt?: string; seo_title?: string; seo_description?: string } | null;
  if (!post) return {};
  const title = post.seo_title || post.title || "Resumeefy blog";
  const description = post.seo_description || post.excerpt || "Practical career advice from Resumeefy.";
  return { title, description, alternates: { canonical: `/blog/${slug}` }, openGraph: { type: "article", title, description, siteName: "Resumeefy", url: `/blog/${slug}` }, twitter: { card: "summary_large_image", title, description } };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) { return children; }
