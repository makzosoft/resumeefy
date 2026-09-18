export type MCQQuestion = {
  q: string;
  passage?: string;
  options: string[];
  correct: number;
  explain: string;
};

export const verbalQs: MCQQuestion[] = [
  {
    q: 'Choose the word closest in meaning to "Meticulous".',
    options: ["Careless", "Precise", "Hasty", "Vague"],
    correct: 1,
    explain: 'Meticulous means showing great attention to detail, so "Precise" is closest.',
  },
  {
    q: "What does the passage below suggest?",
    passage:
      '"Although the candidate lacked formal experience, her portfolio demonstrated exceptional problem-solving ability."',
    options: [
      "Experience matters more than skill",
      "Portfolios are irrelevant to hiring",
      "Skill can be shown without formal experience",
      "The candidate was rejected",
    ],
    correct: 2,
    explain: "The sentence contrasts a lack of experience with a strong portfolio, showing skill without formal experience.",
  },
  {
    q: "Complete the analogy: Interview is to Candidate as Exam is to ___.",
    options: ["Teacher", "Student", "School", "Classroom"],
    correct: 1,
    explain: "A candidate takes an interview the way a student takes an exam.",
  },
  {
    q: 'Choose the word closest in meaning to "Concise".',
    options: ["Wordy", "Brief", "Confusing", "Detailed"],
    correct: 1,
    explain: 'Concise means giving information clearly in a few words, so "Brief" is closest.',
  },
];

export const quantQs: MCQQuestion[] = [
  {
    q: "A company receives 240 applications and shortlists 15%. How many are shortlisted?",
    options: ["24", "36", "40", "15"],
    correct: 1,
    explain: "15% of 240 = 36.",
  },
  {
    q: "A candidate's interview score improved from 60 to 75. What is the percentage increase?",
    options: ["15%", "20%", "25%", "30%"],
    correct: 2,
    explain: "(75 minus 60) divided by 60 = 25%.",
  },
  {
    q: "3 interviewers each review 8 candidates in a day. How many total candidate-reviews happen?",
    options: ["11", "21", "24", "32"],
    correct: 2,
    explain: "3 times 8 = 24.",
  },
  {
    q: "Out of 80 candidates, 25% pass the first round. How many candidates move on?",
    options: ["15", "20", "25", "30"],
    correct: 1,
    explain: "25% of 80 = 20.",
  },
];

export const behavioralPrompts: string[] = [
  "Tell us about a time you handled a tight deadline.",
  "Describe a situation where you had to work with a difficult teammate.",
  "Tell us about a time you made a mistake at work or school. What happened?",
  "Describe a time you had to learn something new very quickly.",
];

export const roleFamilyQuestions: Record<
  "product" | "engineering" | "sales",
  { quant: MCQQuestion[]; behavioral: string[]; verbal?: MCQQuestion[]; sjt?: MCQQuestion[] }
