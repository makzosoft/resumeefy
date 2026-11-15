/**
 * Lesson illustrations — custom diagrams built for specific concepts taught
 * in the course, not stock imagery. Each one exists to make a single idea
 * from the lesson text click faster visually. Uses the app's existing
 * brand palette so these read as part of Resumeefy, not bolted-on clip art.
 */
import type { ReactNode } from "react";

const INK = "#0B1C3D";
const BLUE = "#0A2FCC";
const BLUE_SOFT = "#E7EDFF";
const MINT = "#00A9D9";
const CORAL = "#E64D63";
const AMBER = "#FFD700";
const LINE = "#DBE3F0";

function Frame({ children, viewBox = "0 0 400 190" }: { children: ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} width="100%" role="img" aria-hidden="true" style={{ display: "block" }}>
      {children}
    </svg>
  );
}

/** Lesson 1: the four-module course roadmap, as a connected sequence. */
export function CourseRoadmapIllustration() {
  const steps = [
    { label: "Foundations", sub: "You are here" },
    { label: "Building", sub: "The resume itself" },
    { label: "Tailoring", sub: "Adapting it" },
    { label: "Supporting Docs", sub: "Letter, LinkedIn, refs" },
    { label: "Job Search", sub: "Everything around it" },
  ];
  const rowH = 44;
  const gap = 14;
  return (
    <Frame viewBox="0 0 400 300">
      {steps.map((s, i) => {
        const y = 6 + i * (rowH + gap);
        return (
          <g key={s.label}>
            {i > 0 && (
              <path
                d={`M 200 ${y - gap + 2} L 200 ${y - 3}`}
                stroke={LINE}
                strokeWidth="2.5"
                markerEnd="url(#arrowDown)"
              />
            )}
            <rect
              x="10"
              y={y}
              width="380"
              height={rowH}
              rx="10"
              fill={i === 0 ? BLUE : "#fff"}
              stroke={i === 0 ? BLUE : LINE}
              strokeWidth="1.6"
            />
            <text x="26" y={y + 27} fontSize="14" fontWeight="800" fill={i === 0 ? "#fff" : INK}>
              {i + 1}. {s.label}
            </text>
            <text x="374" y={y + 27} textAnchor="end" fontSize="11.5" fill={i === 0 ? "#DCE6FF" : "#7E8CA6"}>
              {s.sub}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Lesson 2: the six-second scan — a document with a fast sweeping glance. */
export function SixSecondScanIllustration() {
  return (
    <Frame viewBox="0 0 400 170">
      <rect x="130" y="14" width="140" height="150" rx="8" fill="#fff" stroke={LINE} strokeWidth="2" />
      {[30, 46, 62].map((yy) => (
        <rect key={yy} x="146" y={yy} width={yy === 30 ? 90 : 108} height="7" rx="3.5" fill={LINE} />
      ))}
      <rect x="146" y="84" width="108" height="5" rx="2.5" fill="#EEF2FA" />
      <rect x="146" y="96" width="98" height="5" rx="2.5" fill="#EEF2FA" />
      <rect x="146" y="108" width="104" height="5" rx="2.5" fill="#EEF2FA" />
      <rect x="146" y="126" width="108" height="5" rx="2.5" fill="#EEF2FA" />
      <rect x="146" y="138" width="90" height="5" rx="2.5" fill="#EEF2FA" />
      {/* sweeping spotlight */}
      <ellipse cx="200" cy="45" rx="75" ry="26" fill={AMBER} opacity="0.22" />
      <ellipse cx="200" cy="45" rx="75" ry="26" fill="none" stroke={AMBER} strokeWidth="1.5" strokeDasharray="4 3" />
      {/* clock */}
      <circle cx="330" cy="45" r="32" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="2" />
      <path d="M330 28 L330 45 L344 52" stroke={BLUE} strokeWidth="3" strokeLinecap="round" fill="none" />
      <text x="330" y="92" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>
        ~6 seconds
      </text>
      <text x="330" y="107" textAnchor="middle" fontSize="9.5" fill="#7E8CA6">
        first impression
      </text>
    </Frame>
  );
}

/** Lesson 2: two audiences — one resume, read by a human and by software. */
export function TwoAudiencesIllustration() {
  return (
    <Frame viewBox="0 0 400 170">
      <rect x="164" y="60" width="72" height="90" rx="6" fill="#fff" stroke={LINE} strokeWidth="2" />
      {[76, 88, 100, 112, 124].map((yy) => (
        <rect key={yy} x="174" y={yy} width={52} height="4.5" rx="2.2" fill="#EEF2FA" />
      ))}
      <path d="M 236 90 L 300 55" stroke={MINT} strokeWidth="2.2" fill="none" markerEnd="url(#arrowMint)" />
      <path d="M 236 120 L 300 145" stroke={BLUE} strokeWidth="2.2" fill="none" markerEnd="url(#arrowBlue)" />
      {/* human reader */}
      <circle cx="330" cy="45" r="22" fill="#fff" stroke={MINT} strokeWidth="2" />
      <circle cx="330" cy="38" r="7" fill={MINT} opacity="0.85" />
      <path d="M318 52 q12 -10 24 0" stroke={MINT} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x="330" y="82" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>
        Recruiter
      </text>
      {/* ATS software */}
      <rect x="308" y="120" width="44" height="34" rx="5" fill="#fff" stroke={BLUE} strokeWidth="2" />
      <rect x="315" y="128" width="30" height="4" rx="2" fill={BLUE} opacity="0.8" />
      <rect x="315" y="136" width="22" height="4" rx="2" fill={BLUE} opacity="0.5" />
      <rect x="315" y="144" width="26" height="4" rx="2" fill={BLUE} opacity="0.5" />
      <text x="330" y="166" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>
        ATS software
      </text>
      <defs>
        <marker id="arrowMint" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={MINT} />
        </marker>
        <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={BLUE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Lesson 3: how ATS parsing turns a document into structured fields. */
export function AtsParsingIllustration() {
  const fields = ["Name", "Title", "Dates", "Skills"];
  return (
    <Frame viewBox="0 0 400 170">
      <rect x="20" y="30" width="110" height="130" rx="7" fill="#fff" stroke={LINE} strokeWidth="2" />
      {[46, 62, 78, 94, 110, 126, 142].map((yy, i) => (
        <rect key={yy} x="34" y={yy} width={i % 3 === 0 ? 60 : 82} height="6" rx="3" fill="#EEF2FA" />
      ))}
      <path d="M 138 95 L 190 95" stroke={LINE} strokeWidth="2.5" fill="none" markerEnd="url(#arrowParse)" />
      <text x="164" y="86" textAnchor="middle" fontSize="9" fill="#7E8CA6">
        parses
      </text>
      {fields.map((f, i) => (
        <g key={f}>
          <rect x="206" y={32 + i * 34} width="174" height="26" rx="6" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.3" />
          <text x="220" y={32 + i * 34 + 17} fontSize="11" fontWeight="700" fill={BLUE}>
            {f}
          </text>
        </g>
      ))}
      <defs>
        <marker id="arrowParse" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Lesson 3: single-column parses cleanly; multi-column can scramble. */
export function FormattingComparisonIllustration() {
  return (
    <Frame viewBox="0 0 400 170">
      <g>
        <rect x="30" y="20" width="140" height="132" rx="7" fill="#fff" stroke={MINT} strokeWidth="2" />
        {[38, 54, 70, 86, 102, 118, 134].map((yy) => (
          <rect key={yy} x="44" y={yy} width="112" height="6" rx="3" fill="#EEF2FA" />
        ))}
        <circle cx="100" cy="164" r="9" fill={MINT} />
        <path d="M96 164 l3 3 l6 -7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="100" y="10" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>
          Single column
        </text>
      </g>
      <g>
        <rect x="230" y="20" width="140" height="132" rx="7" fill="#fff" stroke={CORAL} strokeWidth="2" />
        {[38, 54, 70, 86, 102, 118, 134].map((yy) => (
          <g key={yy}>
            <rect x="242" y={yy} width="50" height="6" rx="3" fill="#FBE3E7" />
            <rect x="300" y={yy} width="58" height="6" rx="3" fill="#FBE3E7" />
          </g>
        ))}
        <circle cx="300" cy="164" r="9" fill={CORAL} />
        <path d="M295 159 l10 10 M305 159 l-10 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <text x="300" y="10" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>
          Two columns
        </text>
      </g>
    </Frame>
  );
}

/** Lesson 4: three resume formats, shown as distinct internal layouts. */
export function ThreeFormatsIllustration() {
  const cols = [
    { x: 15, label: "Chronological", rows: [1, 1, 1, 1, 1, 1] },
    { x: 145, label: "Functional", rows: [2, 0.6, 0.6, 2, 0.6, 0.6] },
    { x: 275, label: "Combination", rows: [1.6, 0.6, 1, 1, 1, 1] },
  ];
  return (
    <Frame viewBox="0 0 400 175">
      {cols.map((c) => (
        <g key={c.label}>
          <rect x={c.x} y="14" width="110" height="130" rx="7" fill="#fff" stroke={LINE} strokeWidth="2" />
          {(() => {
            let y = 26;
            return c.rows.map((h, i) => {
              const barH = 8 * h;
              const rect = (
                <rect
                  key={i}
                  x={c.x + 12}
                  y={y}
                  width="86"
                  height={barH}
                  rx="3"
                  fill={h > 1.3 ? BLUE_SOFT : "#EEF2FA"}
                  stroke={h > 1.3 ? BLUE : "none"}
                  strokeWidth={h > 1.3 ? 1 : 0}
                />
              );
              y += barH + 6;
              return rect;
            });
          })()}
          <text x={c.x + 55} y="160" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>
            {c.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** Lesson 5: the halo effect — one strong signal coloring the whole page. */
export function HaloEffectIllustration() {
  return (
    <Frame viewBox="0 0 400 170">
      <rect x="140" y="15" width="120" height="140" rx="8" fill="#fff" stroke={LINE} strokeWidth="2" />
      <ellipse cx="200" cy="42" rx="90" ry="46" fill={AMBER} opacity="0.18" />
      <rect x="154" y="30" width="92" height="14" rx="4" fill={AMBER} opacity="0.35" stroke={AMBER} strokeWidth="1.3" />
      <rect x="154" y="52" width="92" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="64" width="80" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="76" width="88" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="94" width="92" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="106" width="70" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="118" width="84" height="6" rx="3" fill="#EEF2FA" />
      <rect x="154" y="136" width="60" height="6" rx="3" fill="#EEF2FA" />
      <text x="200" y="10" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7E8CA6">
        one strong first line colors everything after it
      </text>
    </Frame>
  );
}

/** Looked up by the string key a lesson section references in its `illustration` field. */
/** Module 2, Lesson 1: anatomy of the top-of-resume header block. */
export function ResumeHeaderAnatomyIllustration() {
  const rows = [
    { y: 14, h: 26, fill: INK, label: "Name", sub: "full name, however you go professionally" },
    { y: 48, h: 20, fill: BLUE, label: "Headline", sub: "one line, states what you are" },
    { y: 76, h: 14, fill: "#C9D3E8", label: "Contact", sub: "phone, email, city, LinkedIn" },
    { y: 98, h: 40, fill: "#EEF2FA", label: "Summary", sub: "optional \u2014 only if it earns its place" },
  ];
  return (
    <Frame viewBox="0 0 400 200">
      <rect x="16" y="10" width="150" height="150" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {rows.map((r) => (
        <rect key={r.label} x="28" y={r.y} width={r.label === "Contact" ? 100 : 126} height={r.h} rx="3" fill={r.fill} opacity={r.fill === "#EEF2FA" ? 1 : r.label === "Contact" ? 1 : 0.92} />
      ))}
      {rows.map((r, i) => {
        const rowY = 16 + i * 44;
        return (
          <g key={r.label}>
            <rect x="184" y={rowY - 9} width="10" height="10" rx="2" fill={r.fill === "#EEF2FA" ? "#C9D3E8" : r.fill} />
            <text x="202" y={rowY} fontSize="13" fontWeight="800" fill={INK}>
              {r.label}
            </text>
            <text x="184" y={rowY + 18} fontSize="10" fill="#7E8CA6">
              {r.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 2, Lesson 2: anatomy of a single experience entry. */
export function JobEntryAnatomyIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <rect x="10" y="10" width="380" height="38" rx="8" fill="#fff" stroke={BLUE} strokeWidth="1.6" />
      <text x="24" y="34" fontSize="13" fontWeight="800" fill={INK}>
        {"Title \u2014 Company"}
      </text>
      <text x="376" y="34" textAnchor="end" fontSize="11" fill="#7E8CA6">
        Dates
      </text>
      <text x="10" y="62" fontSize="10.5" fill="#7E8CA6">
        {"Title, company, and dates \u2014 same order on every entry"}
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx="18" cy={82 + i * 24} r="3" fill={i === 0 ? BLUE : "#C9D3E8"} />
          <rect x="30" y={78 + i * 24} width={i === 0 ? 340 : 300 - i * 18} height="8" rx="4" fill={i === 0 ? BLUE_SOFT : "#EEF2FA"} stroke={i === 0 ? BLUE : "none"} strokeWidth="1" />
        </g>
      ))}
      <text x="10" y="182" fontSize="10.5" fill="#7E8CA6">
        {"Bullets \u2014 strongest and most relevant listed first"}
      </text>
    </Frame>
  );
}

/** Module 2, Lesson 3 (bullets): a plain duty vs. a quantified accomplishment. */
export function DutyVsImpactIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7E8CA6">
        Duty
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        Accomplishment
      </text>
      <rect x="20" y="28" width="170" height="120" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      <rect x="210" y="28" width="170" height="120" rx="10" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="36" y={48 + i * 24} width={140 - i * 20} height="9" rx="4" fill="#EEF2FA" />
      ))}
      {[0, 1].map((i) => (
        <rect key={i} x="226" y={48 + i * 24} width={130 - i * 10} height="9" rx="4" fill="#EEF2FA" />
      ))}
      <rect x="226" y="96" width="56" height="16" rx="5" fill={AMBER} opacity="0.85" />
      <text x="254" y="108" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={INK}>
        result
      </text>
      <circle cx="105" cy="166" r="10" fill="none" stroke="#B7C2DA" strokeWidth="2" />
      <text x="105" y="170" textAnchor="middle" fontSize="12" fill="#B7C2DA">
        ?
      </text>
      <circle cx="295" cy="166" r="10" fill={MINT} />
      <path d="M290,166 L294,170 L301,161" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

/** Module 2, Lesson 3 (bullets): the bare fact, pushed one step further to its outcome. */
export function SoWhatTestIllustration() {
  return (
    <Frame viewBox="0 0 400 140">
      <text x="90" y="18" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#7E8CA6">
        The fact
      </text>
      <rect x="20" y="26" width="140" height="40" rx="8" fill="#EEF2FA" stroke={LINE} strokeWidth="1.4" />
      <path d="M 175 46 L 225 46" stroke={LINE} strokeWidth="2.5" markerEnd="url(#swArrow)" />
      <text x="200" y="36" textAnchor="middle" fontSize="10" fontWeight="700" fill={CORAL}>
        so what?
      </text>
      <text x="310" y="18" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={BLUE}>
        The result
      </text>
      <rect x="240" y="26" width="140" height="40" rx="8" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.6" />
      <defs>
        <marker id="swArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Module 2, Lesson 4: five kinds of numbers that aren't sales or revenue. */
export function FiveNumberTypesIllustration() {
  const items = [
    { label: "Scale" },
    { label: "Frequency" },
    { label: "Time" },
    { label: "Money" },
    { label: "Compare" },
  ];
  return (
    <Frame viewBox="0 0 400 150">
      {items.map((it, i) => {
        const cx = 42 + i * 80;
        return (
          <g key={it.label}>
            <circle cx={cx} cy="42" r="26" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.4" />
            {it.label === "Scale" && (
              <g>
                <circle cx={cx - 7} cy="46" r="5" fill={BLUE} />
                <circle cx={cx + 7} cy="46" r="5" fill={BLUE} />
                <circle cx={cx} cy="36" r="5" fill={BLUE} />
              </g>
            )}
            {it.label === "Frequency" && [-10, 0, 10].map((dx) => <rect key={dx} x={cx + dx - 2} y="32" width="4" height="20" rx="2" fill={BLUE} />)}
            {it.label === "Time" && (
              <g>
                <circle cx={cx} cy="42" r="12" fill="none" stroke={BLUE} strokeWidth="2" />
                <path d={`M ${cx} ${42} L ${cx} 34 M ${cx} ${42} L ${cx + 7} 42`} stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
              </g>
            )}
            {it.label === "Money" && (
              <g>
                <circle cx={cx} cy="42" r="12" fill="none" stroke={BLUE} strokeWidth="2" />
                <path d={`M ${cx - 6} 42 L ${cx + 6} 42`} stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
              </g>
            )}
            {it.label === "Compare" && (
              <g>
                <rect x={cx - 10} y="38" width="6" height="16" rx="2" fill={BLUE} />
                <rect x={cx + 4} y="30" width="6" height="24" rx="2" fill={BLUE} />
              </g>
            )}
            <text x={cx} y="78" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
              {it.label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 2, Lesson 7: specific, verifiable hard skills vs. vague soft-skill claims. */
export function HardVsSoftSkillsIllustration() {
  return (
    <Frame viewBox="0 0 400 170">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        Hard skills
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7E8CA6">
        Soft skills
      </text>
      <rect x="20" y="28" width="170" height="110" rx="10" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      <rect x="210" y="28" width="170" height="110" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {[44, 30, 52].map((w, i) => (
        <rect key={i} x={38 + (i % 2) * (w + 12)} y={48 + Math.floor(i / 2) * 30} width={w} height="18" rx="9" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.2" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x="226" y={48 + i * 22} width={130 - i * 12} height="9" rx="4" fill="#EEF2FA" />
      ))}
      <circle cx="105" cy="126" r="10" fill={MINT} />
      <path d="M100,126 L104,130 L111,121" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="295" cy="126" r="10" fill="none" stroke="#B7C2DA" strokeWidth="2" />
      <text x="295" y="130" textAnchor="middle" fontSize="12" fill="#B7C2DA">
        ?
      </text>
    </Frame>
  );
}

/** Module 2, Lesson 8: type-scale hierarchy, name down to body text. */
export function TypeHierarchyIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="20" y="42" fontSize="26" fontWeight="800" fill={INK}>
        Name
      </text>
      <text x="20" y="80" fontSize="18" fontWeight="800" fill={BLUE}>
        Section Heading
      </text>
      <text x="20" y="112" fontSize="14" fontWeight="700" fill={INK}>
        Job Title
      </text>
      <text x="20" y="140" fontSize="11" fontWeight="700" fill="#7E8CA6">
        Body text
      </text>
      {[0, 1, 2].map((i) => (
        <rect key={i} x="20" y={150 + i * 14} width={340 - i * 40} height="7" rx="3" fill="#EEF2FA" />
      ))}
    </Frame>
  );
}

/** Module 3, Lesson 1: which lines in a posting actually signal priority. */
export function PostingPrioritySignalsIllustration() {
  const rows = [
    { w: 340, tag: null },
    { w: 300, tag: "mentioned 3 times", highlight: true },
    { w: 360, tag: null },
    { w: 280, tag: "listed as required", highlight: true },
    { w: 320, tag: null },
  ];
  return (
    <Frame viewBox="0 0 400 220">
      <text x="20" y="10" fontSize="10.5" fontWeight="800" fill="#7E8CA6">
        From a job posting
      </text>
      {rows.map((r, i) => {
        const y = 22 + i * 40;
        return (
          <g key={i}>
            <rect x="20" y={y} width={r.w} height="26" rx="5" fill={r.highlight ? BLUE_SOFT : "#EEF2FA"} stroke={r.highlight ? BLUE : "none"} strokeWidth="1.4" />
            {r.tag && (
              <text x="20" y={y + 40} fontSize="10" fontWeight="800" fill={BLUE}>
                {r.tag}
              </text>
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 3, Lesson 2: one master resume, trimmed into different tailored versions. */
export function MasterResumeBranchingIllustration() {
  return (
    <Frame viewBox="0 0 400 200">
      <rect x="16" y="35" width="92" height="130" rx="8" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="28" y={50 + i * 14} width={68 - (i % 3) * 8} height="6" rx="3" fill="#C9D3E8" />
      ))}
      <text x="62" y="180" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
        Master
      </text>
      <path d="M 112 70 C 170 70, 170 45, 250 45" fill="none" stroke={LINE} strokeWidth="2.2" markerEnd="url(#mrbArrow)" />
      <path d="M 112 130 C 170 130, 170 155, 250 155" fill="none" stroke={LINE} strokeWidth="2.2" markerEnd="url(#mrbArrow)" />
      <rect x="252" y="15" width="70" height="60" rx="7" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="260" y={27 + i * 13} width={54 - i * 10} height="5" rx="2.5" fill={MINT} opacity="0.8" />
      ))}
      <text x="287" y="88" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={INK}>
        Tailored A
      </text>
      <rect x="252" y="125" width="70" height="60" rx="7" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="260" y={137 + i * 13} width={54 - ((i + 1) % 3) * 10} height="5" rx="2.5" fill={AMBER} opacity="0.85" />
      ))}
      <text x="287" y="198" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={INK}>
        Tailored B
      </text>
      <defs>
        <marker id="mrbArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Module 3, Lesson 4: old-field language translated into new-field language. */
export function SkillTranslationBridgeIllustration() {
  return (
    <Frame viewBox="0 0 400 140">
      <text x="90" y="18" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#7E8CA6">
        Old-field language
      </text>
      <rect x="20" y="26" width="140" height="40" rx="8" fill="#EEF2FA" stroke={LINE} strokeWidth="1.4" />
      <path d="M 175 46 L 225 46" stroke={LINE} strokeWidth="2.5" markerEnd="url(#stbArrow)" />
      <text x="200" y="36" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={MINT}>
        translate
      </text>
      <text x="310" y="18" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={BLUE}>
        New-field language
      </text>
      <rect x="240" y="26" width="140" height="40" rx="8" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.6" />
      <defs>
        <marker id="stbArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Module 3, Lesson 5: how page space shifts when experience is thin. */
export function EntryLevelResumeLayoutIllustration() {
  const blocks = [
    { label: "Education", h: 40, fill: BLUE, sub: "moved above experience" },
    { label: "Projects / Activities", h: 50, fill: MINT, sub: "your strongest evidence right now" },
    { label: "Experience", h: 24, fill: "#C9D3E8", sub: "any paid or internship work you have" },
    { label: "Skills", h: 20, fill: "#EEF2FA", sub: "focused, not padded" },
  ];
  let blockY = 14;
  const blockYs: number[] = [];
  for (const b of blocks) {
    blockYs.push(blockY);
    blockY += b.h + 6;
  }
  return (
    <Frame viewBox="0 0 400 200">
      <rect x="16" y="10" width="150" height="162" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {blocks.map((b, i) => (
        <rect key={b.label} x="26" y={blockYs[i]} width="130" height={b.h} rx="4" fill={b.fill} opacity={b.fill === "#EEF2FA" ? 1 : 0.9} />
      ))}
      {blocks.map((b, i) => {
        const rowY = 24 + i * 44;
        return (
          <g key={b.label}>
            <rect x="184" y={rowY - 9} width="10" height="10" rx="2" fill={b.fill === "#EEF2FA" ? "#C9D3E8" : b.fill} />
            <text x="202" y={rowY} fontSize="12.5" fontWeight="800" fill={INK}>
              {b.label}
            </text>
            <text x="184" y={rowY + 18} fontSize="9.5" fill="#7E8CA6">
              {b.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 4, Lesson 1: what belongs on the resume vs. in the cover letter. */
export function ResumeVsCoverLetterIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
        Resume
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        Cover letter
      </text>
      <rect x="20" y="26" width="170" height="120" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      <rect x="36" y="40" width="80" height="10" rx="3" fill={INK} opacity="0.85" />
      <rect x="36" y="58" width="130" height="7" rx="3" fill="#C9D3E8" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="36" y={78 + i * 14} width={130 - (i % 2) * 20} height="6" rx="3" fill="#EEF2FA" />
      ))}
      <rect x="210" y="26" width="170" height="120" rx="10" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="226" y={42 + i * 16} width={140 - (i % 3) * 30} height="7" rx="3.5" fill={BLUE_SOFT} />
      ))}
      <text x="105" y="166" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        Facts & evidence
      </text>
      <text x="295" y="166" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        Context & narrative
      </text>
    </Frame>
  );
}

/** Module 4, Lesson 3: anatomy of one reference sheet entry. */
export function ReferenceSheetAnatomyIllustration() {
  const rows = [
    { title: "Name \u2014 Title, Company", sub: "Full name, their current title and company" },
    { title: "Direct manager, 2022\u20132024", sub: "Your relationship to them, and when" },
    { title: "email  \u00b7  phone", sub: "How they can actually be reached" },
  ];
  return (
    <Frame viewBox="0 0 400 180">
      {rows.map((r, i) => {
        const y = 10 + i * 56;
        return (
          <g key={i}>
            <rect x="10" y={y} width="380" height="34" rx="8" fill={i === 0 ? BLUE_SOFT : "#fff"} stroke={i === 0 ? BLUE : LINE} strokeWidth="1.6" />
            <text x="24" y={y + 22} fontSize="13" fontWeight="800" fill={INK}>
              {r.title}
            </text>
            <text x="10" y={y + 48} fontSize="10.5" fill="#7E8CA6">
              {r.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 4, Lesson 4: a work sample plus the caption that makes it readable. */
export function PortfolioPieceAnatomyIllustration() {
  const rows = [
    { label: "Goal", fill: BLUE, sub: "what the project set out to do" },
    { label: "Role", fill: MINT, sub: "what you specifically contributed" },
    { label: "Outcome", fill: AMBER, sub: "what happened as a result" },
  ];
  return (
    <Frame viewBox="0 0 400 170">
      <rect x="16" y="14" width="140" height="110" rx="8" fill="#EEF2FA" stroke={LINE} strokeWidth="1.6" />
      <circle cx="56" cy="56" r="12" fill="#C9D3E8" />
      <path d="M 26 112 L 66 72 L 94 96 L 146 56 L 146 114 L 26 114 Z" fill="#C9D3E8" opacity="0.8" />
      {rows.map((r, i) => {
        const rowY = 24 + i * 34;
        return (
          <g key={r.label}>
            <rect x="184" y={rowY - 9} width="10" height="10" rx="2" fill={r.fill} />
            <text x="202" y={rowY} fontSize="12.5" fontWeight="800" fill={INK}>
              {r.label}
            </text>
            <text x="184" y={rowY + 16} fontSize="9.5" fill="#7E8CA6">
              {r.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 5, Lesson 1: relative yield across job search channels. */
export function JobChannelYieldIllustration() {
  const rows = [
    { label: "Referral", w: 320, fill: BLUE },
    { label: "Direct / career page", w: 230, fill: MINT },
    { label: "Recruiter outreach", w: 170, fill: AMBER },
    { label: "Job board (cold)", w: 110, fill: "#C9D3E8" },
  ];
  return (
    <Frame viewBox="0 0 400 180">
      {rows.map((r, i) => {
        const y = 10 + i * 42;
        return (
          <g key={r.label}>
            <text x="20" y={y} fontSize="11.5" fontWeight="800" fill={INK}>
              {r.label}
            </text>
            <rect x="20" y={y + 8} width={r.w} height="14" rx="6" fill={r.fill} opacity="0.85" />
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 5, Lesson 3: anatomy of what belongs in an application tracker. */
export function ApplicationTrackerAnatomyIllustration() {
  const rows = [
    { label: "Company & role", fill: BLUE, sub: "what you applied to" },
    { label: "Date & channel", fill: MINT, sub: "board, referral, or direct" },
    { label: "Status", fill: AMBER, sub: "applied, interviewing, offer..." },
    { label: "Next-action date", fill: "#C9D3E8", sub: "when to follow up" },
  ];
  return (
    <Frame viewBox="0 0 400 200">
      <rect x="16" y="10" width="150" height="162" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {rows.map((r, i) => (
        <rect key={r.label} x="26" y={14 + i * 40} width="130" height="26" rx="4" fill={r.fill} opacity={r.fill === "#C9D3E8" ? 1 : 0.9} />
      ))}
      {rows.map((r, i) => {
        const rowY = 24 + i * 44;
        return (
          <g key={r.label}>
            <rect x="184" y={rowY - 9} width="10" height="10" rx="2" fill={r.fill} />
            <text x="202" y={rowY} fontSize="12.5" fontWeight="800" fill={INK}>
              {r.label}
            </text>
            <text x="184" y={rowY + 16} fontSize="9.5" fill="#7E8CA6">
              {r.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Module 5, Lesson 5: the funnel, narrowing at each stage, where a bottleneck can sit. */
export function JobSearchFunnelBottlenecksIllustration() {
  const stages = [
    { label: "Applications", w: 340 },
    { label: "Responses", w: 260 },
    { label: "Interviews", w: 180 },
    { label: "Offers", w: 110 },
  ];
  const rowH = 40;
  const gap = 14;
  return (
    <Frame viewBox="0 0 400 260">
      {stages.map((s, i) => {
        const y = 6 + i * (rowH + gap);
        const x = (400 - s.w) / 2;
        return (
          <g key={s.label}>
            {i > 0 && <path d={`M 200 ${y - gap + 2} L 200 ${y - 3}`} stroke={LINE} strokeWidth="2.5" markerEnd="url(#jsfArrow)" />}
            <rect x={x} y={y} width={s.w} height={rowH} rx="9" fill={i === 0 ? BLUE : "#fff"} stroke={i === 0 ? BLUE : LINE} strokeWidth="1.6" />
            <text x="200" y={y + 25} textAnchor="middle" fontSize="13" fontWeight="800" fill={i === 0 ? "#fff" : INK}>
              {s.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="jsfArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Module 5, Lesson 7: the three numbers to decide before any salary conversation. */
export function ThreeNumbersIllustration() {
  const points = [
    { label: "Walk-away", x: 70, fill: "#C9D3E8" },
    { label: "Target", x: 200, fill: BLUE },
    { label: "Stretch", x: 330, fill: AMBER },
  ];
  return (
    <Frame viewBox="0 0 400 130">
      <path d="M 50 65 L 350 65" stroke={LINE} strokeWidth="2.5" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy="65" r="11" fill={p.fill} stroke="#fff" strokeWidth="2" />
          <text x={p.x} y="95" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
            {p.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** Public Speaking course, Lesson 1: the 6-module roadmap. */
export function SpeakingCourseRoadmapIllustration() {
  const steps = [
    { label: "Foundations", sub: "You are here" },
    { label: "Structuring a Talk", sub: "Build what you'll say" },
    { label: "Delivery", sub: "Voice, body, nerves" },
    { label: "Visuals & Data", sub: "Slides done right" },
    { label: "Formats", sub: "Meetings, Q&A, panels" },
    { label: "Advanced", sub: "Tough questions, humor" },
  ];
  const rowH = 44;
  const gap = 14;
  return (
    <Frame viewBox="0 0 400 360">
      {steps.map((s, i) => {
        const y = 6 + i * (rowH + gap);
        return (
          <g key={s.label}>
            {i > 0 && (
              <path
                d={`M 200 ${y - gap + 2} L 200 ${y - 3}`}
                stroke={LINE}
                strokeWidth="2.5"
                markerEnd="url(#spArrow)"
              />
            )}
            <rect
              x="10"
              y={y}
              width="380"
              height={rowH}
              rx="10"
              fill={i === 0 ? BLUE : "#fff"}
              stroke={i === 0 ? BLUE : LINE}
              strokeWidth="1.6"
            />
            <text x="26" y={y + 27} fontSize="13" fontWeight="800" fill={i === 0 ? "#fff" : INK}>
              {i + 1}. {s.label}
            </text>
            <text x="374" y={y + 27} textAnchor="end" fontSize="10.5" fill={i === 0 ? "#DCE6FF" : "#7E8CA6"}>
              {s.sub}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="spArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Public Speaking course, Lesson 3: your priorities vs. the audience's actual needs. */
export function SayVsHearIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7E8CA6">
        Your priorities
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        Their needs
      </text>
      <rect x="20" y="26" width="170" height="120" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="36" y={44 + i * 20} width={140 - (i % 2) * 24} height="8" rx="4" fill="#EEF2FA" />
      ))}
      <rect x="210" y="26" width="170" height="120" rx="10" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="226" y={44 + i * 20} width={140 - (i % 2) * 24} height="8" rx="4" fill={BLUE_SOFT} />
      ))}
      <text x="105" y="166" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        what you want to say
      </text>
      <text x="295" y="166" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        what they need to hear
      </text>
    </Frame>
  );
}

/** Public Speaking course, Module 2 Lesson 1: five reliable hook types. */
export function FiveHookTypesIllustration() {
  const items = ["Stat", "Story", "Question", "Claim", "Problem"];
  return (
    <Frame viewBox="0 0 400 150">
      {items.map((label, i) => {
        const cx = 42 + i * 80;
        return (
          <g key={label}>
            <circle cx={cx} cy="42" r="26" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.4" />
            {label === "Stat" && [0, 1, 2].map((j) => <rect key={j} x={cx - 12 + j * 9} y={52 - j * 8} width="6" height={8 + j * 8} rx="1.5" fill={BLUE} />)}
            {label === "Story" && (
              <path d={`M ${cx - 13} 32 h26 a4 4 0 0 1 4 4 v8 a4 4 0 0 1 -4 4 h-16 l-6 6 v-6 h-4 a4 4 0 0 1 -4 -4 v-8 a4 4 0 0 1 4 -4 z`} fill={BLUE} />
            )}
            {label === "Question" && (
              <text x={cx} y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill={BLUE}>
                ?
              </text>
            )}
            {label === "Claim" && (
              <text x={cx} y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill={BLUE}>
                !
              </text>
            )}
            {label === "Problem" && (
              <path d={`M ${cx} 28 L ${cx + 13} 52 L ${cx - 13} 52 Z`} fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinejoin="round" />
            )}
            {label === "Problem" && <circle cx={cx} cy="47" r="1.6" fill={BLUE} />}
            <text x={cx} y="78" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
              {label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

/** Public Speaking course, Module 2 Lesson 2: one topic branching into three main points. */
export function ThreeMainPointsIllustration() {
  const points = [
    { label: "Point 1", x: 20 },
    { label: "Point 2", x: 150 },
    { label: "Point 3", x: 280 },
  ];
  return (
    <Frame viewBox="0 0 400 190">
      <rect x="150" y="12" width="100" height="36" rx="8" fill={INK} />
      <text x="200" y="35" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff">
        Your topic
      </text>
      {points.map((p) => (
        <path key={p.label} d={`M 200 50 C 200 90, ${p.x + 50} 90, ${p.x + 50} 118`} fill="none" stroke={LINE} strokeWidth="2.2" markerEnd="url(#tmpArrow)" />
      ))}
      {points.map((p) => (
        <g key={p.label}>
          <rect x={p.x} y="122" width="100" height="36" rx="8" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.6" />
          <text x={p.x + 50} y="145" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
            {p.label}
          </text>
        </g>
      ))}
      <defs>
        <marker id="tmpArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Public Speaking course, Module 3 Lesson 2: closed/defensive vs. open/grounded posture, abstracted. */
export function OpenVsClosedPostureIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7E8CA6">
        Closed
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        Open & grounded
      </text>
      <g stroke="#9FACC7" strokeWidth="5.5" strokeLinecap="round" fill="none">
        <circle cx="105" cy="40" r="11" fill="#E4E9F5" stroke="#9FACC7" strokeWidth="2" />
        <path d="M 105 52 L 105 110" />
        <path d="M 105 62 L 96 90 M 105 62 L 114 90" />
        <path d="M 105 110 L 98 150 M 105 110 L 112 150" />
      </g>
      <g stroke={BLUE} strokeWidth="6" strokeLinecap="round" fill="none">
        <circle cx="295" cy="38" r="13" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="2.4" />
        <path d="M 295 52 L 295 108" />
        <path d="M 295 62 L 268 85 M 295 62 L 322 85" />
        <path d="M 295 108 L 272 152 M 295 108 L 318 152" />
      </g>
      <text x="105" y="175" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        narrow, limbs held in
      </text>
      <text x="295" y="175" textAnchor="middle" fontSize="10" fill="#7E8CA6">
        wide stance, open limbs
      </text>
    </Frame>
  );
}

/** Public Speaking course, Module 4 Lesson 1: a cluttered slide vs. one with a clear focal point. */
export function SlideFocalPointIllustration() {
  return (
    <Frame viewBox="0 0 400 190">
      <text x="105" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7E8CA6">
        Cluttered
      </text>
      <text x="295" y="18" textAnchor="middle" fontSize="12" fontWeight="800" fill={BLUE}>
        One focal point
      </text>
      <rect x="20" y="26" width="170" height="120" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      <rect x="32" y="36" width="60" height="7" rx="3" fill="#C9D3E8" />
      <rect x="32" y="50" width="146" height="18" rx="3" fill="#EEF2FA" />
      <rect x="32" y="74" width="146" height="18" rx="3" fill="#EEF2FA" />
      <rect x="32" y="98" width="70" height="18" rx="3" fill="#EEF2FA" />
      <rect x="108" y="98" width="70" height="18" rx="3" fill="#EEF2FA" />
      <rect x="32" y="122" width="146" height="14" rx="3" fill="#EEF2FA" />
      <rect x="210" y="26" width="170" height="120" rx="8" fill="#fff" stroke={BLUE} strokeWidth="1.8" />
      <rect x="222" y="36" width="50" height="6" rx="3" fill="#C9D3E8" />
      <text x="295" y="100" textAnchor="middle" fontSize="34" fontWeight="800" fill={BLUE}>
        42%
      </text>
      <rect x="248" y="118" width="94" height="7" rx="3.5" fill="#EEF2FA" />
    </Frame>
  );
}

/** Public Speaking course, Module 4 Lesson 2: matching a chart type to the point being made. */
export function ChartTypeMatchingIllustration() {
  return (
    <Frame viewBox="0 0 400 150">
      <g>
        <circle cx="80" cy="42" r="26" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.4" />
        {[0, 1, 2].map((j) => (
          <rect key={j} x={68 + j * 9} y={54 - j * 9} width="6" height={8 + j * 9} rx="1.5" fill={BLUE} />
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
          Bar
        </text>
        <text x="80" y="92" textAnchor="middle" fontSize="9" fill="#7E8CA6">
          compare categories
        </text>
      </g>
      <g>
        <circle cx="200" cy="42" r="26" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.4" />
        <path d="M 186 52 L 194 38 L 203 46 L 214 30" fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="200" y="78" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
          Line
        </text>
        <text x="200" y="92" textAnchor="middle" fontSize="9" fill="#7E8CA6">
          show a trend
        </text>
      </g>
      <g>
        <circle cx="320" cy="42" r="26" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.4" />
        <path d="M 320 42 L 320 24 A 18 18 0 0 1 336 51 Z" fill={BLUE} />
        <circle cx="320" cy="42" r="14" fill="none" stroke={BLUE} strokeWidth="2" />
        <text x="320" y="78" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={INK}>
          Pie
        </text>
        <text x="320" y="92" textAnchor="middle" fontSize="9" fill="#7E8CA6">
          part of a whole
        </text>
      </g>
    </Frame>
  );
}

/** Public Speaking course, Module 5 Lesson 2: a simple three-step impromptu-answer structure. */
export function PointReasonExampleIllustration() {
  const steps = ["Point", "Reason", "Example"];
  return (
    <Frame viewBox="0 0 400 130">
      {steps.map((label, i) => {
        const x = 20 + i * 130;
        return (
          <g key={label}>
            <rect x={x} y="35" width="110" height="46" rx="9" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.6" />
            <text x={x + 55} y="63" textAnchor="middle" fontSize="13" fontWeight="800" fill={INK}>
              {label}
            </text>
            {i < 2 && <path d={`M ${x + 114} 58 L ${x + 126} 58`} stroke={LINE} strokeWidth="2.5" markerEnd="url(#preArrow)" />}
          </g>
        );
      })}
      <defs>
        <marker id="preArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Public Speaking course, Module 5 Lesson 4: looking at the camera lens vs. the screen, as a gaze angle relative to a fixed camera. */
export function CameraVsScreenEyelineIllustration() {
  function panel(cx: number, good: boolean) {
    const screenX = cx - 45;
    const headY = 50;
    // The camera's physical position never changes between panels - draw it identically, neutrally, in both.
    const cameraX = cx;
    const cameraY = 20;
    // The one thing that actually differs: where the gaze line actually ends up landing.
    const gazeTargetY = good ? 20 : 55;
    return (
      <g key={cx}>
        <rect x={screenX} y="20" width="90" height="64" rx="6" fill="#fff" stroke={LINE} strokeWidth="1.6" />
        <rect x={screenX + 14} y="40" width="62" height="30" rx="4" fill="#EEF2FA" />
        <circle cx={cameraX} cy={cameraY} r="4" fill="#9FACC7" />
        <circle cx={cx - 55} cy={headY} r="10" fill="#E4E9F5" stroke="#9FACC7" strokeWidth="2" />
        <path d={`M ${cx - 46} ${headY} L ${cx} ${gazeTargetY}`} stroke={good ? BLUE : CORAL} strokeWidth="2.2" strokeDasharray="3,3" />
        <circle cx={cx} cy={gazeTargetY} r="4.5" fill={good ? BLUE : CORAL} />
        <circle cx={cx + 55} cy="50" r="11" fill="none" stroke={good ? MINT : CORAL} strokeWidth="2.5" />
        <path
          d={good ? `M ${cx + 49} 50 L ${cx + 53} 54 L ${cx + 60} 45` : `M ${cx + 50} 45 L ${cx + 60} 55 M ${cx + 60} 45 L ${cx + 50} 55`}
          stroke={good ? MINT : CORAL}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x={cx} y="105" textAnchor="middle" fontSize="11" fontWeight="800" fill={INK}>
          {good ? "Camera" : "Screen"}
        </text>
      </g>
    );
  }
  return (
    <Frame viewBox="0 0 400 120">
      {panel(105, true)}
      {panel(295, false)}
    </Frame>
  );
}

/** Public Speaking course, Module 6 Lesson 2: which kinds of humor are low-risk vs. high-risk. */
export function HumorRiskSpectrumIllustration() {
  const points = [
    { label: "Self", x: 60, fill: MINT },
    { label: "Shared", x: 153, fill: BLUE },
    { label: "Others", x: 247, fill: AMBER },
    { label: "Sensitive", x: 340, fill: CORAL },
  ];
  return (
    <Frame viewBox="0 0 400 130">
      <path d="M 40 65 L 360 65" stroke={LINE} strokeWidth="2.5" />
      <text x="40" y="20" fontSize="9.5" fontWeight="800" fill="#7E8CA6">
        lower risk
      </text>
      <text x="360" y="20" textAnchor="end" fontSize="9.5" fontWeight="800" fill="#7E8CA6">
        higher risk
      </text>
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy="65" r="11" fill={p.fill} stroke="#fff" strokeWidth="2" />
          <text x={p.x} y="95" textAnchor="middle" fontSize="11" fontWeight="800" fill={INK}>
            {p.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** Digital Marketing course, Lesson 1: the 5-module roadmap. */
export function MarketingCourseRoadmapIllustration() {
  const steps = [
    { label: "Foundations", sub: "You are here" },
    { label: "Content & Copy", sub: "Words that get clicked" },
    { label: "Channels", sub: "Social, SEO, email, ads" },
    { label: "Measurement", sub: "Numbers that matter" },
    { label: "Execution", sub: "Your first campaign" },
  ];
  const rowH = 44;
  const gap = 14;
  return (
    <Frame viewBox="0 0 400 300">
      {steps.map((s, i) => {
        const y = 6 + i * (rowH + gap);
        return (
          <g key={s.label}>
            {i > 0 && (
              <path
                d={`M 200 ${y - gap + 2} L 200 ${y - 3}`}
                stroke={LINE}
                strokeWidth="2.5"
                markerEnd="url(#mcrArrow)"
              />
            )}
            <rect
              x="10"
              y={y}
              width="380"
              height={rowH}
              rx="10"
              fill={i === 0 ? BLUE : "#fff"}
              stroke={i === 0 ? BLUE : LINE}
              strokeWidth="1.6"
            />
            <text x="26" y={y + 27} fontSize="13" fontWeight="800" fill={i === 0 ? "#fff" : INK}>
              {i + 1}. {s.label}
            </text>
            <text x="374" y={y + 27} textAnchor="end" fontSize="10.5" fill={i === 0 ? "#DCE6FF" : "#7E8CA6"}>
              {s.sub}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="mcrArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={LINE} />
        </marker>
      </defs>
    </Frame>
  );
}

/** Digital Marketing course, Lesson 2: what a useful customer profile actually contains. */
export function AudienceProfileAnatomyIllustration() {
  const rows = [
    { label: "Who", fill: BLUE, sub: "one specific kind of person" },
    { label: "Problem", fill: MINT, sub: "what they're trying to solve" },
    { label: "Searches", fill: AMBER, sub: "the words they actually use" },
    { label: "Where", fill: "#C9D3E8", sub: "where they spend time online" },
  ];
  return (
    <Frame viewBox="0 0 400 200">
      <rect x="16" y="10" width="150" height="162" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.6" />
      {rows.map((r, i) => (
        <rect key={r.label} x="26" y={14 + i * 40} width="130" height="26" rx="4" fill={r.fill} opacity={r.fill === "#C9D3E8" ? 1 : 0.9} />
      ))}
      {rows.map((r, i) => {
        const rowY = 24 + i * 44;
        return (
          <g key={r.label}>
            <rect x="184" y={rowY - 9} width="10" height="10" rx="2" fill={r.fill} />
            <text x="202" y={rowY} fontSize="12.5" fontWeight="800" fill={INK}>
              {r.label}
            </text>
            <text x="184" y={rowY + 16} fontSize="9.5" fill="#7E8CA6">
              {r.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

export const LESSON_ILLUSTRATIONS: Record<string, () => JSX.Element> = {
  "course-roadmap": CourseRoadmapIllustration,
  "six-second-scan": SixSecondScanIllustration,
  "two-audiences": TwoAudiencesIllustration,
  "ats-parsing": AtsParsingIllustration,
  "formatting-comparison": FormattingComparisonIllustration,
  "three-formats": ThreeFormatsIllustration,
  "halo-effect": HaloEffectIllustration,
  "resume-header-anatomy": ResumeHeaderAnatomyIllustration,
  "job-entry-anatomy": JobEntryAnatomyIllustration,
  "duty-vs-impact": DutyVsImpactIllustration,
  "so-what-test": SoWhatTestIllustration,
  "five-number-types": FiveNumberTypesIllustration,
  "hard-vs-soft-skills": HardVsSoftSkillsIllustration,
  "type-hierarchy": TypeHierarchyIllustration,
  "posting-priority-signals": PostingPrioritySignalsIllustration,
  "master-resume-branching": MasterResumeBranchingIllustration,
  "skill-translation-bridge": SkillTranslationBridgeIllustration,
  "entry-level-resume-layout": EntryLevelResumeLayoutIllustration,
  "resume-vs-cover-letter": ResumeVsCoverLetterIllustration,
  "reference-sheet-anatomy": ReferenceSheetAnatomyIllustration,
  "portfolio-piece-anatomy": PortfolioPieceAnatomyIllustration,
  "job-channel-yield": JobChannelYieldIllustration,
  "application-tracker-anatomy": ApplicationTrackerAnatomyIllustration,
  "job-search-funnel-bottlenecks": JobSearchFunnelBottlenecksIllustration,
  "three-numbers": ThreeNumbersIllustration,
  "speaking-course-roadmap": SpeakingCourseRoadmapIllustration,
  "say-vs-hear": SayVsHearIllustration,
  "five-hook-types": FiveHookTypesIllustration,
  "three-main-points": ThreeMainPointsIllustration,
  "open-vs-closed-posture": OpenVsClosedPostureIllustration,
  "slide-focal-point": SlideFocalPointIllustration,
  "chart-type-matching": ChartTypeMatchingIllustration,
  "point-reason-example": PointReasonExampleIllustration,
  "camera-vs-screen-eyeline": CameraVsScreenEyelineIllustration,
  "humor-risk-spectrum": HumorRiskSpectrumIllustration,
  "marketing-course-roadmap": MarketingCourseRoadmapIllustration,
  "audience-profile-anatomy": AudienceProfileAnatomyIllustration,
};
