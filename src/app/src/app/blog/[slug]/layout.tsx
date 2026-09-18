import type { Metadata } from "next";
import { getBlogPostBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug).catch(() => undefined);
  if (!post) return { title: "Article not found | Resumeefy" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    keywords: post.primary_keyword ? [post.primary_keyword] : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.seo_title || post.title, description: post.seo_description || post.excerpt, type: "article", publishedTime: post.published_at, url: `/blog/${post.slug}` },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) { return children; }