> = {
  product: {
    quant: [
      {
        q: "A feature is used by 12% of your 50,000 monthly active users. How many users is that?",
        options: ["5,000", "6,000", "600", "60,000"],
        correct: 1,
        explain: "12% of 50,000 = 6,000.",
      },
    ],
    behavioral: ["Tell us about a time you had to say no to a feature a stakeholder really wanted."],
    verbal: [
      { q: "A product team reports that activation rose after onboarding was shortened, but the report does not compare retention. What can you conclude?", options: ["Shorter onboarding definitely improves retention", "Activation improved after the change, but retention cannot be determined", "Retention fell after the change", "The onboarding change had no measurable effect"], correct: 1, explain: "The report gives evidence about activation only. It does not provide enough information to conclude anything about retention." },
      { q: "A stakeholder says a feature is urgent because three enterprise customers requested it. Which conclusion is justified?", options: ["All customers want the feature", "The feature will increase revenue", "At least three enterprise customers requested the feature", "The feature should be built immediately"], correct: 2, explain: "Only the stated fact about three enterprise customers is supported; the other conclusions require additional evidence." },
    ],
    sjt: [
      { q: "Engineering says a request will take 3x longer than the business expects. What do you do?", options: ["Promise the original deadline anyway", "Push engineering to cut corners", "Get both sides in a room to align on scope and a realistic date", "Escalate straight to a director without talking to engineering first"], correct: 2, explain: "Aligning both sides on scope and a realistic date is the core of the PM job in moments like this." },
      { q: "Usage data contradicts a senior stakeholder's preferred product direction. What is the strongest next step?", options: ["Ignore the data because the stakeholder is senior", "Present the evidence, explain its limits, and propose a small test", "Choose the opposite direction immediately", "Remove the data from the presentation"], correct: 1, explain: "Good product decisions use evidence while acknowledging uncertainty and testing important assumptions." },
    ],
  },
  engineering: {
    quant: [
      {
        q: "An API response time is 240ms and you reduce it by 25%. What is the new response time?",
        options: ["180ms", "200ms", "210ms", "220ms"],
        correct: 0,
        explain: "240 minus 25% of 240 (60) = 180ms.",
      },
    ],
    behavioral: ["Tell us about a time you had to debug a critical issue under real time pressure."],
    verbal: [
      { q: "An incident report says the outage affected 4% of requests for 18 minutes. The report does not state the root cause. What is supported?", options: ["The outage was caused by a database failure", "4% of requests were affected for 18 minutes", "The outage lasted several hours", "The root cause was identified before recovery"], correct: 1, explain: "Only the duration and percentage affected are stated. The root cause is not given." },
      { q: "A release passed automated tests but failed in production. Which statement follows?", options: ["Automated tests are useless", "The production failure proves the code was never tested", "The automated tests did not catch the production issue", "The deployment process caused the failure"], correct: 2, explain: "A production failure after tests pass means the tests did not detect that particular issue. It does not prove why it happened." },
    ],
    sjt: [
      { q: "You spot a bug in a teammate's pull request right before a release deadline. What do you do?", options: ["Merge it anyway to hit the deadline", "Flag it clearly with a suggested fix, even if it delays release", "Fix it yourself without telling them", "Ignore it since it is not your code"], correct: 1, explain: "Flagging it clearly, with a fix in hand, protects the release without stepping on your teammate." },
      { q: "A production error is intermittent and you cannot reproduce it locally. What is the best next step?", options: ["Declare it harmless", "Add evidence gathering and monitoring while investigating safely", "Deploy an untested fix immediately", "Delete the error logs to reduce noise"], correct: 1, explain: "When reproduction is difficult, reliable logs, monitoring and controlled investigation give you evidence without creating additional risk." },
    ],
  },
  sales: {
    quant: [
      {
        q: "You close 8 deals out of 40 leads. What is your conversion rate?",
        options: ["15%", "20%", "25%", "30%"],
        correct: 1,
        explain: "8 divided by 40 = 20%.",
      },
    ],
    behavioral: ["Tell us about a deal you lost. What did you learn from it?"],
    verbal: [
      { q: "A prospect says they value the product but has not approved the budget. What can you conclude?", options: ["The prospect will definitely buy", "The prospect dislikes the product", "The prospect sees value but budget approval is unresolved", "The prospect has chosen a competitor"], correct: 2, explain: "The statement supports interest in the product while leaving the purchasing decision unresolved." },
      { q: "A sales report shows response rates improved after follow-up emails were personalised. What is the safest conclusion?", options: ["Personalisation caused every increase", "Response rates improved after personalised follow-ups were introduced", "Personalised emails always increase sales", "No other factor could have affected response rates"], correct: 1, explain: "The timing and reported relationship are supported, but the report does not prove that personalisation was the only cause." },
    ],
    sjt: [
      { q: "A prospect asks for a discount your company does not usually offer. What do you do?", options: ["Agree immediately to close the deal", "Say no and end the conversation", "Understand what is driving the request, then see what you can genuinely offer", "Ignore the request and change the subject"], correct: 2, explain: "Understanding the real driver behind a discount request usually uncovers a better solution than a blanket yes or no." },
      { q: "A prospect asks you a technical question you cannot answer confidently. What is the best response?", options: ["Guess so the call keeps moving", "Avoid the question", "Be transparent, confirm the answer with the right team, and follow up", "Tell the prospect they should already know"], correct: 2, explain: "Accuracy builds more trust than guessing. Confirming with the right team keeps the conversation credible." },
    ],
  },
};

