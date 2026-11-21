import { ImageResponse } from "next/og";
import { MARK_OG, MARK_OG_SIZE } from "@/lib/assets";

export const alt = "Resumeefy. Better CV. Bigger Opportunities.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chip = { display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 24px", borderRadius: 999, background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: 24, fontWeight: 700, whiteSpace: "nowrap" } as const;

// The default preview card shown when any Resumeefy link is shared.
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg,#0A2FCC 0%,#061c85 100%)", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", right: -70, top: -70, width: 230, height: 230, borderRadius: 999, background: "#FFD700", display: "flex" }} />
        <div style={{ position: "absolute", left: -120, bottom: -200, width: 460, height: 460, borderRadius: 999, background: "rgba(0,180,252,0.25)", display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 800 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", width: 92, height: 92, borderRadius: 24, background: "#fff", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MARK_OG} width={Math.round(MARK_OG_SIZE.width * 0.34)} height={Math.round(MARK_OG_SIZE.height * 0.34)} alt="" />
            </div>
            <div style={{ display: "flex", marginLeft: 22, color: "#fff", fontSize: 44, fontWeight: 800 }}>Resumeefy</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#fff", fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Your CV gets one look.</div>
            <div style={{ display: "flex", color: "#FFD700", fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginTop: 4 }}>Make it count.</div>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.86)", fontSize: 28, marginTop: 22 }}>Score your resume. Ace the interview.</div>
          </div>

          <div style={{ display: "flex" }}>
            <div style={chip}>Resume Analyzer</div>
            <div style={{ ...chip, marginLeft: 12 }}>Mock Interviews</div>
            <div style={{ ...chip, marginLeft: 12 }}>Aptitude Tests</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 70, top: 120, width: 330, padding: 28, borderRadius: 28, background: "#fff", transform: "rotate(4deg)", boxShadow: "0 30px 60px rgba(0,8,40,0.5)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", color: "#5d6b85", fontSize: 22, fontWeight: 700 }}>Resume score</div>
            <div style={{ display: "flex", color: "#000B1D", fontSize: 78, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>92</div>
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 99, background: "#e6ecf8", marginTop: 14 }}>
            <div style={{ display: "flex", width: "92%", height: 14, borderRadius: 99, background: "linear-gradient(90deg,#e64d63,#FFD700,#12a77b)" }} />
          </div>
          {["Grew monthly sales 34%", "Led 6 people, 12 projects", "Presented to 40+ leaders"].map((t) => (
            <div key={t} style={{ display: "flex", marginTop: 18, padding: "10px 12px", borderRadius: 12, background: "#FFF3A6", color: "#000B1D", fontSize: 21, fontWeight: 700 }}>{t}</div>
          ))}
          <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 22, padding: "10px 20px", borderRadius: 999, background: "#000B1D", color: "#fff", fontSize: 22, fontWeight: 700 }}>ATS ready</div>
        </div>
      </div>
    ),
    size
  );
}
