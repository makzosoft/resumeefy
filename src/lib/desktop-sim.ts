/**
 * Desktop Simulation task pool.
 *
 * Previously all three "tasks" in this module were flavor-text wrappers
 * around the exact same three-panel flow (browser copy -> mail paste-send ->
 * sheet save), generated fresh by an AI call each time. That meant the
 * mechanics never actually varied, only the cover story did — this is what
 * made it feel like the same test three times.
 *
 * This version is deterministic (instant, no AI call, nothing to fail or
 * cost credits) and genuinely varies what's being tested:
 *   1. Computer Basics   — window management: open, minimize, restore, close
 *   2. Browser & Mail     — find information, then relay it by real copy/paste
 *   3. A role-matched app — Spreadsheet, Documents, or Design Studio
 *
 * Task 3 is chosen from the candidate's target role so a designer gets a
 * Canva-style task, a data/finance role gets a spreadsheet task, and
 * everyone else gets a documents task.
 */

export type DesktopAppKind = "basics" | "browserMail" | "spreadsheet" | "documents" | "design" | "slides" | "support" | "code";

export type ChecklistItem = { id: string; label: string };

export type BasicsContent = {
  primaryApp: "documents" | "spreadsheet";
  secondaryApp: "documents" | "spreadsheet";
};

export type BrowserMailContent = {
  searchQuery: string;
  resultTitle: string;
  resultUrl: string;
  otherResults: { title: string; url: string }[];
  pageTitle: string;
  pageBody: string;
  copyLabel: string;
  copyValue: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  fullMessage: string;
  replyOpener: string;
};

export type SpreadsheetContent = {
  title: string;
  rowLabel: string;
  rows: { name: string; value: number }[];
  sumLabel: string;
  sortColumn: string;
};

export type DocumentsContent = {
  title: string;
  heading: string;
  bodyWithTypo: string;
  typoWord: string;
  correctedWord: string;
  listIntro: string;
  listItems: string[];
};

export type DesignContent = {
  brief: string;
  templateName: string;
  headline: string;
  colorOptions: { name: string; hex: string }[];
  correctColorName: string;
};

export type SlidesContent = {
  brief: string;
  layoutOptions: { name: string; description: string }[];
  correctLayoutName: string;
  title: string;
  bulletPrompt: string;
  bulletSuggestion: string;
};

export type SupportContent = {
  customerName: string;
  ticketSubject: string;
  ticketBody: string;
  categories: string[];
  correctCategory: string;
  responseOptions: { label: string; body: string; isCorrect: boolean }[];
};

export type CodeContent = {
  fileName: string;
  description: string;
  lines: string[];
  buggyLineIndex: number;
  buggyText: string;
  fixedText: string;
  testName: string;
};

export type DesktopTask =
  | { kind: "basics"; id: "basics"; title: string; content: BasicsContent; checklist: ChecklistItem[] }
  | { kind: "browserMail"; id: "browserMail"; title: string; content: BrowserMailContent; checklist: ChecklistItem[] }
  | { kind: "spreadsheet"; id: "spreadsheet"; title: string; content: SpreadsheetContent; checklist: ChecklistItem[] }
  | { kind: "documents"; id: "documents"; title: string; content: DocumentsContent; checklist: ChecklistItem[] }
  | { kind: "design"; id: "design"; title: string; content: DesignContent; checklist: ChecklistItem[] }
  | { kind: "slides"; id: "slides"; title: string; content: SlidesContent; checklist: ChecklistItem[] }
  | { kind: "support"; id: "support"; title: string; content: SupportContent; checklist: ChecklistItem[] }
  | { kind: "code"; id: "code"; title: string; content: CodeContent; checklist: ChecklistItem[] };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function basicsTask(): DesktopTask {
  return {
    kind: "basics",
    id: "basics",
    title: "Computer Basics",
    content: { primaryApp: "documents", secondaryApp: "spreadsheet" },
    checklist: [
      { id: "open-a", label: "Open Documents from the desktop" },
      { id: "minimize-a", label: "Minimize the Documents window" },
      { id: "restore-a", label: "Reopen Documents from the taskbar" },
      { id: "open-b", label: "Open Spreadsheet from the desktop" },
      { id: "close-b", label: "Close the Spreadsheet window" },
    ],
  };
}