export function roleFamily(targetRole?: string): "product" | "engineering" | "sales" | "general" {
  const r = (targetRole || "").toLowerCase();
  if (/product|pm\b/.test(r)) return "product";
  if (/engineer|develop|software|data|technical/.test(r)) return "engineering";
  if (/sales|account|business dev/.test(r)) return "sales";
  return "general";
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function targetedVerbal(targetRole: string | undefined, count: number): MCQQuestion[] {
  const family = roleFamily(targetRole);
  const extra = family !== "general" ? (roleFamilyQuestions[family].verbal ?? []) : [];
  // Guarantee role relevance when a role-specific pool exists, then fill from the general bank.
  const roleSet = pickRandom(extra, Math.min(extra.length, Math.max(1, Math.ceil(count / 2))));
  const remaining = Math.max(0, count - roleSet.length);
  return [...roleSet, ...pickRandom(verbalQs, remaining)];
}

export function targetedQuant(targetRole: string | undefined, count: number): MCQQuestion[] {
  const family = roleFamily(targetRole);
  const extra = family !== "general" ? roleFamilyQuestions[family].quant : [];
  const roleSet = pickRandom(extra, Math.min(extra.length, Math.max(1, Math.ceil(count / 2))));
  return [...roleSet, ...pickRandom(quantQs, Math.max(0, count - roleSet.length))];
}

export function targetedBehavioral(targetRole: string | undefined, count: number): string[] {
  const family = roleFamily(targetRole);
  const extra = family !== "general" ? roleFamilyQuestions[family].behavioral : [];
  return pickRandom([...extra, ...behavioralPrompts], count);
}

export function targetedSjt(targetRole: string | undefined, count: number): MCQQuestion[] {
  const family = roleFamily(targetRole);
  const extra = family !== "general" ? (roleFamilyQuestions[family].sjt ?? []) : [];
  const roleSet = pickRandom(extra, Math.min(extra.length, Math.max(1, Math.ceil(count / 2))));
  return [...roleSet, ...pickRandom(sjtQs, Math.max(0, count - roleSet.length))];
}

export function analyzeStarAnswer(text: string): { score: number; message: string; tone: "good" | "partial" } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasResult = /(result|achieved|led to|outcome|improved|reduced|increased|delivered)/i.test(text);
  if (words >= 60 && hasResult) {
    return { score: 90, tone: "good", message: "Strong STAR structure, clear situation, action and a measurable result." };
  }
  if (words >= 30) {
    return { score: 68, tone: "partial", message: "Decent start, add a specific, measurable result to strengthen this answer." };
  }
  return { score: 45, tone: "partial", message: "Too brief, try expanding on the situation, your actions, and the result." };
}

export function analyzeResumeText(text: string): { score: number; notes: string[] } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasVerbs = /(led|built|managed|launched|improved|delivered|created|achieved|designed|increased|reduced|coordinated|trained)/i.test(
    text
  );
  const hasNumbers = /\d/.test(text);
  let score = 45;
  if (words >= 40) score += 15;
  if (hasVerbs) score += 20;
  if (hasNumbers) score += 18;
  score = Math.min(98, score);
  return {
    score,
    notes: [
      hasVerbs ? "Strong action verbs detected" : 'Try opening lines with action verbs like "Led", "Built", "Improved"',
      hasNumbers ? "Quantified impact found, numbers stand out to recruiters" : "Add a measurable number, a percentage, a naira figure, time saved",
      words >= 40 ? "Good level of detail" : "A little brief, aim for 40+ words so it reads as a fuller picture",
    ],
  };
}

