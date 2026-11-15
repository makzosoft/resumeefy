import type { CuratedCourse } from "./types";

export const aiAutomationForEverydayWork: CuratedCourse = {
  slug: "ai-automation-for-everyday-work",
  title: "AI Automation for Everyday Work",
  subtitle: "Connect the tools you already use so repetitive work stops eating your week.",
  instructorId: "tobi",
  level: "Beginner",
  hours: "2.5 hours",
  summary:
    "A no-hype, practical course on automating repetitive work: what's actually worth automating, how triggers and actions fit together, using AI models as a step inside a workflow rather than just a chat window, testing an automation before trusting it, and picking a sensible first project.",
  outcomes: [
    "Identify which repetitive tasks are actually good candidates for automation",
    "Explain the trigger-and-action model that almost every automation tool is built on",
    "Use an AI model as one step inside a larger workflow, not just as a chatbot",
    "Test an automation properly before letting it run unsupervised",
    "Choose a sensible, low-risk first automation project instead of over-engineering",
  ],
  lessons: [
    {
      id: "what-automation-solves",
      title: "What automation actually solves (and what it doesn't)",
      minutes: 14,
      body: [
        "The first automation I ever built took me four hours to set up and saved about ninety seconds a week. It technically worked. It was also a complete waste of time, because the task it automated almost never happened. That's the mistake most beginners make first: automating whatever feels impressive to automate, instead of whatever is actually costing real time.",
        "Good automation candidates share three traits: they happen often, they follow a consistent, predictable pattern, and doing them manually is genuinely tedious rather than genuinely valuable. Copying a new form submission into a spreadsheet every single time qualifies easily. Writing a thoughtful reply to an important client email does not, no matter how much time it takes, because the value is in the judgment, not the repetition.",
        "A simple test before automating anything: count how many times you did this exact task last week, and estimate honestly how long each one took. If the answer is \u201ctwice, five minutes each,\u201d that's ten minutes a week \u2014 probably not worth hours of setup and ongoing maintenance. If it's \u201cfifteen times, five minutes each,\u201d that's over an hour a week, which adds up fast and is a genuinely good candidate.",
        "Automation also has a real cost people underestimate: it needs occasional maintenance, and it can fail silently if you're not paying attention, which we'll cover properly in a later lesson. Every automation you build is a small piece of infrastructure you're now responsible for, not a one-time fix you never think about again. That cost is worth it for the right tasks, and not worth it for the wrong ones.",
      ],
      tryThis:
        "List three repetitive tasks from your own week. For each one, estimate how many times it happens weekly and how long it takes, and decide honestly whether it clears the bar for being worth automating.",
      quiz: {
        question: "What's the simplest test for whether a repetitive task is worth automating?",
        options: [
          "Whether it's technically possible to automate",
          "How often it happens and how much total time it actually costs across a week",
          "Whether a competitor is already automating it",
          "Whether it involves a computer at all",
        ],
        correct: 1,
        explain: "Frequency multiplied by time per occurrence gives an honest estimate of whether the setup and maintenance cost of automating is actually worth it.",
      },
    },
    {
      id: "triggers-actions-connecting-tools",
      title: "The building blocks: triggers, actions, and connecting your tools",
      minutes: 15,
      body: [
        "Almost every automation tool you'll come across, regardless of its specific interface, is built on the same underlying idea: something happens (a trigger), and then something else happens automatically in response (one or more actions). Once this clicks, every automation tool becomes far less intimidating, because you're no longer learning a new mental model each time, just a new interface for the same one.",
        "A trigger is any event a tool can detect: a form gets submitted, an email arrives with a specific subject line, a new row appears in a spreadsheet, a calendar event starts in ten minutes. Triggers need to be specific enough that they don't fire constantly on things you didn't mean to catch \u2014 \u201can email arrives\u201d is usually too broad; \u201can email arrives from this specific address\u201d is usually the right level of precision.",
        "An action is whatever happens next: send a message, add a row, create a task, generate a document, notify someone. Actions can chain \u2014 one trigger can set off several actions in sequence, and the output of one action can feed into the next. This chaining is where automation goes from \u201cconvenient\u201d to \u201cactually replaces a chunk of manual work,\u201d because you're not just moving one piece of data, you're moving it through several steps at once.",
        "Connecting tools together almost always relies on something called an integration or a connector \u2014 a pre-built bridge between two specific tools (your form tool and your spreadsheet, for instance). Before committing to any automation platform, check that it actually has connectors for the specific tools you already use. A brilliant automation idea is useless if the platform can't actually talk to your email provider or your CRM.",
        "Start simple: one trigger, one action, no branching logic. It's tempting to design something elaborate on your first attempt, with conditions and multiple paths, but a simple automation you actually finish and trust beats a complex one that's half-built and untested. Complexity can come later, once the basic version is working reliably.",
      ],
      tryThis:
        "Pick one repetitive task from your list in the last lesson and describe it as a trigger and one action: \u201cWhen [specific trigger], then [specific action].\u201d",
      quiz: {
        question: "Why should a trigger usually be as specific as possible, rather than broad?",
        options: [
          "Specific triggers use less computing power",
          "A broad trigger risks firing on events you didn't actually mean to catch",
          "Automation platforms require specific triggers by law",
          "Specific triggers are always faster to set up",
        ],
        correct: 1,
        explain: "An overly broad trigger, like 'any email arrives,' tends to fire on far more events than intended, which quickly becomes noisy or even harmful.",
      },
    },
    {
      id: "ai-inside-a-workflow",
      title: "Using AI models inside a workflow (not just chatting with them)",
      minutes: 15,
      body: [
        "Most people's experience with AI models is a chat window: you type a question, you read an answer, you're done. That's genuinely useful, but it's a completely different use case from putting an AI model as one automatic step inside a larger workflow, where it processes something and passes the result along without you typing anything at all.",
        "A practical example: instead of manually reading every customer support ticket and deciding which category it belongs to, a workflow can pass the ticket text to an AI model with a specific instruction \u2014 \u201cclassify this into billing, technical, or general, and respond with only the category name\u201d \u2014 and use that output to automatically route the ticket. The AI model becomes a small, specific processing step, not a conversation.",
        "Specific, constrained instructions work far better inside a workflow than open-ended ones. \u201cSummarize this\u201d can produce wildly inconsistent results in length and format from one run to the next. \u201cSummarize this in exactly two sentences, focused only on the requested action and the deadline\u201d produces something far more consistent and far more usable automatically downstream, without a human reviewing every single output.",
        "AI steps inside a workflow can fail in a specific, sneaky way regular automation steps don't: they can produce a confident, well-formatted, completely wrong answer, rather than an obvious error. This is exactly why the next lesson, on testing and trust, matters more for AI-involved automations than for purely mechanical ones \u2014 a broken spreadsheet formula usually looks broken; a wrong AI output often doesn't.",
        "Good candidates for an AI step inside a workflow: categorizing or tagging incoming content, drafting a first pass of a routine reply for a human to review before sending, extracting specific fields from unstructured text like an email. Weak candidates: anything where a wrong answer would be costly and hard to catch, run fully automatically with no human review at all.",
      ],
      tryThis:
        "Write one specific, constrained instruction you could give an AI model as a workflow step (not an open-ended question) for a real task \u2014 something with a clearly defined output format.",
      quiz: {
        question: "Why is a specific, constrained instruction generally better than an open-ended one for an AI step inside a workflow?",
        options: [
          "Open-ended instructions are more expensive to run",
          "Constrained instructions produce more consistent output that's easier to use automatically downstream",
          "AI models can only understand short instructions",
          "It's required by most automation platforms",
        ],
        correct: 1,
        explain: "Consistency matters much more inside an automated workflow than in a one-off chat, since downstream steps rely on a predictable output format.",
      },
    },
    {
      id: "testing-and-trusting",
      title: "Testing and trusting an automation before you rely on it",
      minutes: 13,
      body: [
        "An automation that silently stops working is worse than no automation at all, because you keep assuming it's still handling something it quietly stopped handling weeks ago. I once had a client-onboarding automation break because a form field got renamed, and nobody noticed for almost a month, during which every new signup quietly fell through the cracks.",
        "Before trusting any automation with something that matters, run it deliberately with test data first, not just your real, live data on the first try. Feed it an intentionally unusual case \u2014 a blank field, an unexpected format, a duplicate entry \u2014 and watch what actually happens, rather than assuming it'll handle edge cases gracefully just because the main case worked.",
        "For anything with real consequences, start in \u201cnotify, don't act\u201d mode: have the automation alert you about what it would do, without actually doing it yet, for the first week or two. This lets you build genuine confidence in its judgment before handing it full, unsupervised control, which matters even more once an AI step is involved, given the confident-wrong-answer risk from the last lesson.",
        "Build in a simple, visible way to notice failure \u2014 a log, a summary email, a dashboard, anything that surfaces \u201cthis ran 40 times this week, 2 of them failed\u201d rather than requiring you to go digging to find out something's wrong. An automation with zero visibility into its own failures will eventually fail silently, and silent failure is the actual risk here, not occasional errors.",
      ],
      tryThis:
        "For an automation idea you have, write down one unusual edge case (a blank field, a duplicate, an unexpected format) you'd want to deliberately test before trusting it with real data.",
      quiz: {
        question: "Why is starting an automation in 'notify, don't act' mode a good idea for anything with real consequences?",
        options: [
          "It's required by most automation platforms",
          "It lets you build confidence in its judgment before giving it full unsupervised control",
          "It makes the automation run faster",
          "It removes the need for any testing at all",
        ],
        correct: 1,
        explain: "Observing what an automation *would* do, without letting it act yet, is a safe way to catch mistakes before they have real consequences.",
      },
    },
    {
      id: "picking-first-project",
      title: "Where to start: picking your first automation project",
      minutes: 12,
      body: [
        "The biggest reason people never actually finish their first automation isn't lack of skill \u2014 it's picking something too ambitious to start with. A multi-step workflow with branching logic and three connected tools is a terrible first project. A single trigger, single action automation you can build and test in under an hour is a great one.",
        "Common, genuinely useful first automations: new form submission automatically added to a spreadsheet or task list, a notification sent the moment a specific important email arrives, an automatic reminder sent a few days before a recurring deadline. None of these are impressive to describe at a party. All of them reliably save real time, every single week, which is the actual goal.",
        "Pick something with low stakes if it breaks. Your first automation should be something where a failure is mildly annoying, not something where a failure genuinely costs money or damages a client relationship. Save the higher-stakes automations for once you've built real confidence with a few simple wins under your belt.",
        "Finish and use it for two weeks before building your next one. There's a strong pull toward building automation after automation once you catch the bug, but an unfinished pile of half-working automations is worse than one or two simple ones that actually run reliably every week. Depth before breadth, at least at the start.",
      ],
      tryThis:
        "From everything in this course, pick one specific, low-stakes, single-trigger automation you could realistically build this week, and write the trigger and action in one sentence.",
      quiz: {
        question: "Why is a low-stakes, single-trigger automation a better first project than an ambitious multi-step one?",
        options: [
          "Simple automations are always more useful long-term",
          "It's realistic to actually finish and test, and a failure has low consequences while you're still learning",
          "Automation platforms don't support multi-step workflows for beginners",
          "It requires no maintenance at all",
        ],
        correct: 1,
        explain: "Starting simple means you're far more likely to actually finish, test, and trust it — and any mistakes along the way cost little while you're still building confidence.",
      },
    },
  ],
};
