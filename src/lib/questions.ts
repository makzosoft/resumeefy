export type MCQQuestion = {
  q: string;
  passage?: string;
  options: string[];
  correct: number;
  explain: string;
};

export const verbalQs: MCQQuestion[] = [
  { q: 'Choose the word closest in meaning to "Meticulous".', options: ["Careless", "Precise", "Hasty", "Vague"], correct: 1, explain: 'Meticulous means showing great attention to detail, so "Precise" is closest.' },
  { q: "What does the passage below suggest?", passage: '"Although the candidate lacked formal experience, her portfolio demonstrated exceptional problem-solving ability."', options: ["Experience matters more than skill", "Portfolios are irrelevant to hiring", "Skill can be shown without formal experience", "The candidate was rejected"], correct: 2, explain: "The sentence contrasts a lack of experience with a strong portfolio, showing skill without formal experience." },
  { q: "Complete the analogy: Interview is to Candidate as Exam is to ___.", options: ["Teacher", "Student", "School", "Classroom"], correct: 1, explain: "A candidate takes an interview the way a student takes an exam." },
  { q: 'Choose the word closest in meaning to "Concise".', options: ["Wordy", "Brief", "Confusing", "Detailed"], correct: 1, explain: 'Concise means giving information clearly in a few words, so "Brief" is closest.' },
  { q: 'Choose the word closest in meaning to "Diligent".', options: ["Lazy", "Hardworking", "Careless", "Slow"], correct: 1, explain: "Diligent means showing care and effort in one's work, closest to hardworking." },
  { q: 'Choose the word most nearly OPPOSITE to "Reluctant".', options: ["Hesitant", "Willing", "Unsure", "Tired"], correct: 1, explain: "Reluctant means unwilling, so its opposite is willing." },
  { q: "Complete the analogy: Author is to Book as Architect is to ___.", options: ["Hammer", "Building", "City", "Contractor"], correct: 1, explain: "An author creates a book the way an architect creates a building." },
  { q: "Complete the analogy: Doctor is to Patient as Teacher is to ___.", options: ["School", "Lesson", "Student", "Classroom"], correct: 2, explain: "A doctor treats a patient the way a teacher instructs a student." },
  { q: "What does the passage below suggest?", passage: '"Despite the tight budget, the marketing team reached its quarterly target by focusing spend on the two channels with the highest historic return."', options: ["The budget was actually large", "Focused spending helped the team hit its target despite a constraint", "The team missed its target", "All channels received equal spending"], correct: 1, explain: "The passage credits a targeted spending strategy for hitting the goal despite the tight budget, not a large budget or equal spending." },
  { q: "What does the passage below suggest?", passage: '"The new hire asked clarifying questions before starting the task, rather than guessing at the requirements."', options: ["The new hire was unqualified", "Asking questions is discouraged", "The new hire prioritized understanding the task correctly over speed", "The task had no requirements"], correct: 2, explain: "Choosing to clarify before starting shows a preference for accuracy over guessing, which the passage frames positively." },
  { q: 'Choose the word closest in meaning to "Candid".', options: ["Secretive", "Honest", "Formal", "Nervous"], correct: 1, explain: "Candid means truthful and straightforward, closest to honest." },
  { q: 'Choose the word most nearly OPPOSITE to "Ambiguous".', options: ["Unclear", "Clear", "Complex", "Long"], correct: 1, explain: "Ambiguous means open to more than one interpretation, so its opposite is clear." },
  { q: "Complete the analogy: Key is to Lock as Password is to ___.", options: ["Computer", "Account", "Internet", "Screen"], correct: 1, explain: "A key opens a lock the way a password grants access to an account." },
  { q: "What does the passage below suggest?", passage: '"Sales rose in every region except the one where the new pricing model was tested first."', options: ["The new pricing model helped sales everywhere", "Something about the tested region may be linked to weaker sales", "Pricing has no effect on sales", "Sales fell in every region"], correct: 1, explain: "The exception in the one region where pricing was tested is the detail worth investigating, though the passage does not prove pricing caused it." },
  { q: 'Choose the word closest in meaning to "Versatile".', options: ["Limited", "Adaptable", "Stubborn", "Slow"], correct: 1, explain: "Versatile means able to adapt to many different functions, closest to adaptable." },
  { q: "Complete the analogy: Chef is to Kitchen as Pilot is to ___.", options: ["Airport", "Cockpit", "Runway", "Sky"], correct: 1, explain: "A chef works from a kitchen the way a pilot operates from a cockpit." },
  { q: 'Choose the word most nearly OPPOSITE to "Transparent" (as used to describe communication).', options: ["Open", "Honest", "Evasive", "Clear"], correct: 2, explain: "Transparent communication is open and clear, so its opposite is evasive." },
  { q: "What does the passage below suggest?", passage: '"The candidate answered every technical question correctly but struggled to explain her reasoning to a non-technical interviewer."', options: ["She lacks technical knowledge", "She has strong technical knowledge but may need to work on explaining it simply", "The interview was unfair", "Non-technical interviewers should not ask technical questions"], correct: 1, explain: "Correct answers show technical knowledge; struggling to simplify explanations points to a communication gap, not a knowledge gap." },
];