export type RoleChoice = { text: string; quality: "poor" | "ok" | "best"; outcome: string };
export type RoleScenario = { scenario: string; choices: RoleChoice[] };

export const sjtQs: MCQQuestion[] = [
  { q: "A teammate takes credit for your idea in a meeting. What is the best response?", options: ["Confront them publicly during the meeting", "Say nothing and let it go", "Calmly clarify your contribution after the meeting", "Complain to other colleagues"], correct: 2, explain: "Addressing it calmly and privately protects the relationship while still setting the record straight." },
  { q: "You notice a mistake in a report your manager already approved. What do you do?", options: ["Fix it silently without telling anyone", "Flag it to your manager immediately with a suggested fix", "Wait for someone else to notice", "Point it out publicly in the next team meeting"], correct: 1, explain: "Raising it directly and proactively, with a solution, is the most professional response." },
  { q: "You are given two urgent tasks with the same deadline by two different people. What do you do first?", options: ["Pick whichever seems easier", "Do both at once, splitting your time evenly", "Clarify priority with both people as early as possible", "Ignore one until the other is done"], correct: 2, explain: "Clarifying priority early prevents wasted effort and manages expectations on both sides." },
  { q: "A new tool is introduced at work and you find it confusing. What is the best approach?", options: ["Avoid using it and stick to the old way", "Ask a colleague or check documentation for help", "Complain that the change was unnecessary", "Guess your way through it silently"], correct: 1, explain: "Proactively seeking help or documentation is the fastest, most professional path to competence." },
];

export const ROLE_SCENARIOS: Record<"product" | "engineering" | "sales" | "general", RoleScenario> = {
  product: { scenario: "You're the Product Manager for {company}'s app. A key stakeholder emails asking why the new feature launch is delayed.", choices: [
    { text: "That's not really my fault, engineering has been slow.", quality: "poor", outcome: "This response shifts blame and damages trust. Stakeholders remember how you communicate under pressure more than the delay itself." },
    { text: "We hit an integration blocker with the payments API. Here's the revised timeline and what we're doing to prevent further slippage.", quality: "best", outcome: "Great response, transparent, specific, and forward-looking. This is exactly what builds stakeholder confidence during a delay." },
    { text: "I'll get back to you once I have more information.", quality: "ok", outcome: "Acceptable, but stakeholders generally want at least a partial answer immediately. Consider sharing what you do know first." },
  ] },
  engineering: { scenario: "You're a Software Engineer at {company}. Your team lead asks why a critical bug fix is taking longer than estimated.", choices: [
    { text: "The estimate was unrealistic to begin with, that's not on me.", quality: "poor", outcome: "Deflecting blame on estimates erodes trust. Even fair complaints about estimates land better paired with a concrete update." },
    { text: "The root cause was deeper than expected, it touches three services. Here's what's fixed, what's left, and a revised ETA.", quality: "best", outcome: "This is exactly the kind of specific, ownership-driven update that keeps a team lead confident even when timelines slip." },
    { text: "Almost done, should be soon.", quality: "ok", outcome: "Vague reassurance buys a little time but doesn't build confidence. A specific ETA and blocker would land better." },
  ] },
  sales: { scenario: "You're an Account Executive at {company}. A prospect emails saying they're considering a competitor after your proposal.", choices: [
    { text: "Just match the competitor's price without asking why.", quality: "poor", outcome: "Racing to discount without understanding the real objection often loses the deal anyway, and erodes margin." },
    { text: "Ask what's driving the consideration, then address the specific gap with a tailored follow-up.", quality: "best", outcome: "Understanding the real objection before responding is what separates strong account executives from order-takers." },
    { text: "Send a generic follow-up restating your original pitch.", quality: "ok", outcome: "Repeating the same pitch without addressing their new concern rarely changes the outcome." },
  ] },
  general: { scenario: "You're starting a new role at {company}. In your first week, a senior colleague gives you feedback that feels overly critical in front of others.", choices: [
    { text: "Get visibly defensive and explain why they're wrong in the moment.", quality: "poor", outcome: "Public defensiveness, even when you have a point, tends to damage first impressions more than the original feedback did." },
    { text: "Stay composed, thank them, and ask to discuss the details privately afterward.", quality: "best", outcome: "Staying composed in the moment and following up privately shows maturity, exactly what a first week should demonstrate." },
    { text: "Say nothing and quietly avoid that colleague going forward.", quality: "ok", outcome: "Avoidance protects your feelings short-term but doesn't resolve anything or build the relationship." },
  ] },
};

