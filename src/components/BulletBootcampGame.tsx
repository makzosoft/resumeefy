"use client";
import { useState } from "react";

type Round = { weak: string; options: string[]; correct: number; why: string };

const ROUNDS: Round[] = [
  {
    weak: "Responsible for managing social media accounts",
    options: [
      "Grew Instagram following from 4,000 to 22,000 in 8 months with a weekly content calendar",
      "In charge of the company's social media presence",
      "Worked on social media related tasks",
    ],
    correct: 0,
    why: "It states a measurable result and the method used, not just the assignment.",
  },
  {
    weak: "Helped improve customer response times",
    options: [
      "Assisted with customer service improvements",
      "Cut average response time from 6 hours to under 90 minutes by restructuring the support queue",
      "Was involved in the support team",
    ],
    correct: 1,
    why: "A specific before-and-after number proves impact instead of just claiming involvement.",
  },
  {
    weak: "Responsible for handling customer complaints",
    options: [
      "Dealt with customers who had complaints",
      "Worked in customer support",
      "Reduced complaint resolution time from 3 days to 1 by introducing a triage system",
    ],
    correct: 2,
    why: "Again, a concrete method plus a measurable result beats a vague description of the duty.",
  },
  {
    weak: "Worked on the checkout redesign project",
    options: [
      "Led the checkout redesign, reducing cart abandonment by 18% over one quarter",
      "Participated in a redesign project for checkout",
      "Was part of the team working on checkout",
    ],
    correct: 0,
    why: "A strong verb (led) plus a specific, quantified business outcome shows ownership and impact.",
  },
  {
    weak: "Managed a team of employees",
    options: [
      "Oversaw staff on a daily basis",
      "In charge of a team",
      "Managed a team of 6, hitting quarterly targets in 4 of 4 quarters and cutting turnover by half",
    ],
    correct: 2,
    why: "Team size plus two concrete outcomes turns a bare fact into evidence of real management skill.",
  },
];

export function BulletBootcampGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === ROUNDS[round].correct) setScore((s) => s + 1);
  }

  function next() {
    if (round + 1 >= ROUNDS.length) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setSelected(null);
  }

  function playAgain() {
    setRound(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="bootcamp-game bootcamp-done">
        <h3>Bullet Point Bootcamp — done!</h3>
        <p className="bootcamp-score">
          {score} / {ROUNDS.length} correct
        </p>
        <button className="btn-sm" onClick={playAgain}>
          Play again
        </button>
      </div>
    );
  }

  const r = ROUNDS[round];
  return (
    <div className="bootcamp-game">
      <div className="bootcamp-header">
        <h3>Bullet Point Bootcamp</h3>
        <span>
          Round {round + 1} / {ROUNDS.length} · Score {score}
        </span>
      </div>
      <p className="bootcamp-weak">Weak bullet: "{r.weak}"</p>
      <p className="copy-hint">Which rewrite proves impact best?</p>
      <div className="grid gap-2 mt-2">
        {r.options.map((opt, i) => {
          let cls = "quiz-option";
          if (selected !== null) {
            if (i === r.correct) cls += " correct";
            else if (i === selected) cls += " wrong";
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={selected !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <>
          <p className="quiz-feedback correct mt-2">{r.why}</p>
          <button className="btn-sm mt-3" onClick={next}>
            {round + 1 >= ROUNDS.length ? "See score" : "Next round"}
          </button>
        </>
      )}
    </div>
  );
}