export const quantQs: MCQQuestion[] = [
  { q: "A company receives 240 applications and shortlists 15%. How many are shortlisted?", options: ["24", "36", "40", "15"], correct: 1, explain: "15% of 240 = 36." },
  { q: "A candidate's interview score improved from 60 to 75. What is the percentage increase?", options: ["15%", "20%", "25%", "30%"], correct: 2, explain: "(75 minus 60) divided by 60 = 25%." },
  { q: "3 interviewers each review 8 candidates in a day. How many total candidate-reviews happen?", options: ["11", "21", "24", "32"], correct: 2, explain: "3 times 8 = 24." },
  { q: "Out of 80 candidates, 25% pass the first round. How many candidates move on?", options: ["15", "20", "25", "30"], correct: 1, explain: "25% of 80 = 20." },
  { q: "A team completes a project in 12 days working 5 hours a day. How many total hours is that?", options: ["48", "60", "72", "84"], correct: 1, explain: "12 times 5 = 60 hours." },
  { q: "A recruiter schedules interviews at 45-minute intervals starting at 9:00am. What time does the 5th interview start?", options: ["11:00am", "11:45am", "12:00pm", "12:15pm"], correct: 2, explain: "Interview 1 starts at 9:00am; each of the next four starts 45 minutes later: 9:45, 10:30, 11:15, then 12:00pm for the 5th." },
  { q: "A budget of ₦500,000 is split in the ratio 2:3 between marketing and product. How much goes to product?", options: ["₦200,000", "₦250,000", "₦300,000", "₦350,000"], correct: 2, explain: "The ratio splits ₦500,000 into 5 parts of ₦100,000 each; product gets 3 parts = ₦300,000." },
  { q: "A store offers 20% off, then an extra 10% off the discounted price. What is the total percentage paid of the original price?", options: ["70%", "72%", "74%", "68%"], correct: 1, explain: "100% × 0.8 × 0.9 = 72% of the original price is paid." },
  { q: "If 6 employees can complete a task in 10 days, how many days would it take 4 employees at the same rate?", options: ["12", "14", "15", "16"], correct: 2, explain: "Total work = 6 × 10 = 60 employee-days. 60 ÷ 4 = 15 days." },
  { q: "A company's headcount grows from 40 to 52 in a year. What is the percentage growth?", options: ["20%", "24%", "28%", "30%"], correct: 3, explain: "(52 minus 40) divided by 40 = 12/40 = 30%." },
  { q: "A candidate travels 18km to an interview at an average speed of 45km/h. How many minutes does the trip take?", options: ["20", "24", "30", "36"], correct: 1, explain: "Time = distance ÷ speed = 18 ÷ 45 hours = 0.4 hours = 24 minutes." },
  { q: "An interview panel of 4 people each spend 15 minutes with a candidate, one after another. How long is the full loop?", options: ["45 minutes", "1 hour", "1 hour 15 minutes", "1 hour 30 minutes"], correct: 1, explain: "4 × 15 minutes = 60 minutes = 1 hour." },
  { q: "A salary of ₦300,000 per month increases by 8%. What is the new monthly salary?", options: ["₦316,000", "₦322,000", "₦324,000", "₦330,000"], correct: 2, explain: "8% of ₦300,000 is ₦24,000; ₦300,000 + ₦24,000 = ₦324,000." },
  { q: "Out of 150 applicants, the ratio of qualified to unqualified is 2:3. How many are qualified?", options: ["50", "60", "75", "90"], correct: 1, explain: "The ratio splits 150 into 5 parts of 30; qualified gets 2 parts = 60." },
  { q: "A project is 40% complete after 6 days at a constant pace. At that pace, how many total days will it take?", options: ["10", "12", "15", "18"], correct: 2, explain: "6 days is 40% of the total, so the total is 6 ÷ 0.4 = 15 days." },
  { q: "A company's revenue was ₦2,000,000 last quarter and ₦2,500,000 this quarter. What is the percentage increase?", options: ["20%", "25%", "30%", "15%"], correct: 1, explain: "(2,500,000 minus 2,000,000) divided by 2,000,000 = 25%." },
  { q: "A test has 40 questions and a candidate answers 32 correctly. What percentage did they score?", options: ["70%", "75%", "80%", "85%"], correct: 2, explain: "32 divided by 40 = 80%." },
];

