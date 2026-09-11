import { RESUMEEFY_CV_SYSTEM_PROMPT } from "./resume-rules";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

type JsonSchema = Record<string, unknown>;

const RAW_KEYS = (process.env.GEMINI_API_KEYS || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Startup config log — shows key count once per warm instance.
if (RAW_KEYS.length === 0) {
  console.warn("[ai:config] GEMINI_API_KEYS is empty. AI features will fail until it is set.");
} else {
  console.log(`[ai:config] loaded ${RAW_KEYS.length} key(s), model=${GEMINI_MODEL}`);
}

let currentIndex = 0;
const deadKeys = new Set<number>();

function nextLiveKeyIndex(): number | null {
  if (RAW_KEYS.length === 0) return null;
  for (let step = 0; step < RAW_KEYS.length; step++) {
    const idx = (currentIndex + step) % RAW_KEYS.length;
    if (!deadKeys.has(idx)) return idx;
  }
  return null;
}

function markDead(idx: number, reason: string) {
  if (!deadKeys.has(idx)) {
    deadKeys.add(idx);
    console.warn(
      `[ai:key] key #${idx + 1}/${RAW_KEYS.length} DEAD — reason=${reason} — live=${RAW_KEYS.length - deadKeys.size}`
    );
  }
}

function markAlive(idx: number, wasDead: boolean) {
  if (wasDead || deadKeys.has(idx)) {
    deadKeys.delete(idx);
    console.log(`[ai:key] key #${idx + 1}/${RAW_KEYS.length} RECOVERED`);
  }
  if (currentIndex !== idx) {
    console.log(`[ai:key] pointer moved #${currentIndex + 1} → #${idx + 1}`);
  }
  currentIndex = idx;
}

function isQuotaOrAuthError(status: number, body: unknown): boolean {
  if (status === 429 || status === 403) return true;
  if (!body || typeof body !== "object") return false;
  const text = JSON.stringify(body).toLowerCase();
  return (
    text.includes("resource_exhausted") ||
    text.includes("insufficient_quota") ||
    text.includes("quota") ||
    text.includes("permission_denied") ||
    text.includes("rate limit") ||
    text.includes("api key not valid") ||
    text.includes("api_key_invalid") ||
    text.includes("billing")
  );
}

function extractText(payload: any): string {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text) return payload.output_text;
  const choices = payload.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const msg = choices[0]?.message;
    if (typeof msg?.content === "string") return msg.content;
    if (Array.isArray(msg?.content)) {
      return msg.content.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("");
    }
  }
  const output = payload.output;
  if (Array.isArray(output)) {
    return output
      .flatMap((item: any) => item?.content || [])
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  return "";
}

async function callGemini<T>(
  apiKey: string,
  input: unknown,
  schema: JsonSchema,
  schemaName: string,
  instructions: string
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
        temperature: 0.4,
      }),
    });

    const raw = await response.text();
    let payload: any = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = { raw };
    }

    if (!response.ok) {
      const err: any = new Error(`Gemini request failed (${response.status})`);
      err.status = response.status;
      err.body = payload;
      err.isQuota = isQuotaOrAuthError(response.status, payload);
      throw err;
    }

    const text = extractText(payload);
    if (!text) {
      const err: any = new Error("Gemini returned an empty response.");
      err.status = response.status;
      err.body = payload;
      err.isQuota = false;
      throw err;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        const err: any = new Error("Gemini returned invalid structured JSON.");
        err.status = response.status;
        err.body = { raw: text.slice(0, 500) };
        err.isQuota = false;
        throw err;
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

async function responsesJson<T>(
  input: unknown,
  schema: JsonSchema,
  schemaName: string,
  instructions: string
): Promise<T> {
  if (RAW_KEYS.length === 0) {
    const err: any = new Error("AI is not configured on this server.");
    err.status = 503;
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const startedAt = Date.now();
  let lastError: any = null;
  let attempts = 0;

  while (true) {
    const idx = nextLiveKeyIndex();
    if (idx === null) {
      console.error(
        `[ai:exhausted] schema=${schemaName} — all ${RAW_KEYS.length} key(s) dead — attempts=${attempts}`
      );
      const err: any = new Error("AI is temporarily unavailable. Please try again later.");
      err.status = 503;
      err.code = "AI_QUOTA_EXHAUSTED";
      err.cause = lastError?.message ?? "all keys exhausted";
      throw err;
    }

    const wasDead = deadKeys.has(idx);
    attempts++;
    const attemptStart = Date.now();

    console.log(
      `[ai:call] schema=${schemaName} key=#${idx + 1}/${RAW_KEYS.length} attempt=${attempts}`
    );

    try {
      const result = await callGemini<T>(input, schema, schemaName, instructions, RAW_KEYS[idx]);
      const ms = Date.now() - attemptStart;
      console.log(`[ai:ok] schema=${schemaName} key=#${idx + 1} ms=${ms}`);
      markAlive(idx, wasDead);
      return result;
    } catch (error: any) {
      lastError = error;
      const ms = Date.now() - attemptStart;

      if (error?.isQuota) {
        console.warn(
          `[ai:err] schema=${schemaName} key=#${idx + 1} status=${error.status} quota=true ms=${ms}`
        );
        markDead(idx, `quota_or_auth_status_${error.status}`);
        continue;
      }

      if (error?.name === "AbortError") {
        console.warn(
          `[ai:err] schema=${schemaName} key=#${idx + 1} timeout=true ms=${ms}`
        );
        markDead(idx, "timeout");
        continue;
      }

      console.error(
        `[ai:err] schema=${schemaName} key=#${idx + 1} status=${error.status ?? "n/a"} fatal=true ms=${ms}`,
        error?.message
      );
      throw error;
    }
  }
}

/* =========================
   Schemas
   ========================= */

const resumeSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          dates: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["company", "role", "dates", "bullets"],
      },
    },
    education: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    projects: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    qualityChecks: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "experience", "education", "certifications", "projects", "skills", "qualityChecks"],
};

