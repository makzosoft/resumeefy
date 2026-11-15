"use client";
import { useState } from "react";

type Item = { text: string; flawed: boolean; why: string };

const BASE_ITEMS: Item[] = [
  {
    text: "Address: 14B Aina Close, off Adeniran Ogunsanya Street, Surulere, Lagos",
    flawed: true,
    why: "A full street address isn't necessary, and it's unnecessary personal information to hand to a document sent to strangers \u2014 city and country is enough.",
  },
  {
    text: "Operations Coordinator \u2014 Halden Logistics",
    flawed: false,
    why: "Clear, standard title-and-company format \u2014 nothing to fix here.",
  },
  {
    text: "Hardworking and dedicated team player seeking growth opportunities",
    flawed: true,
    why: "This could describe almost any applicant for almost any job \u2014 it's an objective statement with no specific, verifiable detail.",
  },
  {
    text: "Helped with the quarterly inventory count",
    flawed: true,
    why: "\u201cHelped with\u201d hides your actual contribution \u2014 name specifically what you did and what came of it instead.",
  },
  {
    text: "Reduced average delivery delay from 3 days to 1 by renegotiating two courier contracts",
    flawed: false,
    why: "Specific method, specific measurable result \u2014 this is exactly the formula this course teaches.",
  },
  {
    text: "myfootballlife2010@yahoo.com",
    flawed: true,
    why: "A casual, unrelated-to-your-name address undercuts a professional document before the reader reads a word of substance.",
  },
  {
    text: "Google Data Analytics Professional Certificate, 2023",
    flawed: false,
    why: "Complete and correctly formatted: name, issuing body, year.",
  },
  {
    text: "References available upon request",
    flawed: true,
    why: "Every employer already assumes this \u2014 it's a wasted line that could hold something more useful.",
  },
  {
    text: "Skills: SQL, Advanced Excel, Financial Modeling, Power BI",
    flawed: false,
    why: "Specific, scannable hard skills, phrased the way a recruiter or ATS would actually search for them.",
  },
  {
    text: "Was involved in a team that worked on a new onboarding process",
    flawed: true,
    why: "Passive and vague on two counts \u2014 unclear what you specifically did, and no result stated.",
  },
];

function shuffled(items: Item[]): Item[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function FixThisResumeGame() {
  const [items, setItems] = useState<Item[]>(() => shuffled(BASE_ITEMS));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);

  function respond(guessFlawed: boolean) {
    if (answer !== null) return;
    setAnswer(guessFlawed);
    if (guessFlawed === items[index].flawed) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= items.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer(null);
  }

  function playAgain() {
    setItems(shuffled(BASE_ITEMS));
    setIndex(0);
    setScore(0);
    setAnswer(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="bootcamp-game bootcamp-done">
        <h3>{"Fix This Resume \u2014 done!"}</h3>
        <p className="bootcamp-score">
          {score} / {items.length} correct
        </p>
        <button className="btn-sm" onClick={playAgain}>
          Play again
        </button>
      </div>
    );
  }

  const it = items[index];
  const gotItRight = answer !== null && answer === it.flawed;
  return (
    <div className="bootcamp-game">
      <div className="bootcamp-header">
        <h3>Fix This Resume</h3>
        <span>
          Line {index + 1} / {items.length} {"\u00b7"} Score {score}
        </span>
      </div>
      <p className="bootcamp-weak">"{it.text}"</p>
      <p className="copy-hint">Is this line a mistake, or is it fine as-is?</p>
      <div className="grid gap-2 mt-2">
        <button
          className={`quiz-option${answer !== null ? (it.flawed ? " correct" : answer === true ? " wrong" : "") : ""}`}
          onClick={() => respond(true)}
          disabled={answer !== null}
        >
          It's a mistake
        </button>
        <button
          className={`quiz-option${answer !== null ? (!it.flawed ? " correct" : answer === false ? " wrong" : "") : ""}`}
          onClick={() => respond(false)}
          disabled={answer !== null}
        >
          It's fine
        </button>
      </div>
      {answer !== null && (
        <>
          <p className={`quiz-feedback ${gotItRight ? "correct" : "wrong"} mt-2`}>{it.why}</p>
          <button className="btn-sm mt-3" onClick={next}>
            {index + 1 >= items.length ? "See score" : "Next line"}
          </button>
        </>
      )}
    </div>
  );
}
