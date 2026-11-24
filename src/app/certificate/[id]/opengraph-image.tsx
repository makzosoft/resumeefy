import { ImageResponse } from "next/og";
import { MARK_OG, MARK_OG_SIZE } from "@/lib/assets";
import { getCertificateById } from "@/lib/certificates";

export const alt = "Resumeefy certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCertificateById(id).catch(() => null);
  const name = (c?.name || "A Resumeefy learner").slice(0, 40);
  const course = (c?.course || "Resumeefy course").slice(0, 80);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg,#0A2FCC 0%,#061c85 100%)", padding: 36, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", background: "#fff", borderRadius: 28, border: "6px solid #FFD700", padding: "44px 56px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK_OG} width={Math.round(MARK_OG_SIZE.width * 0.3)} height={Math.round(MARK_OG_SIZE.height * 0.3)} alt="" />
            <div style={{ display: "flex", marginLeft: 16, color: "#0A2FCC", fontSize: 40, fontWeight: 800 }}>Resumeefy</div>
            <div style={{ display: "flex", marginLeft: "auto", padding: "8px 20px", borderRadius: 999, background: "#d7f5ea", color: "#0a7a58", fontSize: 24, fontWeight: 800 }}>Verified certificate</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#5d6b85", fontSize: 28 }}>This certifies that</div>
            <div style={{ display: "flex", color: "#0A2FCC", fontSize: 76, fontWeight: 800, letterSpacing: -2, marginTop: 6 }}>{name}</div>
            <div style={{ display: "flex", color: "#5d6b85", fontSize: 28, marginTop: 14 }}>has successfully completed</div>
            <div style={{ display: "flex", color: "#000B1D", fontSize: course.length > 50 ? 40 : 52, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>{course}</div>
          </div>
          <div style={{ display: "flex", color: "#5d6b85", fontSize: 24 }}>Better CV. Bigger Opportunities. Earn yours free at Resumeefy.</div>
        </div>
      </div>
    ),
    size
  );
}