export type GeneratedResume = {
  summary: string;
  experience: Array<{ company: string; role: string; dates: string; bullets: string[] }>;
  education: string[];
  certifications: string[];
  projects: string[];
  skills: string[];
  qualityChecks: string[];
};

export async function generateResume(input: Record<string, unknown>): Promise<GeneratedResume> {
  return responsesJson<GeneratedResume>(
    input,
    resumeSchema,
    "resumeefy_resume",
    `${RESUMEEFY_CV_SYSTEM_PROMPT}\n\nYou are generating structured CV content for Resumeefy. Use only facts supplied by the candidate. If a field is absent, leave that section empty. Do not invent metrics or dates. Tailor wording to the target role. Return concise, ATS-friendly content. qualityChecks should list the checks you performed, not new candidate facts.`
  );
}

const interviewQuestionSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["behavioral", "technical", "role", "company", "situational", "motivation"] },
          question: { type: "string" },
          whyItMatters: { type: "string" },
          followUp: { type: "string" },
          strongAnswerSignals: { type: "array", items: { type: "string" } },
        },
        required: ["id", "type", "question", "whyItMatters", "followUp", "strongAnswerSignals"],
      },
    },
  },
  required: ["questions"],
};

export type InterviewQuestion = {
  id: string;
  type: "behavioral" | "technical" | "role" | "company" | "situational" | "motivation";
  question: string;
  whyItMatters: string;
  followUp: string;
  strongAnswerSignals: string[];
};

export async function generateInterviewQuestions(input: Record<string, unknown>): Promise<{ questions: InterviewQuestion[] }> {
  return responsesJson(
    input,
    interviewQuestionSchema,
    "resumeefy_interview_questions",
    `You are Resumeefy's adaptive interview coach. Generate realistic, role-specific interview questions using the candidate profile, target role, company, seniority and any CV content supplied. Do not claim company-specific facts unless supplied by the user. Mix question types. Questions must be answerable and useful for practice. Make follow-ups natural and specific to the preceding question. Avoid generic filler.`
  );
}

const feedbackSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    betterAnswer: { type: "string" },
    followUp: { type: "string" },
  },
  required: ["score", "strengths", "improvements", "betterAnswer", "followUp"],
};

export type InterviewFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
  followUp: string;
};

export async function evaluateInterviewAnswer(input: Record<string, unknown>): Promise<InterviewFeedback> {
  return responsesJson(
    input,
    feedbackSchema,
    "resumeefy_interview_feedback",
    `You are Resumeefy's interview evaluator. Assess the candidate's answer against the supplied interview question, role and candidate context. Reward specific evidence, ownership, clear thinking, relevant technical or role knowledge, and measurable results only when genuinely provided. Do not invent facts in the betterAnswer. Give practical coaching, not generic praise. The betterAnswer is a concise example using only information from the candidate answer and supplied profile.`
  );
}

const desktopTaskSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    task: { type: "string" },
    software: { type: "array", items: { type: "string" } },
    checklist: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } },
    searchQuery: { type: "string" },
    otherResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { url: { type: "string" }, title: { type: "string" } },
        required: ["url", "title"],
      },
    },
    resultUrl: { type: "string" },
    resultTitle: { type: "string" },
    pageTitle: { type: "string" },
    pageBody: { type: "string" },
    copyValue: { type: "string" },
    copyLabel: { type: "string" },
    from: { type: "string" },
    fromEmail: { type: "string" },
    subject: { type: "string" },
    preview: { type: "string" },
    fullMessage: { type: "string" },
    replyTemplate: { type: "string" },
    sheetCols: { type: "array", items: { type: "string" } },
    sheetCandidate: { type: "string" },
    statusOptions: { type: "array", items: { type: "string" } },
  },
  required: [
    "name", "task", "software", "checklist", "searchQuery", "otherResults",
    "resultUrl", "resultTitle", "pageTitle", "pageBody", "copyValue", "copyLabel",
    "from", "fromEmail", "subject", "preview", "fullMessage", "replyTemplate",
    "sheetCols", "sheetCandidate", "statusOptions",
  ],
};

const desktopScenarioSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: { type: "array", minItems: 3, maxItems: 4, items: desktopTaskSchema },
  },
  required: ["tasks"],
};

export type DesktopScenarioAI = {
  tasks: Array<{
    name: string;
    task: string;
    software: string[];
    checklist: string[];
    searchQuery: string;
    otherResults: Array<{ url: string; title: string }>;
    resultUrl: string;
    resultTitle: string;
    pageTitle: string;
    pageBody: string;
    copyValue: string;
    copyLabel: string;
    from: string;
    fromEmail: string;
    subject: string;
    preview: string;
    fullMessage: string;
    replyTemplate: string;
    sheetCols: string[];
    sheetCandidate: string;
    statusOptions: string[];
  }>;
};

export async function generateDesktopScenario(input: Record<string, unknown>) {
  return responsesJson<DesktopScenarioAI>(
    input,
    desktopScenarioSchema,
    "resumeefy_desktop_sim",
    `Create 3 realistic workplace desktop simulation tasks tailored to the candidate target role and optional job description. Each task must test a different practical workflow and should be completable in 3 to 5 actions. Use a mix of browser research, email communication and spreadsheet/data handling, while mentioning real role relevant software such as Chrome, Gmail, Google Sheets, Excel, Slack, HubSpot, Jira, Salesforce, Power BI, Canva or similar when appropriate. Do not require paid software. Use fictional safe data. Make the instructions exceptionally clear: tell the learner exactly what outcome to produce and which app to open, but never auto open an app. Each task must have its own checklist, browser data, email data and spreadsheet data so the learner can complete it inside the simulation. Never invent candidate facts.`
  );
}

const courseSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    targetRole: { type: "string" },
    difficulty: { type: "string" },
    estimatedHours: { type: "number" },
    heroType: { type: "string", enum: ["svg", "animation", "illustration", "gradient"] },
    heroAsset: { type: "string" },
    modules: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          objective: { type: "string" },
          lesson: { type: "string" },
          quiz: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                answer: { type: "integer" },
              },
              required: ["question", "options", "answer"],
            },
          },
          project: { type: "string" },
          deadlineDays: { type: "integer" },
        },
        required: ["title", "objective", "lesson", "quiz", "project", "deadlineDays"],
      },
    },
    certificateRequiredCredits: { type: "integer" },
  },
  required: [
    "title", "description", "targetRole", "difficulty", "estimatedHours",
    "heroType", "heroAsset", "modules", "certificateRequiredCredits",
  ],
};

export type GeneratedCourse = {
  title: string;
  description: string;
  targetRole: string;
  difficulty: string;
  estimatedHours: number;
  heroType: string;
  heroAsset: string;
  modules: Array<{
    title: string;
    objective: string;
    lesson: string;
    quiz: Array<{ question: string; options: string[]; answer: number }>;
    project: string;
    deadlineDays: number;
  }>;
  certificateRequiredCredits: number;
};

