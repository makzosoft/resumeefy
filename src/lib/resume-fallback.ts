import type { GeneratedResume } from "@/lib/gemini";

// Used when the AI is busy or unavailable so a resume can always be created.
// It only rearranges what the person typed. It never invents facts, dates or numbers.
const clean = (s: unknown) => String(s ?? "").replace(/[\u2013\u2014]/g, ",").replace(/\s+/g, " ").trim();

export function buildResumeWithoutAi(input: Record<string, unknown>): GeneratedResume {
  const title = clean(input.targetTitle);
  const seen = new Set<string>();
  const skills = String(input.skills ?? "").split(/[,;\n]+/).map(clean).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, 15);

  let summary = clean(input.summary);
  if (summary.length < 20) {
    const role = title || "Professional";
    summary = skills.length ? `${role} with strengths in ${skills.slice(0, 3).join(", ")}.` : `${role} ready to contribute and keep growing in a new role.`;
  }

  const bullets = String(input.exp1 ?? "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((x) => clean(x).replace(/^[-*\u2022]\s*/, ""))
    .filter((x) => x.length >= 15)
    .slice(0, 8);

  return {
    summary,
    experience: bullets.length ? [{ company: "Your experience", role: title, dates: "", bullets }] : [],
    education: [],
    certifications: [],
    projects: [],
    skills,
    qualityChecks: [
      "The AI was busy, so this CV was put together from your own wording. Nothing was invented and no credits were charged.",
      "Checked: no long dashes and no empty sections added.",
      "Try again later for an AI polished version.",
    ],
  };
}