export const behavioralPrompts: string[] = [
  "Tell us about a time you handled a tight deadline.",
  "Describe a situation where you had to work with a difficult teammate.",
  "Tell us about a time you made a mistake at work or school. What happened?",
  "Describe a time you had to learn something new very quickly.",
  "Tell us about a time you had to persuade someone to see things your way.",
  "Describe a situation where you had conflicting priorities. How did you decide what came first?",
  "Tell us about a time you received critical feedback. How did you respond?",
  "Describe a time you took initiative without being asked to.",
  "Tell us about a project that didn't go as planned. What did you do?",
  "Describe a time you had to explain something complicated to someone with less context than you.",
  "Tell us about a time you disagreed with a decision made by someone above you.",
  "Describe a situation where you had to adapt quickly to an unexpected change.",
  "Tell us about a goal you set for yourself and how you worked toward it.",
  "Describe a time you helped a teammate who was struggling.",
];

export const roleFamilyQuestions: Record<
  "product" | "engineering" | "sales",
  { quant: MCQQuestion[]; behavioral: string[]; verbal?: MCQQuestion[]; sjt?: MCQQuestion[] }
> = {
  product: {
    quant: [
      { q: "A feature is used by 12% of your 50,000 monthly active users. How many users is that?", options: ["5,000", "6,000", "600", "60,000"], correct: 1, explain: "12% of 50,000 = 6,000." },
      { q: "A/B test: variant A converts 8% of 2,000 visitors, variant B converts 11% of 1,800 visitors. Which variant produced more conversions?", options: ["Variant A, with 160", "Variant B, with 198", "Both produced the same", "Cannot be determined"], correct: 1, explain: "Variant A: 8% of 2,000 = 160. Variant B: 11% of 1,800 = 198. Variant B produced more." },
      { q: "Weekly active users fall from 25,000 to 21,250. What is the percentage decline?", options: ["10%", "12%", "15%", "18%"], correct: 2, explain: "(25,000 minus 21,250) divided by 25,000 = 15%." },
    ],
    behavioral: [
      "Tell us about a time you had to say no to a feature a stakeholder really wanted.",
      "Describe a time you used data to change the direction of a product decision.",
      "Tell us about a time a launch didn't go as expected. What did you learn?",
    ],
    verbal: [
      { q: "A product team reports that activation rose after onboarding was shortened, but the report does not compare retention. What can you conclude?", options: ["Shorter onboarding definitely improves retention", "Activation improved after the change, but retention cannot be determined", "Retention fell after the change", "The onboarding change had no measurable effect"], correct: 1, explain: "The report gives evidence about activation only. It does not provide enough information to conclude anything about retention." },
      { q: "A stakeholder says a feature is urgent because three enterprise customers requested it. Which conclusion is justified?", options: ["All customers want the feature", "The feature will increase revenue", "At least three enterprise customers requested the feature", "The feature should be built immediately"], correct: 2, explain: "Only the stated fact about three enterprise customers is supported; the other conclusions require additional evidence." },
      { q: "A roadmap review notes that two features shipped on time while a third slipped by three weeks due to a dependency. What is supported?", options: ["The team is generally unreliable", "One feature slipped due to a specific, named dependency, while two shipped on time", "All future features will slip", "The dependency was the team's fault"], correct: 1, explain: "Only the stated facts (two on time, one delayed by a named dependency) are supported by the passage." },
    ],
    sjt: [
      { q: "Engineering says a request will take 3x longer than the business expects. What do you do?", options: ["Promise the original deadline anyway", "Push engineering to cut corners", "Get both sides in a room to align on scope and a realistic date", "Escalate straight to a director without talking to engineering first"], correct: 2, explain: "Aligning both sides on scope and a realistic date is the core of the PM job in moments like this." },
      { q: "Usage data contradicts a senior stakeholder's preferred product direction. What is the strongest next step?", options: ["Ignore the data because the stakeholder is senior", "Present the evidence, explain its limits, and propose a small test", "Choose the opposite direction immediately", "Remove the data from the presentation"], correct: 1, explain: "Good product decisions use evidence while acknowledging uncertainty and testing important assumptions." },
      { q: "Two customer segments want opposite things from the same feature, and you can only ship one version this quarter. What's the best first step?", options: ["Ship whichever segment complained loudest", "Quantify how much revenue or usage each segment represents before deciding", "Delay the decision indefinitely", "Build both versions regardless of the timeline"], correct: 1, explain: "Sizing the impact of each segment gives an evidence-based basis for a genuinely difficult tradeoff." },
    ],
  },
  engineering: {
    quant: [
      { q: "An API response time is 240ms and you reduce it by 25%. What is the new response time?", options: ["180ms", "200ms", "210ms", "220ms"], correct: 0, explain: "240 minus 25% of 240 (60) = 180ms." },
      { q: "A server handles 150 requests per second. How many requests does it handle in 2 minutes?", options: ["9,000", "12,000", "18,000", "24,000"], correct: 2, explain: "150 × 120 seconds = 18,000." },
      { q: "A bug affects 3% of 40,000 daily transactions. Roughly how many transactions are affected per day?", options: ["120", "1,200", "400", "3,000"], correct: 1, explain: "3% of 40,000 = 1,200." },
    ],
    behavioral: [
      "Tell us about a time you had to debug a critical issue under real time pressure.",
      "Describe a time you disagreed with a teammate's technical approach.",
      "Tell us about a time you had to learn a new technology quickly for a project.",
    ],
    verbal: [
      { q: "An incident report says the outage affected 4% of requests for 18 minutes. The report does not state the root cause. What is supported?", options: ["The outage was caused by a database failure", "4% of requests were affected for 18 minutes", "The outage lasted several hours", "The root cause was identified before recovery"], correct: 1, explain: "Only the duration and percentage affected are stated. The root cause is not given." },
      { q: "A release passed automated tests but failed in production. Which statement follows?", options: ["Automated tests are useless", "The production failure proves the code was never tested", "The automated tests did not catch the production issue", "The deployment process caused the failure"], correct: 2, explain: "A production failure after tests pass means the tests did not detect that particular issue. It does not prove why it happened." },
      { q: "A postmortem states the fix was deployed and the error rate returned to baseline within an hour. What is supported?", options: ["The error will never happen again", "The error rate returned to baseline within an hour of the fix", "The fix was deployed without any testing", "The incident lasted less than an hour in total"], correct: 1, explain: "Only the stated fact — error rate back to baseline within an hour of the fix — is directly supported." },
    ],
    sjt: [
      { q: "You spot a bug in a teammate's pull request right before a release deadline. What do you do?", options: ["Merge it anyway to hit the deadline", "Flag it clearly with a suggested fix, even if it delays release", "Fix it yourself without telling them", "Ignore it since it is not your code"], correct: 1, explain: "Flagging it clearly, with a fix in hand, protects the release without stepping on your teammate." },
      { q: "A production error is intermittent and you cannot reproduce it locally. What is the best next step?", options: ["Declare it harmless", "Add evidence gathering and monitoring while investigating safely", "Deploy an untested fix immediately", "Delete the error logs to reduce noise"], correct: 1, explain: "When reproduction is difficult, reliable logs, monitoring and controlled investigation give you evidence without creating additional risk." },
      { q: "You realize a design decision you championed six months ago is now causing real technical debt. What do you do?", options: ["Defend the original decision to avoid looking wrong", "Acknowledge it openly and propose a plan to address the debt", "Quietly work around it without telling anyone", "Blame the requirements that existed at the time"], correct: 1, explain: "Owning the outcome and proposing a forward path builds more credibility than defensiveness or blame." },
    ],
  },
  sales: {
    quant: [
      { q: "You close 8 deals out of 40 leads. What is your conversion rate?", options: ["15%", "20%", "25%", "30%"], correct: 1, explain: "8 divided by 40 = 20%." },
      { q: "Your quota is ₦4,000,000 this quarter and you've closed ₦2,800,000 so far. What percentage of quota remains?", options: ["20%", "25%", "30%", "35%"], correct: 2, explain: "Remaining is ₦1,200,000, which is 30% of the ₦4,000,000 quota." },
      { q: "A rep makes 60 calls and books 9 meetings. What is the call-to-meeting rate?", options: ["10%", "12.5%", "15%", "18%"], correct: 2, explain: "9 divided by 60 = 15%." },
    ],
    behavioral: [
      "Tell us about a deal you lost. What did you learn from it?",
      "Describe a time you had to rebuild trust with a client after a mistake.",
      "Tell us about your most difficult negotiation and how you handled it.",
    ],
    verbal: [
      { q: "A prospect says they value the product but has not approved the budget. What can you conclude?", options: ["The prospect will definitely buy", "The prospect dislikes the product", "The prospect sees value but budget approval is unresolved", "The prospect has chosen a competitor"], correct: 2, explain: "The statement supports interest in the product while leaving the purchasing decision unresolved." },
      { q: "A sales report shows response rates improved after follow-up emails were personalised. What is the safest conclusion?", options: ["Personalisation caused every increase", "Response rates improved after personalised follow-ups were introduced", "Personalised emails always increase sales", "No other factor could have affected response rates"], correct: 1, explain: "The timing and reported relationship are supported, but the report does not prove that personalisation was the only cause." },
      { q: "A client renews at a lower tier but adds two new users. What is the most balanced read of this account?", options: ["The account is definitely at risk of churning", "The account shrank on every dimension", "The account is mixed: lower tier, but expanding seat usage", "The renewal proves the client is fully satisfied"], correct: 2, explain: "The facts point in different directions — a downgrade and an expansion — so the balanced read holds both without overstating either." },
    ],
    sjt: [
      { q: "A prospect asks for a discount your company does not usually offer. What do you do?", options: ["Agree immediately to close the deal", "Say no and end the conversation", "Understand what is driving the request, then see what you can genuinely offer", "Ignore the request and change the subject"], correct: 2, explain: "Understanding the real driver behind a discount request usually uncovers a better solution than a blanket yes or no." },
      { q: "A prospect asks you a technical question you cannot answer confidently. What is the best response?", options: ["Guess so the call keeps moving", "Avoid the question", "Be transparent, confirm the answer with the right team, and follow up", "Tell the prospect they should already know"], correct: 2, explain: "Accuracy builds more trust than guessing. Confirming with the right team keeps the conversation credible." },
      { q: "A long-time client is upset about a price increase and is threatening to leave. What's the best first move?", options: ["Immediately match their old price to keep them", "Let them leave since the pricing policy is fixed", "Listen fully to their concern before proposing any solution", "Transfer them to another department"], correct: 2, explain: "Understanding the full concern before responding avoids either over-conceding or under-addressing what's actually bothering them." },
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
  { q: "You disagree with a decision your manager made, but they seem confident about it. What do you do?", options: ["Comply publicly but complain to coworkers privately", "Raise your concern directly and respectfully, then support the final call", "Say nothing and hope it goes wrong so you're proven right", "Escalate over your manager's head immediately"], correct: 1, explain: "Voicing disagreement respectfully, then supporting the decision once made, is how healthy disagreement works on a team." },
  { q: "You finish your own work early and notice a teammate is overwhelmed with theirs. What do you do?", options: ["Focus only on your own tasks since it's not your job", "Offer to help with something specific, if you're able to", "Tell your manager your teammate is falling behind", "Wait for your teammate to ask for help"], correct: 1, explain: "Proactively offering specific help builds trust and reflects well on you, without overstepping." },
  { q: "You're asked to complete a task using a method you believe is inefficient. What's the best approach?", options: ["Do it the way you were told without comment", "Refuse and do it your own way instead", "Complete it as asked, then suggest your alternative afterward with reasoning", "Complain to others about the inefficiency"], correct: 2, explain: "Delivering what was asked while respectfully proposing an improvement afterward balances reliability with initiative." },
  { q: "You're running five minutes late to an important meeting. What do you do?", options: ["Show up without saying anything", "Send a quick heads-up message and join as soon as possible", "Skip the meeting entirely since you're already late", "Wait until the next meeting to explain"], correct: 1, explain: "A brief heads-up respects others' time and sets expectations, which is better than silence or skipping." },
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
