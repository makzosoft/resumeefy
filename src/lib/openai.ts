import { RESUMEEFY_CV_SYSTEM_PROMPT } from "./resume-rules";
import { DEMO_MODE } from "./demo";

const OPENAI_URL = "https://api.openai.com/v1/responses";

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local.");
  return {
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
  };
}

type JsonSchema = Record<string, unknown>;

async function responsesJson<T>(input: unknown, schema: JsonSchema, schemaName: string, instructions: string): Promise<T> {
  if (DEMO_MODE) {
    const role = String((input as any)?.targetRole || "Professional");
    const demo: Record<string, unknown> = {
      resumeefy_resume: { summary: `Results focused ${role} professional profile prepared from the supplied information.`, experience: [], education: [], certifications: [], projects: [], skills: [role, "Communication", "Problem solving"], qualityChecks: ["ATS readable", "Truthfulness preserved", "Role relevance checked"] },
      resumeefy_interview_questions: { questions: ["Tell me about yourself and why this role interests you?", "Describe a difficult problem you solved.", "How would you prioritize competing deadlines?", "What would you do if you disagreed with a teammate?", "How do you measure the quality of your work?"].map((question, i) => ({ id: `demo-q-${i+1}`, type: i===0?"motivation":i===2?"situational":"behavioral", question, whyItMatters:"Tests practical readiness and communication.", followUp:"What was your reasoning?", strongAnswerSignals:["Specific example", "Clear reasoning", "Concrete outcome"] })) },
      resumeefy_interview_feedback: { score: 78, strengths:["Clear structure","Relevant reasoning"], improvements:["Add a concrete example","Finish with a measurable outcome when available"], betterAnswer:"A stronger answer would use a concise situation, action and result structure while staying faithful to your experience.", followUp:"What was the measurable result?" },
      resumeefy_desktop_sim: { tasks: [1,2,3].map((n) => ({ name:["Research and summarize","Handle a professional email","Update a candidate tracker"][n-1], task:`Complete workplace task ${n} for a ${role} workflow. Open the named app yourself and follow the brief.`, software:[["Chrome"],["Gmail"],["Google Sheets"]][n-1], checklist:["Open the requested app","Complete the specified action","Check your work"], searchQuery:"Resumeefy demo research", otherResults:[{url:"https://example.com",title:"Demo result"}], resultUrl:"https://example.com", resultTitle:"Demo result", pageTitle:"Demo workplace page", pageBody:"Fictional safe workplace data for demonstration.", copyValue:"Demo value", copyLabel:"Copy this value", from:"Demo Recruiter", fromEmail:"recruiter@example.com", subject:"Demo workplace task", preview:"Please review the attached request.", fullMessage:"Please review this fictional workplace request and respond clearly.", replyTemplate:"Thanks. I reviewed the request and completed the required action.", sheetCols:["Candidate","Status"], sheetCandidate:"Alex Demo", statusOptions:["Review","Shortlist","Hold"] })) },
      resumeefy_course: { title:`${role} Launchpad`, description:"A short practical demo course with lessons, quizzes and a project.", targetRole:role, difficulty:"Beginner friendly", estimatedHours:4, heroType:"gradient", heroAsset:"", modules:[1,2,3].map(n=>({title:`Module ${n}`,objective:"Build a practical skill",lesson:"Learn the concept, apply it to a realistic workplace example, then review your result.",quiz:[{question:"What should you do first?",options:["Understand the brief","Guess the answer","Skip the task"],answer:0}],project:"Complete a small practical task and explain your approach.",deadlineDays:3})), certificateRequiredCredits:40 },
      resumeefy_blog: { 
        title: "How to Prepare for Your Next Career Opportunity", 
        excerpt: "Practical steps for getting your application and interview readiness in shape.", 
        content:`## Start with the role

Read the job description carefully and identify the skills the employer actually needs.

## Make your evidence easy to find

Use clear examples from your real experience. Avoid adding claims you cannot support.

## Practise before the interview

A few realistic practice questions can reveal where your answers need more structure.

## Keep improving

Treat each application as feedback. Review what worked, improve what did not, and keep your materials aligned with the role.`, 
        topic: "career preparation", 
        coverType: "gradient", 
        slug: "demo-career-preparation", 
        seoTitle: "How to Prepare for Your Next Career Opportunity", 
        seoDescription: "Practical career preparation steps for job seekers.", 
        primaryKeyword: "career preparation", 
        searchIntent: "informational", 
        recommendedService: "interview", 
        softCta: "When you are ready to practise, Resumeefy can help you rehearse realistic interview questions." 
      },
      resumeefy_resume_quality: { score:78, ats:82, clarity:76, relevance:75, achievements:70, strengths:["Clear structure","Readable sections"], improvements:["Add evidence where available","Tailor keywords to the target role"] },
      resumeefy_job_match: { matchScore:76, matchedSkills:["Communication","Problem solving"], weakAreas:["Role specific evidence"], missingKeywords:["Relevant tools"], recommendations:["Tailor the summary","Add supported evidence from real experience"], verdict:"Promising match with room for stronger role specific evidence." }
    };
    return (demo[schemaName] ?? {}) as T;
  }
  const { apiKey, model } = getConfig();
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input: JSON.stringify(input),
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 500)}`);
  }
  const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "";
  if (!text) throw new Error("OpenAI returned an empty response.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("OpenAI returned invalid structured JSON.");
  }
}

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

const desktopTaskSchema: JsonSchema = {type:"object",additionalProperties:false,properties:{name:{type:"string"},task:{type:"string"},software:{type:"array",items:{type:"string"}},checklist:{type:"array",minItems:3,maxItems:4,items:{type:"string"}},searchQuery:{type:"string"},otherResults:{type:"array",items:{type:"object",additionalProperties:false,properties:{url:{type:"string"},title:{type:"string"}},required:["url","title"]}},resultUrl:{type:"string"},resultTitle:{type:"string"},pageTitle:{type:"string"},pageBody:{type:"string"},copyValue:{type:"string"},copyLabel:{type:"string"},from:{type:"string"},fromEmail:{type:"string"},subject:{type:"string"},preview:{type:"string"},fullMessage:{type:"string"},replyTemplate:{type:"string"},sheetCols:{type:"array",items:{type:"string"}},sheetCandidate:{type:"string"},statusOptions:{type:"array",items:{type:"string"}}},required:["name","task","software","checklist","searchQuery","otherResults","resultUrl","resultTitle","pageTitle","pageBody","copyValue","copyLabel","from","fromEmail","subject","preview","fullMessage","replyTemplate","sheetCols","sheetCandidate","statusOptions"]};

const desktopScenarioSchema: JsonSchema = {type:"object",additionalProperties:false,properties:{tasks:{type:"array",minItems:3,maxItems:4,items:desktopTaskSchema}},required:["tasks"]};

export type DesktopScenarioAI = {tasks:Array<{name:string;task:string;software:string[];checklist:string[];searchQuery:string;otherResults:Array<{url:string;title:string}>;resultUrl:string;resultTitle:string;pageTitle:string;pageBody:string;copyValue:string;copyLabel:string;from:string;fromEmail:string;subject:string;preview:string;fullMessage:string;replyTemplate:string;sheetCols:string[];sheetCandidate:string;statusOptions:string[]}>};

export async function generateDesktopScenario(input: Record<string, unknown>) {
  return responsesJson<DesktopScenarioAI>(input, desktopScenarioSchema, "resumeefy_desktop_sim", `Create 3 realistic workplace desktop simulation tasks tailored to the candidate target role and optional job description. Each task must test a different practical workflow and should be completable in 3 to 5 actions. Use a mix of browser research, email communication and spreadsheet/data handling, while mentioning real role relevant software such as Chrome, Gmail, Google Sheets, Excel, Slack, HubSpot, Jira, Salesforce, Power BI, Canva or similar when appropriate. Do not require paid software. Use fictional safe data. Make the instructions exceptionally clear: tell the learner exactly what outcome to produce and which app to open, but never auto open an app. Each task must have its own checklist, browser data, email data and spreadsheet data so the learner can complete it inside the simulation. Never invent candidate facts.`);
}

const courseSchema: JsonSchema = { type:"object", additionalProperties:false, properties:{ title:{type:"string"},description:{type:"string"},targetRole:{type:"string"},difficulty:{type:"string"},estimatedHours:{type:"number"},heroType:{type:"string",enum:["svg","animation","illustration","gradient"]},heroAsset:{type:"string"}, modules:{type:"array",minItems:3,maxItems:6,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},objective:{type:"string"},lesson:{type:"string"},quiz:{type:"array",items:{type:"object",additionalProperties:false,properties:{question:{type:"string"},options:{type:"array",items:{type:"string"}},answer:{type:"integer"}},required:["question","options","answer"]}},project:{type:"string"},deadlineDays:{type:"integer"}},required:["title","objective","lesson","quiz","project","deadlineDays"]}},certificateRequiredCredits:{type:"integer"}},required:["title","description","targetRole","difficulty","estimatedHours","heroType","heroAsset","modules","certificateRequiredCredits"] };

export type GeneratedCourse = {title:string;description:string;targetRole:string;difficulty:string;estimatedHours:number;heroType:string;heroAsset:string;modules:Array<{title:string;objective:string;lesson:string;quiz:Array<{question:string;options:string[];answer:number}>;project:string;deadlineDays:number}>;certificateRequiredCredits:number};

export async function generateCourse(input: Record<string, unknown>) { return responsesJson<GeneratedCourse>(input, courseSchema, "resumeefy_course", `Design a short practical career course based on the candidate resume, target role and optional job description. Courses are free to study. Make lessons concise, practical and progressive. Include quizzes and a real project the learner can submit by a deadline. The certificate costs credits except the Resumeefy Certificate of Readiness, which is free. Never invent experience or qualifications. Keep lessons engaging and human.`); }

const blogSchema: JsonSchema = {type:"object",additionalProperties:false,properties:{title:{type:"string"},excerpt:{type:"string"},content:{type:"string"},topic:{type:"string"},coverType:{type:"string",enum:["gradient","svg","illustration","motion"]},slug:{type:"string"},seoTitle:{type:"string"},seoDescription:{type:"string"},primaryKeyword:{type:"string"},searchIntent:{type:"string",enum:["informational","commercial","transactional","navigational"]},recommendedService:{type:"string",enum:["none","resume_builder","resume_analyzer","interview","assessment","courses","job_match","desktop_sim"]},softCta:{type:"string"}},required:["title","excerpt","content","topic","coverType","slug","seoTitle","seoDescription","primaryKeyword","searchIntent","recommendedService","softCta"]};

export type GeneratedBlog = {title:string;excerpt:string;content:string;topic:string;coverType:string;slug:string;seoTitle:string;seoDescription:string;primaryKeyword:string;searchIntent:string;recommendedService:string;softCta:string};

export async function generateBlog(input: Record<string, unknown>) { return responsesJson<GeneratedBlog>(input, blogSchema, "resumeefy_blog", `Write an original Resumeefy career article based on the supplied trend signals. The article must solve a real job seeker problem and satisfy search intent without sounding like SEO copy. Use a useful H1, logical H2/H3 headings, short paragraphs, concrete examples, and actionable steps. Prefer first hand or clearly explained practical guidance and never invent statistics. Do not copy source wording. Return markdown content between 700 and 1200 words when the topic supports it. Avoid em dashes and en dashes.