export type DesktopScenario = {
  name: string; task: string; checklist: string[]; searchQuery: string; resultUrl: string; resultTitle: string;
  otherResults: { url: string; title: string }[]; pageTitle: string; pageBody: string; copyValue: string; copyLabel: string;
  from: string; fromEmail: string; subject: string; preview: string; fullMessage: string; replyTemplate: string;
  sheetCols: string[]; sheetCandidate: string; statusOptions: string[];
};
export const SCENARIOS: DesktopScenario[] = [
  { name: "Candidate Reply", task: "A candidate has emailed asking about their application status. Find the support email, reply using it, then log your response, just like a real workday.", checklist: ["Click the Browser icon and search for the support email", "Open the result, then click Copy Email", "Open Mail, click the message, hit Reply, then Send", "Open Sheets, set Status to Responded, click Paste Timer, then Save", "Click Submit Task below to finish"], searchQuery: "resumeefy support email", resultUrl: "resumeefy.com/support", resultTitle: "Contact & Support — Resumeefy", otherResults: [{ url: "ng.linkedin.com/company/resumeefy", title: "Resumeefy | LinkedIn" }, { url: "resumeefy.com/careers", title: "Careers at Resumeefy" }], pageTitle: "Contact & Support", pageBody: "Our support team typically responds within 24 hours.", copyValue: "support@resumeefy.ng", copyLabel: "Copy Email", from: "Ada O.", fromEmail: "ada@student.ng", subject: "Application status?", preview: "Hi, I submitted my application last week and haven't heard back...", fullMessage: "Hi, I submitted my application last week and haven't heard back. Could you confirm receipt?", replyTemplate: "Hi Ada, thanks for reaching out — I can confirm we've received your application and it's currently under review. We'll follow up within 5 business days.", sheetCols: ["Candidate", "Status", "Response Time"], sheetCandidate: "Ada O.", statusOptions: ["Pending", "Responded"] },
  { name: "Scorecard Log", task: "A hiring manager needs the interview scorecard reference before your next panel. Find the scoring rubric, confirm it by email, then log today's session.", checklist: ["Click the Browser icon and search for the rubric", "Open the result, then click Copy Reference", "Open Mail, click the message, hit Reply, then Send", "Open Sheets, set Status to Logged, click Paste Timer, then Save", "Click Submit Task below to finish"], searchQuery: "resumeefy interview rubric", resultUrl: "resumeefy.com/rubric", resultTitle: "Interview Scoring Rubric v2 — Resumeefy", otherResults: [{ url: "resumeefy.com/blog/star-method", title: "Using the STAR Method — Resumeefy Blog" }, { url: "resumeefy.com/careers", title: "Careers at Resumeefy" }], pageTitle: "Interview Scoring Rubric", pageBody: "Score each candidate 1–5 on Communication, Technical Skill, and Culture Fit.", copyValue: "Rubric v2 (1–5 scale)", copyLabel: "Copy Reference", from: "Tunde K.", fromEmail: "tunde@resumeefy.ng", subject: "Scorecard for today's panel?", preview: "Hi, could you confirm which rubric version we're using...", fullMessage: "Hi, could you confirm which rubric version we're using for today's interviews? Want to make sure we're all scoring consistently.", replyTemplate: "Hi Tunde, confirming we're using Rubric v2 (1 to 5 scale) for today's panel: Communication, Technical Skill, and Culture Fit.", sheetCols: ["Candidate", "Status", "Session Time"], sheetCandidate: "Femi A.", statusOptions: ["Pending", "Logged"] },
];