const browserMailVariants: BrowserMailContent[] = [
  {
    searchQuery: "resumeefy support email",
    resultTitle: "Contact & Support — Resumeefy",
    resultUrl: "resumeefy.com/support",
    otherResults: [
      { title: "Resumeefy | LinkedIn", url: "ng.linkedin.com/company/resumeefy" },
      { title: "Careers at Resumeefy", url: "resumeefy.com/careers" },
    ],
    pageTitle: "Contact & Support",
    pageBody: "Our support team typically responds within 24 hours. For candidate queries, use the address below.",
    copyLabel: "support email address",
    copyValue: "support@resumeefy.ng",
    from: "Ada O.",
    fromEmail: "ada@student.ng",
    subject: "Application status?",
    preview: "Hi, I submitted my application last week and haven't heard back...",
    fullMessage: "Hi, I submitted my application last week and haven't heard back. Could you confirm receipt, and let me know who to contact directly?",
    replyOpener: "Hi Ada, thanks for reaching out — for anything urgent going forward you can also reach us directly at",
  },
  {
    searchQuery: "resumeefy interview rubric",
    resultTitle: "Interview Scoring Rubric v2 — Resumeefy",
    resultUrl: "resumeefy.com/rubric",
    otherResults: [
      { title: "Using the STAR Method — Resumeefy Blog", url: "resumeefy.com/blog/star-method" },
      { title: "Careers at Resumeefy", url: "resumeefy.com/careers" },
    ],
    pageTitle: "Interview Scoring Rubric",
    pageBody: "Score each candidate 1 to 5 on Communication, Technical Skill, and Culture Fit. Reference code: RUBRIC-V2-2026.",
    copyLabel: "rubric reference code",
    copyValue: "RUBRIC-V2-2026",
    from: "Tunde K.",
    fromEmail: "tunde@resumeefy.ng",
    subject: "Scorecard for today's panel?",
    preview: "Hi, could you confirm which rubric version we're using...",
    fullMessage: "Hi, could you confirm which rubric version we're using for today's interviews? Want to make sure we're all scoring consistently.",
    replyOpener: "Hi Tunde, confirming we're using reference",
  },
  {
    searchQuery: "resumeefy office wifi guest password",
    resultTitle: "Office IT Guide — Resumeefy",
    resultUrl: "resumeefy.com/it-guide",
    otherResults: [
      { title: "New Hire Onboarding Checklist", url: "resumeefy.com/onboarding" },
      { title: "Resumeefy | LinkedIn", url: "ng.linkedin.com/company/resumeefy" },
    ],
    pageTitle: "Office IT Guide",
    pageBody: "Guest wifi network: Resumeefy-Guest. Current guest password rotates weekly. This week's password: SunriseDesk44.",
    copyLabel: "guest wifi password",
    copyValue: "SunriseDesk44",
    from: "Chioma N.",
    fromEmail: "chioma@resumeefy.ng",
    subject: "Wifi password for our visitor today?",
    preview: "Hi, our 2pm guest just arrived at reception and is asking for the wifi...",
    fullMessage: "Hi, our 2pm guest just arrived at reception and is asking for the wifi. Could you send it over quickly?",
    replyOpener: "Hi Chioma, here you go — this week's guest password is",
  },
];

function browserMailTask(): DesktopTask {
  const content = pick(browserMailVariants);
  return {
    kind: "browserMail",
    id: "browserMail",
    title: "Browser & Mail",
    content,
    checklist: [
      { id: "search", label: `Open the Browser and search for "${content.searchQuery}"` },
      { id: "open-result", label: "Open the top result" },
      { id: "copy", label: `Select the ${content.copyLabel} and copy it (no button — use Ctrl/Cmd+C)` },
      { id: "open-mail", label: "Open Mail and read the message" },
      { id: "paste", label: "Reply, then paste what you copied (Ctrl/Cmd+V)" },
      { id: "send", label: "Send the reply" },
    ],
  };
}

const spreadsheetVariants: SpreadsheetContent[] = [
  {
    title: "Weekly candidate outreach",
    rowLabel: "Candidate",
    rows: [
      { name: "Ada O.", value: 12 },
      { name: "Femi A.", value: 7 },
      { name: "Bola S.", value: 19 },
      { name: "Chidi E.", value: 4 },
    ],
    sumLabel: "Total outreach messages sent",
    sortColumn: "Messages",
  },
  {
    title: "Monthly expense tracker",
    rowLabel: "Category",
    rows: [
      { name: "Transport", value: 15400 },
      { name: "Data & Airtime", value: 8200 },
      { name: "Office supplies", value: 22600 },
      { name: "Meals", value: 11300 },
    ],
    sumLabel: "Total spend",
    sortColumn: "Amount",
  },
];

function spreadsheetTask(): DesktopTask {
  const content = pick(spreadsheetVariants);
  return {
    kind: "spreadsheet",
    id: "spreadsheet",
    title: "Spreadsheet",
    content,
    checklist: [
      { id: "open", label: "Open Spreadsheet from the desktop" },
      { id: "formula", label: `Click the total cell and use a SUM formula to calculate "${content.sumLabel}"` },
      { id: "sort", label: `Sort the table by "${content.sortColumn}" from highest to lowest` },
      { id: "save", label: "Save the spreadsheet" },
    ],
  };
}