Marketing rule: Resumeefy has resume building, resume analysis, interview practice, readiness assessments, courses, job matching and role based workplace simulations. Every article must softly promote exactly one service that genuinely fits the reader's problem. Mention that service naturally once in the body as a practical solution, without interrupting the educational flow, then provide a gentle softCta at the end. Never use hype, fake urgency, exaggerated claims or hard selling. Do not make the article feel like an advert. Relevance examples: resume or ATS problems usually fit resume_builder or resume_analyzer; interview questions or interview confidence fit interview; broad readiness gaps fit assessment; learning or skill gaps fit courses; matching a resume to a job description fits job_match; practical workplace task preparation fits desktop_sim. If the article is informational and none of these genuinely helps, choose none.

SEO rule: choose one primary keyword based on likely search intent, avoid keyword stuffing, make the title specific, and make the article genuinely more useful than a generic summary. Include opportunities for internal links naturally through service references. Do not create doorway pages or near duplicate articles.`); }

const qualitySchema: JsonSchema={type:"object",additionalProperties:false,properties:{score:{type:"integer",minimum:0,maximum:100},ats:{type:"integer",minimum:0,maximum:100},clarity:{type:"integer",minimum:0,maximum:100},relevance:{type:"integer",minimum:0,maximum:100},achievements:{type:"integer",minimum:0,maximum:100},strengths:{type:"array",items:{type:"string"}},improvements:{type:"array",items:{type:"string"}}},required:["score","ats","clarity","relevance","achievements","strengths","improvements"]};

export async function scoreResumeQuality(input:Record<string,unknown>){return responsesJson(input,qualitySchema,"resumeefy_resume_quality",`Evaluate the supplied resume honestly for ATS readability, clarity, role relevance and evidence of achievement. Never invent missing information. Give concise actionable feedback.`);}

const matchSchema:JsonSchema={type:"object",additionalProperties:false,properties:{matchScore:{type:"integer",minimum:0,maximum:100},matchedSkills:{type:"array",items:{type:"string"}},weakAreas:{type:"array",items:{type:"string"}},missingKeywords:{type:"array",items:{type:"string"}},recommendations:{type:"array",items:{type:"string"}},verdict:{type:"string"}},required:["matchScore","matchedSkills","weakAreas","missingKeywords","recommendations","verdict"]};

export async function matchJob(input:Record<string,unknown>){return responsesJson(input,matchSchema,"resumeefy_job_match",`Compare a resume with a job description. Identify genuine matches and gaps without inventing candidate experience. Keep recommendations practical and ATS aware.`);}