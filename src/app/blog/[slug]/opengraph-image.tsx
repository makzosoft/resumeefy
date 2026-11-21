import { ImageResponse } from "next/og";
import { MARK_OG, MARK_OG_SIZE } from "@/lib/assets";
import { getBlogPostBySlug } from "@/lib/data";

export const alt = "Resumeefy career blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Each article gets its own preview card with its title.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug).catch(() => null);
  const title = String((post as { title?: string } | null)?.title || "Career advice that gets you hired").slice(0, 110);
  const topic = String((post as { topic?: string } | null)?.topic || "Career blog").slice(0, 30);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "linear-gradient(135deg,#0A2FCC 0%,#061c85 100%)", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", right: -120, top: -140, width: 520, height: 520, borderRadius: 999, background: "rgba(255,215,0,0.26)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 80, height: 80, borderRadius: 22, background: "#fff", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK_OG} width={Math.round(MARK_OG_SIZE.width * 0.3)} height={Math.round(MARK_OG_SIZE.height * 0.3)} alt="" />
          </div>
          <div style={{ display: "flex", marginLeft: 20, color: "#fff", fontSize: 40, fontWeight: 800 }}>Resumeefy</div>
          <div style={{ display: "flex", marginLeft: 24, padding: "8px 20px", borderRadius: 999, background: "#FFD700", color: "#000B1D", fontSize: 24, fontWeight: 800 }}>{topic}</div>
        </div>
        <div style={{ display: "flex", color: "#fff", fontSize: title.length > 70 ? 60 : 72, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", color: "rgba(255,255,255,0.85)", fontSize: 28 }}>Better CV. Bigger Opportunities.</div>
      </div>
    ),
    size
  );
}
