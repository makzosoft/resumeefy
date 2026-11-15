/**
 * Curated Resumeefy courses.
 *
 * Unlike the personalized course generator in src/lib/gemini.ts (which still
 * exists as an optional, secondary "build me a custom path" feature), the
 * courses here are written once, in full, and served to everyone — real
 * courses with real lessons, not a prompt that gets re-run per visitor.
 *
 * Structure: one file per course (easier to review, edit, and add to than
 * one giant file), a shared instructors.ts, and a shared types.ts. This
 * file just wires them together. To add a new course:
 *   1. Add the instructor to instructors.ts, if it's a new one.
 *   2. Add a new <course-slug>.ts file here, following the existing ones.
 *   3. Import it below and add it to the CURATED_COURSES array.
 * Nothing else needs to change — courses/page.tsx and courses/[slug]/page.tsx
 * both read from CURATED_COURSES and getCourseBySlug generically.
 */

export type { Instructor } from "./instructors";
export { INSTRUCTORS } from "./instructors";
export type { Quiz, Lesson, CuratedCourse } from "./types";

import type { CuratedCourse } from "./types";
import { careerReadinessJobSearchMastery } from "./career-readiness-job-search-mastery";
import { publicSpeakingMastery } from "./public-speaking-mastery";
import { digitalMarketingMastery } from "./digital-marketing-mastery";
import { customerServiceFundamentals } from "./customer-service-fundamentals";
import { virtualAssistantFundamentals } from "./virtual-assistant-fundamentals";
import { aiAutomationForEverydayWork } from "./ai-automation-for-everyday-work";
import { promptEngineeringEssentials } from "./prompt-engineering-essentials";
import { aiIllustratedBookDesign } from "./ai-illustrated-book-design";
import { introductionToProgramming } from "./introduction-to-programming";
import { spreadsheetsWithExcel } from "./spreadsheets-with-excel";

export const CURATED_COURSES: CuratedCourse[] = [
  careerReadinessJobSearchMastery,
  publicSpeakingMastery,
  digitalMarketingMastery,
  customerServiceFundamentals,
  virtualAssistantFundamentals,
  aiAutomationForEverydayWork,
  promptEngineeringEssentials,
  aiIllustratedBookDesign,
  introductionToProgramming,
  spreadsheetsWithExcel,
];

export function getCourseBySlug(slug: string): CuratedCourse | undefined {
  return CURATED_COURSES.find((c) => c.slug === slug);
}