const documentsVariants: DocumentsContent[] = [
  {
    title: "New hire welcome note",
    heading: "Welcome to the team",
    bodyWithTypo: "We're really greatful to have you join us this week, and we can't wait to see what you'll acheive here.",
    typoWord: "greatful",
    correctedWord: "grateful",
    listIntro: "Before Monday, please:",
    listItems: ["Set up your work email", "Read the onboarding guide", "Book time with your manager"],
  },
  {
    title: "Client follow-up draft",
    heading: "Thank you for your time",
    bodyWithTypo: "Thank you for taking the time to meet with us, we really appreciate the oportunity to work together.",
    typoWord: "oportunity",
    correctedWord: "opportunity",
    listIntro: "Next steps we discussed:",
    listItems: ["Share the proposal by Friday", "Confirm the pilot start date", "Loop in the finance team"],
  },
];

function documentsTask(): DesktopTask {
  const content = pick(documentsVariants);
  return {
    kind: "documents",
    id: "documents",
    title: "Documents",
    content,
    checklist: [
      { id: "open", label: "Open Documents from the desktop" },
      { id: "bold", label: `Make the heading "${content.heading}" bold` },
      { id: "typo", label: `Fix the typo: "${content.typoWord}" should be "${content.correctedWord}"` },
      { id: "list", label: "Turn the three lines under the intro into a bulleted list" },
      { id: "save", label: "Save the document" },
    ],
  };
}

const designVariants: DesignContent[] = [
  {
    brief: "Resumeefy is posting a hiring update on social media. Update the template to match brand colour and finish the headline.",
    templateName: "Hiring announcement — square post",
    headline: "We're hiring",
    colorOptions: [
      { name: "Brand Blue", hex: "#0A2FCC" },
      { name: "Sunset Orange", hex: "#FF7A45" },
      { name: "Forest Green", hex: "#0F9D58" },
    ],
    correctColorName: "Brand Blue",
  },
  {
    brief: "A partner event needs a quick promo tile. Update the template to match brand colour and finish the headline.",
    templateName: "Event promo — landscape tile",
    headline: "Join our webinar",
    colorOptions: [
      { name: "Brand Blue", hex: "#0A2FCC" },
      { name: "Magenta Pop", hex: "#D6409F" },
      { name: "Slate Grey", hex: "#5d6b85" },
    ],
    correctColorName: "Brand Blue",
  },
];

function designTask(): DesktopTask {
  const content = pick(designVariants);
  return {
    kind: "design",
    id: "design",
    title: "Design Studio",
    content,
    checklist: [
      { id: "open", label: "Open Design Studio from the desktop" },
      { id: "template", label: `Select the "${content.templateName}" template` },
      { id: "color", label: `Change the accent colour to "${content.correctColorName}"` },
      { id: "headline", label: `Type the headline "${content.headline}" onto the design` },
      { id: "export", label: "Export the design" },
    ],
  };
}

const slidesVariants: SlidesContent[] = [
  {
    brief: "Marketing needs a quick title slide for tomorrow's partner update deck.",
    layoutOptions: [
      { name: "Title + Bullets", description: "A heading with supporting points below" },
      { name: "Full Image", description: "A single large image, no text" },
      { name: "Quote", description: "A large centered quotation" },
    ],
    correctLayoutName: "Title + Bullets",
    title: "Q3 Partner Update",
    bulletPrompt: "Add one bullet summarizing this quarter's headline result",
    bulletSuggestion: "Partner-referred signups grew 34% quarter over quarter",
  },
  {
    brief: "Sales needs one slide recapping this week's pipeline for the Monday call.",
    layoutOptions: [
      { name: "Title + Bullets", description: "A heading with supporting points below" },
      { name: "Two Column", description: "Two side-by-side blocks of content" },
      { name: "Full Image", description: "A single large image, no text" },
    ],
    correctLayoutName: "Title + Bullets",
    title: "Weekly Pipeline Recap",
    bulletPrompt: "Add one bullet summarizing this week's key movement",
    bulletSuggestion: "Three new enterprise deals entered late-stage negotiation",
  },
];

function slidesTask(): DesktopTask {
  const content = pick(slidesVariants);
  return {
    kind: "slides",
    id: "slides",
    title: "Slides",
    content,
    checklist: [
      { id: "open", label: "Open Slides from the desktop" },
      { id: "layout", label: `Choose the "${content.correctLayoutName}" layout for this brief` },
      { id: "title", label: `Type the title "${content.title}"` },
      { id: "bullet", label: "Add a bullet point summarizing the result" },
      { id: "present", label: "Click Present to finish" },
    ],
  };
}

