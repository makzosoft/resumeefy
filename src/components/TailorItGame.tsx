"use client";
import { useState } from "react";

type Fit = "exact" | "rephrase" | "bonus" | "cut";
type Skill = { label: string; fit: Fit; note: string };
type Scenario = { posting: string; requirements: string[]; skills: Skill[] };

const SCENARIOS: Scenario[] = [
  {
    posting: "Financial Analyst \u2014 required skills",
    requirements: ["Advanced Excel", "SQL", "Financial Reporting", "Stakeholder Communication"],
    skills: [
      { label: "Excel (Advanced)", fit: "exact", note: "Direct match for \u201cAdvanced Excel.\u201d Keep it." },
      { label: "SQL", fit: "exact", note: "Direct match. Keep it." },
      {
        label: "Financial Statements & Reporting",
        fit: "rephrase",
        note: "Same skill as \u201cFinancial Reporting,\u201d just worded differently. Worth keeping \u2014 and worth rephrasing closer to the posting's exact wording.",
      },
      { label: "Client & Stakeholder Communication", fit: "exact", note: "Close enough to \u201cStakeholder Communication\u201d to count as a direct match. Keep it." },
      { label: "Data Visualization (Power BI)", fit: "bonus", note: "Not explicitly requested, but genuinely relevant to a reporting-heavy role. Worth including." },
      { label: "Adobe Photoshop", fit: "cut", note: "Not relevant to this posting \u2014 leave it off this particular resume." },
      { label: "Event Planning", fit: "cut", note: "Not relevant here, even if it's a real skill you have." },
    ],
  },
  {
    posting: "Customer Support Specialist \u2014 required skills",
    requirements: ["Zendesk", "Conflict Resolution", "Bilingual (English/French)"],
    skills: [
      { label: "Zendesk", fit: "exact", note: "Direct match. Keep it." },
      { label: "Fluent in English and French", fit: "exact", note: "Direct match for \u201cBilingual (English/French).\u201d Keep it." },
      {
        label: "Handling Difficult Customer Situations",
        fit: "rephrase",
        note: "Same underlying skill as \u201cConflict Resolution,\u201d just worded differently. Worth keeping \u2014 and aligning the wording to the posting.",
      },
      { label: "Salesforce", fit: "bonus", note: "Not requested, but a related support tool worth mentioning briefly." },
      { label: "Adobe Illustrator", fit: "cut", note: "Not relevant to this posting." },
      { label: "Typing 60 WPM", fit: "cut", note: "Not what this posting is asking about \u2014 leave it off." },
      { label: "Public Speaking", fit: "cut", note: "Not relevant here, even if it's a real skill you have." },
    ],
  },
];

export function TailorItGame() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const scenario = SCENARIOS[scenarioIndex];

  function toggle(label: string) {
    if (checked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function shouldKeep(fit: Fit) {
    return fit !== "cut";
  }

  function scoreCount() {
    let score = 0;
    for (const s of scenario.skills) {
      const kept = selected.has(s.label);
      if (kept === shouldKeep(s.fit)) score++;
    }
    return score;
  }

  function nextScenario() {
    setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
    setSelected(new Set());
    setChecked(false);
  }

  function reset() {
    setSelected(new Set());
    setChecked(false);
  }

  return (
    <div className="bootcamp-game">
      <div className="bootcamp-header">
        <h3>Tailor It</h3>
        <span>Scenario {scenarioIndex + 1} / {SCENARIOS.length}</span>
      </div>
      <p className="bootcamp-weak">{scenario.posting}: {scenario.requirements.join(", ")}</p>
      <p className="copy-hint">Tap the skills below you'd actually keep on a resume tailored to this posting.</p>
      <div className="grid gap-2 mt-2">
        {scenario.skills.map((s) => {
          const isSelected = selected.has(s.label);
          let cls = "quiz-option";
          if (isSelected && !checked) cls += " tailor-selected";
          if (checked) {
            const correct = isSelected === shouldKeep(s.fit);
            cls += correct ? " correct" : " wrong";
          }
          return (
            <button key={s.label} className={cls} onClick={() => toggle(s.label)} disabled={checked}>
              {s.label}
            </button>
          );
        })}
      </div>
      {!checked && (
        <button className="btn-sm mt-3" onClick={() => setChecked(true)}>
          Check my choices
        </button>
      )}
      {checked && (
        <div className="mt-3">
          <p className="quiz-feedback correct">
            {scoreCount()} / {scenario.skills.length} judged correctly
          </p>
          <div className="grid gap-1 mt-2">
            {scenario.skills.map((s) => (
              <p key={s.label} className="tailor-note">
                <b>{s.label}:</b> {s.note}
              </p>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn-sm" onClick={reset}>
              Try this scenario again
            </button>
            <button className="btn-sm" onClick={nextScenario}>
              Next scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