export async function generateCourse(input: Record<string, unknown>) {
  return responsesJson<GeneratedCourse>(
    input,
    courseSchema,
    "resumeefy_course",
    `Design a short practical career course based on the candidate resume, target role and optional job description. Courses are free to study. Make lessons concise, practical and progressive. Include quizzes and a real project the learner can submit by a deadline. The certificate costs credits except the Resumeefy Certificate of Readiness, which is free. Never invent experience or qualifications. Keep lessons engaging and human.`
  );
}

const blogSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    topic: { type: "string" },
    coverType: { type: "string", enum: ["gradient", "svg", "illustration", "motion"] },
    slug: { type: "string" },
    seoTitle: { type: "string" },
    seoDescription: { type: "string" },
    primaryKeyword: { type: "string" },
    searchIntent: { type: "string", enum: ["informational", "commercial", "transactional", "navigational"] },
    recommendedService: { type: "string", enum: ["none", "resume_builder", "resume_analyzer", "interview", "assessment", "courses", "job_match", "desktop_sim"] },
    softCta: { type: "string" },
  },
  required: [
    "title", "excerpt", "content", "topic", "coverType", "slug",
    "seoTitle", "seoDescription", "primaryKeyword", "searchIntent",
    "recommendedService", "softCta",
  ],
};

export type GeneratedBlog = {
  title: string;
  excerpt: string;
  content: string;
  topic: string;
  coverType: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  searchIntent: string;
  recommendedService: string;
  softCta: string;
};

export async function generateBlog(input: Record<string, unknown>) {
  return responsesJson<GeneratedBlog>(
    input,
    blogSchema,
    "resumeefy_blog",
    `Write an original Resumeefy career article based on the supplied trend signals. The article must solve a real job seeker problem and satisfy search intent without sounding like SEO copy. Use a useful H1, logical H2/H3 headings, short paragraphs, concrete examples, and actionable steps. Prefer first hand or clearly explained practical guidance and never invent statistics. Do not copy source wording. Return markdown content between 700 and 1200 words when the topic supports it. Avoid em dashes and en dashes.

Marketing rule: Resumeefy has resume building, resume analysis, interview practice, readiness assessments, courses, job matching and role based workplace simulations. Every article must softly promote exactly one service that genuinely fits the reader's problem. Mention that service naturally once in the body as a practical solution, without interrupting the educational flow, then provide a gentle softCta at the end. Never use hype, fake urgency, exaggerated claims or hard selling. Do not make the article feel like an advert. Relevance examples: resume or ATS problems usually fit resume_builder or resume_analyzer; interview questions or interview confidence fit interview; broad readiness gaps fit assessment; learning or skill gaps fit courses; matching a resume to a job description fits job_match; practical workplace task preparation fits desktop_sim. If the article is informational and none of these genuinely helps, choose none.

SEO rule: choose one primary keyword based on likely search intent, avoid keyword stuffing, make the title specific, and make the article genuinely more useful than a generic summary. Include opportunities for internal links naturally through service references. Do not create doorway pages or near duplicate articles.`
  );
}

const qualitySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    ats: { type: "integer", minimum: 0, maximum: 100 },
    clarity: { type: "integer", minimum: 0, maximum: 100 },
    relevance: { type: "integer", minimum: 0, maximum: 100 },
    achievements: { type: "integer", minimum: 0, maximum: 100 },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
  },
  required: ["score", "ats", "clarity", "relevance", "achievements", "strengths", "improvements"],
};

export async function scoreResumeQuality(input: Record<string, unknown>) {
  return responsesJson(
    input,
    qualitySchema,
    "resumeefy_resume_quality",
    `Evaluate the supplied resume honestly for ATS readability, clarity, role relevance and evidence of achievement. Never invent missing information. Give concise actionable feedback.`
  );
}

const matchSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    matchScore: { type: "integer", minimum: 0, maximum: 100 },
    matchedSkills: { type: "array", items: { type: "string" } },
    weakAreas: { type: "array", items: { type: "string" } },
    missingKeywords: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    verdict: { type: "string" },
  },
  required: ["matchScore", "matchedSkills", "weakAreas", "missingKeywords", "recommendations", "verdict"],
};

export async function matchJob(input: Record<string, unknown>) {
  return responsesJson(
    input,
    matchSchema,
    "resumeefy_job_match",
    `Compare a resume with a job description. Identify genuine matches and gaps without inventing candidate experience. Keep recommendations practical and ATS aware.`
  );
}