const supportVariants: SupportContent[] = [
  {
    customerName: "Grace N.",
    ticketSubject: "Can't download my resume PDF",
    ticketBody: "Hi, I finished my resume but the download button isn't doing anything. I've tried twice. Can you help?",
    categories: ["Billing", "Bug report", "Account access", "General question"],
    correctCategory: "Bug report",
    responseOptions: [
      { label: "Billing response", body: "Thanks for reaching out — I've reviewed your account and can confirm your last payment went through successfully.", isCorrect: false },
      { label: "Download issue response", body: "Sorry about that, Grace — could you try refreshing the page and downloading again? If it still doesn't work, let us know your browser and we'll escalate it right away.", isCorrect: true },
      { label: "Account access response", body: "It looks like your account may need a password reset — I've sent a reset link to your email.", isCorrect: false },
    ],
  },
  {
    customerName: "Emeka U.",
    ticketSubject: "Charged twice for credits",
    ticketBody: "I bought a credit pack this morning and it looks like I was charged twice on my card. Can someone check this?",
    categories: ["Billing", "Bug report", "Account access", "General question"],
    correctCategory: "Billing",
    responseOptions: [
      { label: "Download issue response", body: "Sorry about that — could you try refreshing the page and downloading again?", isCorrect: false },
      { label: "Billing response", body: "Sorry for the trouble, Emeka — I can see the duplicate charge on your account. I've started a refund for the extra transaction, which should reflect within 3–5 business days.", isCorrect: true },
      { label: "General response", body: "Thanks for your message! Let us know if there's anything else we can help with.", isCorrect: false },
    ],
  },
];

function supportTask(): DesktopTask {
  const content = pick(supportVariants);
  return {
    kind: "support",
    id: "support",
    title: "Helpdesk",
    content,
    checklist: [
      { id: "open", label: "Open Helpdesk from the desktop" },
      { id: "read", label: `Read the ticket from ${content.customerName}` },
      { id: "category", label: `Tag the ticket as "${content.correctCategory}"` },
      { id: "reply", label: "Choose the response that actually matches the issue" },
      { id: "resolve", label: "Mark the ticket resolved" },
    ],
  };
}

const codeVariants: CodeContent[] = [
  {
    fileName: "discount.js",
    description: "This function should return true when a cart total qualifies for free shipping (₦50,000 or more), but a test is failing.",
    lines: ["function qualifiesForFreeShipping(total) {", "  return total = 50000;", "}"],
    buggyLineIndex: 1,
    buggyText: "  return total = 50000;",
    fixedText: "  return total >= 50000;",
    testName: "qualifiesForFreeShipping(52000) should be true",
  },
  {
    fileName: "greeting.js",
    description: "This function should greet a user by name, but a test is failing because of a typo in the variable name.",
    lines: ["function greet(username) {", "  return \"Welcome, \" + usernme;", "}"],
    buggyLineIndex: 1,
    buggyText: "  return \"Welcome, \" + usernme;",
    fixedText: "  return \"Welcome, \" + username;",
    testName: 'greet("Ada") should return "Welcome, Ada"',
  },
];

function codeTask(): DesktopTask {
  const content = pick(codeVariants);
  return {
    kind: "code",
    id: "code",
    title: "Code Editor",
    content,
    checklist: [
      { id: "open", label: "Open Code Editor from the desktop" },
      { id: "read", label: `Read the failing test: ${content.testName}` },
      { id: "fix", label: "Click the buggy line and fix it" },
      { id: "run", label: "Click Run to confirm the test passes" },
      { id: "save", label: "Save the file" },
    ],
  };
}


/** Loosely mirrors the categories a real job title tends to fall into for this one purpose. */
function pickRoleTask(targetRole: string): DesktopTask {
  const r = (targetRole || "").toLowerCase();
  if (/design|ux|ui|graphic|brand|creative|illustrat/.test(r)) return designTask();
  if (/data|analyst|account(ing|ant)?|finance|operations|ops|inventory|procurement|budget/.test(r)) return spreadsheetTask();
  if (/engineer|develop|software|programmer|\bit\b|technical|coding/.test(r)) return codeTask();
  if (/support|success|service|helpdesk|customer care/.test(r)) return supportTask();
  if (/market|sales|business dev|\bhr\b|human resources|manager|management|executive assistant|operations lead/.test(r)) return slidesTask();
  return documentsTask();
}

export function buildDesktopTasks(targetRole: string): DesktopTask[] {
  return [basicsTask(), browserMailTask(), pickRoleTask(targetRole)];
}
