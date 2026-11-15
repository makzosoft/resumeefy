import type { INSTRUCTORS } from "./instructors";

export type Quiz = { question: string; options: string[]; correct: number; explain: string };

export type LessonSection = { heading: string; paragraphs: string[]; illustration?: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  /** A short opening hook paragraph or two, shown before the named sections. Used by deep-format lessons. */
  intro?: string;
  /** Named sections for a genuinely deep lesson — each gets its own heading in the viewer. */
  sections?: LessonSection[];
  /** Legacy flat paragraphs, used by earlier, shorter-format lessons. A lesson has either this or intro+sections, not both. */
  body?: string[];
  tryThis?: string;
  quiz: Quiz;
};

export type CuratedCourse = {
  slug: string;
  title: string;
  subtitle: string;
  instructorId: keyof typeof INSTRUCTORS;
  level: "Beginner" | "Beginner to Intermediate" | "Intermediate";
  hours: string;
  summary: string;
  outcomes: string[];
  lessons: Lesson[];
};
