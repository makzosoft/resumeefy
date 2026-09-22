// Deliberately has zero imports (not even from ./db) so this is safe to
// import from client components as well as server code — pulling these
// numbers in from src/lib/data.ts instead would drag the Supabase admin
// client (and its service-role credentials) into the client bundle.
export const CREDIT_COSTS = {
  resume_boost: 100,
  resume_professional: 140,
  resume_executive: 180,
  resume_international: 220,
  resume_ai: 20,
  job_match: 10,
  resume_quality: 8,
  interview: 15,
  interview_feedback: 8,
  desktop_sim: 20,
  assessment_module: 10,
  course_generation: 25,
  course_late_unlock: 20,
  course_certificate: 40,
  course_lesson: 5,
} as const;
