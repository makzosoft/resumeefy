/**
 * Curated Resumeefy courses.
 *
 * Unlike the personalized course generator in src/lib/gemini.ts (which still
 * exists as an optional, secondary "build me a custom path" feature), the
 * courses here are written once, in full, and served to everyone — real
 * courses with real lessons, not a prompt that gets re-run per visitor.
 *
 * Start small and deep rather than wide and thin: two courses, each with
 * enough real substance that finishing one actually means something.
 */

export type Instructor = {
  id: string;
  name: string;
  title: string;
  bio: string;
  /** First-person welcome, read aloud at the start of the course — this is what makes the instructor feel present, not just a bio blurb. */
  greeting: string;
  initials: string;
  gradient: [string, string];
  /** Hints for the browser voice used to read this instructor's lessons aloud, so each instructor sounds distinct. */
  voiceProfile: { pitch: number; rate: number; preferGender: "male" | "female" };
};

export const INSTRUCTORS: Record<string, Instructor> = {
  ngozi: {
    id: "ngozi",
    name: "Ngozi Chukwu",
    title: "Career Coach, ex-Talent Acquisition Lead",
    bio: "Ngozi spent seven years hiring for fast-growing companies before moving into career coaching full-time. She has personally screened more than ten thousand resumes and sat on hiring panels across tech, banking, and FMCG. She teaches from what she's actually seen work, not from theory.",
    greeting: "Hi, I'm Ngozi. I used to be the person on the other side of your job application, so I know exactly what happens to your resume in those first few seconds. I'm not here to give you generic tips — everything in this course is something I've actually watched work, or fail, again and again. Let's get your resume and your search working the way they should.",
    initials: "NC",
    gradient: ["#0A2FCC", "#00B4FC"],
    voiceProfile: { pitch: 1.05, rate: 0.98, preferGender: "female" },
  },
  david: {
    id: "david",
    name: "David Okereke",
    title: "Workplace Communication Trainer",
    bio: "David has run communication and professionalism training for new hires at three multinational companies. Before that, he spent years managing customer-facing teams, which is where he learned that almost every workplace conflict is actually a communication problem wearing a disguise.",
    greeting: "Hey, I'm David. I've spent most of my career either managing teams or training people who just joined one, and I've seen the same few communication mistakes sink otherwise brilliant people. None of this is about being fake or overly polished — it's about saying what you mean in a way people can actually act on. Let's work through it together.",
    initials: "DO",
    gradient: ["#FF7A45", "#D6409F"],
    voiceProfile: { pitch: 0.92, rate: 1.0, preferGender: "male" },
  },
  kemi: {
    id: "kemi",
    name: "Kemi Adeyemi",
    title: "Digital Marketing Lead",
    bio: "Kemi has run digital marketing for two Lagos-based startups and now consults for small businesses trying to grow online without a big budget. She's managed ad spend, built email lists from zero, and — by her own admission — wasted a fair amount of early-career money learning what doesn't work, which is exactly why she teaches what does.",
    greeting: "Hi, I'm Kemi. Most of what gets taught as 'digital marketing' online is either recycled buzzwords or advice that only works if you already have a huge budget. I don't have that problem — I've grown things with almost nothing to spend, and made plenty of expensive mistakes along the way so you don't have to. This course is the practical version.",
    initials: "KA",
    gradient: ["#00B37E", "#00D9C0"],
    voiceProfile: { pitch: 1.1, rate: 1.05, preferGender: "female" },
  },
};

export type Quiz = { question: string; options: string[]; correct: number; explain: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string[]; // paragraphs
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

export const CURATED_COURSES: CuratedCourse[] = [
  {
    slug: "resume-job-search-fundamentals",
    title: "Resume & Job Search Fundamentals",
    subtitle: "Everything you need to go from a blank page to applications that actually get responses.",
    instructorId: "ngozi",
    level: "Beginner",
    hours: "2.5 hours",
    summary:
      "A practical, no-fluff walkthrough of what a resume is actually for, how to structure and write one that survives both software and human screening, and how to run a job search that doesn't rely on luck.",
    outcomes: [
      "Explain what a resume needs to do in the first six seconds someone looks at it",
      "Structure a resume that reads cleanly on-screen, on paper, and through ATS software",
      "Rewrite weak, duty-based bullet points into ones that demonstrate impact",
      "Tailor the same resume quickly and honestly for different job descriptions",
      "Run a job search with a system, instead of applying and hoping",
    ],
    lessons: [
      {
        id: "purpose",
        title: "What your resume is actually for",
        minutes: 12,
        body: [
          "Most people think a resume's job is to describe everything they've done. It isn't. A resume has exactly one job: to get you a conversation. Nobody has ever been hired purely because of a resume — it just has to be good enough to earn you fifteen minutes on a call.",
          "Here's what actually happens on the other end. When I was screening resumes for open roles, I'd get anywhere from 80 to 400 applications for a single posting. I did not read all of them carefully. Nobody does. I scanned. So does almost every recruiter and hiring manager, at least on the first pass. You get a few seconds of a scan, not a careful read, unless something on the page earns a second look.",
          "That changes what 'good' means. A resume isn't good because it's thorough. It's good because it's scannable — someone can look at it for six seconds and correctly guess what you do, how senior you are, and whether you're worth a closer look. Density and completeness are not virtues here. Clarity is.",
          "There's a second reader too, and it isn't human: an Applicant Tracking System, or ATS. Larger companies (and increasingly, smaller ones) run resumes through software that parses your text into fields — job titles, dates, skills — before a person ever sees it. This isn't some evil keyword-counting robot trying to reject you; it's closer to a filing system. But it does mean formatting choices that look nice can sometimes parse badly, and job description language matters more than you'd expect. We'll cover both audiences properly in the tailoring lesson, but keep this in mind throughout: you are writing for a fast human scan and for a piece of parsing software, at the same time.",
          "One more thing worth saying plainly: a resume is a marketing document, not a legal record. Its job isn't to list everything true about your career. It's to select and frame the parts of your true career that are most relevant to the specific reader, in the clearest possible way. Everything in this course follows from that one idea.",
        ],
        tryThis:
          "Open your current resume (or a blank page if you don't have one yet) and set a timer for six seconds. Look at it, then look away. Write down the two or three things you actually absorbed. If it isn't your target job title and one clear strength, that's exactly the gap this course fixes.",
        quiz: {
          question: "What is the primary purpose of a resume?",
          options: [
            "To document your entire work history in detail",
            "To earn you a conversation, not to get you hired directly",
            "To pass an ATS scan and nothing else",
            "To impress the reader with the length of your experience",
          ],
          correct: 1,
          explain: "A resume's only job is to earn a next step, usually a screening call — not to serve as a complete record.",
        },
      },
      {
        id: "structure",
        title: "Structuring a resume that reads cleanly",
        minutes: 16,
        body: [
          "Structure does more work than most people give it credit for. A well-organized average resume often beats a poorly organized strong one, simply because the reader can actually find the good parts.",
          "For almost everyone below senior-management level, reverse-chronological is the right format: your most recent role first, working backward. It's what recruiters expect, it's what ATS software parses most reliably, and it answers the first question a reader has — what are you doing right now — immediately. Functional or 'skills-based' resumes (grouping by skill instead of by job) tend to raise a quiet suspicion that you're hiding gaps or a lack of relevant recent experience, even when that isn't true. Avoid them unless you have a very specific reason not to.",
          "Order your sections by what's most relevant to a first-time reader: contact information, then a short summary if you use one, then experience, then education, then skills, then anything extra (certifications, projects, volunteering) that's genuinely relevant. Education moves above experience only if you're a current student or very recent graduate with limited work history — otherwise it belongs near the bottom. Nobody hiring a five-year professional cares which secondary school you attended, and including it just pushes your relevant experience further down the page.",
          "On length: one page if you have under roughly seven or eight years of experience, two pages if you have substantially more. This is a stronger norm than people think, and it's a discipline problem more than a space problem — a one-page resume with only your best material is almost always more effective than a page and a half padded with older, less relevant roles. If you're struggling to fit, the fix is usually to cut detail from older or less relevant jobs, not to shrink the font past 10.5pt or shrink the margins past half an inch. Readability always wins over cramming in more.",
          "On formatting: pick one clean, standard font (nothing decorative), keep consistent spacing and bullet style throughout, use bold sparingly for job titles or company names (not both, and not for random emphasis), and avoid tables, text boxes, columns, and headers or footers containing important text. These often parse badly in ATS software — the parser can scramble the reading order or drop the content entirely. A plain, well-spaced, single-column document is not boring; it's reliable.",
          "A quick honesty check on the professional summary at the top: only include one if it earns its space. A generic summary ('Hardworking professional seeking to leverage skills...') is worse than no summary at all, because it wastes your best real estate saying nothing. A good summary is two or three lines that state your role, your years of relevant experience, and one specific strength or specialization — written like a fact, not a slogan.",
        ],
        tryThis:
          "Count your resume's sections and their order. Does experience appear in the top half of the page? Is anything decorative (a table, columns, an icon row) that could confuse an ATS parser? Fix the order and formatting before you touch a single word of content — structure first, always.",
        quiz: {
          question: "For most job seekers below senior-management level, which resume format is generally the safest choice?",
          options: [
            "Functional, grouped entirely by skill category",
            "Reverse-chronological, most recent role first",
            "A creative, visually designed one-pager with columns and icons",
            "Chronological starting from your very first job",
          ],
          correct: 1,
          explain: "Reverse-chronological is what most recruiters and ATS systems expect and parse best, and it leads with your most current, relevant experience.",
        },
      },
      {
        id: "bullets",
        title: "Writing bullets that prove impact, not just duties",
        minutes: 18,
        body: [
          "This is the single highest-leverage skill in resume writing, and it's the one thing I'd fix first on almost every resume I ever screened. Most bullet points describe a duty: 'Responsible for managing social media accounts.' A duty tells the reader what you were assigned. It says nothing about whether you were any good at it.",
          "The fix is a simple formula: what you did, how you did it, and what happened because of it. 'Responsible for managing social media accounts' becomes something like 'Grew Instagram following from 4,000 to 22,000 in eight months by shifting to a weekly content calendar and short-form video.' Same job, same duty — but now the reader can tell you were effective, not just present.",
          "Not every bullet will have a clean number, and that's fine — don't invent one. But push yourself further than you think you need to before giving up on quantifying. 'Improved customer response times' is vague. 'Cut average customer response time from six hours to under ninety minutes by restructuring the support queue' is specific and verifiable-sounding, even without a source cited. If you genuinely can't find a number, quantify scope instead: team size you worked with, number of clients you managed, frequency of a task, size of a budget you handled.",
          "Start every bullet with a strong action verb in the past tense for previous roles, present tense only for your current role: led, built, negotiated, reduced, launched, trained, redesigned. Avoid weak openings like 'responsible for,' 'helped with,' or 'worked on' — they put you in a passive, secondary position in your own accomplishment. If you genuinely only assisted, say what you specifically contributed rather than hiding behind a vague 'helped.'",
          "A word of caution, because this lesson can tip into the wrong lesson if you're not careful: quantify honestly. Don't invent a percentage you can't defend if asked about it in an interview — and you will sometimes be asked. The goal isn't to sound impressive; it's to accurately represent real impact in a way that's easy to recognize as impact. A true, modest number beats an invented impressive one, because the invented one falls apart the moment someone asks a single follow-up question.",
          "One more habit worth building: read your bullets back and ask, 'so what?' after each one. 'Managed a team of six.' So what — did the team hit its targets, improve retention, ship something on time? Push every bullet one level past the bare fact and toward the outcome that fact produced.",
        ],
        tryThis:
          "Take your three weakest bullet points right now. For each one, ask: what actually changed because I did this? Rewrite each one in the format [action verb] + [what you did] + [result or scope], even if the result is an estimate you're confident defending in an interview.",
        quiz: {
          question: 'Which bullet point best demonstrates impact rather than just duty?',
          options: [
            "Responsible for handling customer complaints",
            "Helped improve the customer service process",
            "Reduced customer complaint resolution time from 3 days to 1 day by introducing a triage system",
            "Worked on customer service tasks daily",
          ],
          correct: 2,
          explain: "It uses a strong action verb, states a specific method, and shows a measurable before-and-after result.",
        },
      },
      {
        id: "tailoring",
        title: "Tailoring your resume without rewriting it from scratch",
        minutes: 14,
        body: [
          "Sending the identical resume to every job is the single most common reason a genuinely capable candidate gets filtered out early. It's not because tailoring is some secret trick — it's because a generic resume forces the reader to do the work of connecting your experience to their role, and most readers won't bother.",
          "Tailoring does not mean rewriting your resume from zero for every application. It means adjusting three things: which experiences and bullets you lead with, which of your existing bullets you tweak to mirror the job description's language, and your summary line if you use one. Your actual work history doesn't change; what changes is which parts of the truth you foreground.",
          "Start by reading the job description and pulling out the repeated language — not just hard skills like 'SQL' or 'budget management,' but the way they describe the role itself. If a posting says 'cross-functional collaboration' three times, and your resume currently says 'worked with other departments,' that's worth aligning, because ATS keyword matching and human pattern-matching both respond to this. This isn't about gaming a system with keyword-stuffing; it's about using the reader's own vocabulary so they instantly recognize the fit.",
          "Then reorder, don't invent. If you have five bullets under a previous role and only two are relevant to this specific job, move those two to the top of that role's bullet list. If you have two past roles and one is far more relevant to this posting, give it more bullets and give the less relevant one fewer. You're redistributing emphasis across true information, not fabricating new information.",
          "Realistically, budget fifteen to twenty minutes per tailored application once you have a strong base resume. That's a completely different time investment than rewriting from scratch, and it produces a meaningfully better result than sending the same document everywhere. If fifteen minutes feels like too much when you're applying to dozens of roles, that's a signal worth sitting with: a highly targeted twenty applications, each tailored, usually outperforms two hundred generic ones.",
        ],
        tryThis:
          "Pick a real job posting you're interested in. Highlight every repeated skill or phrase in the description. Then go through your resume and find at least three spots where you can honestly mirror that language using your existing experience.",
        quiz: {
          question: "What does tailoring a resume for a specific job mainly involve?",
          options: [
            "Writing a completely new resume from scratch for every application",
            "Adjusting emphasis, ordering, and language to match the role, using your real experience",
            "Adding skills you don't actually have because the job description mentions them",
            "Making the resume longer so it covers every possible keyword",
          ],
          correct: 1,
          explain: "Tailoring re-emphasizes and re-words your real, existing experience to match the specific role, without inventing anything.",
        },
      },
      {
        id: "job-search-system",
        title: "Running a job search like a system, not a hope",
        minutes: 15,
        body: [
          "A job search without a system feels like this: you apply somewhere, feel briefly hopeful, hear nothing back, and eventually can't even remember what you wrote in that cover letter when a recruiter finally calls six weeks later. That chaos is exhausting and it's also genuinely inefficient. A system fixes both problems.",
          "First, track everything. A simple spreadsheet with columns for company, role, date applied, resume version used, status, and next action takes ten minutes to set up and saves you from the 'wait, did I already apply here?' problem. It also lets you see patterns — if you've applied to thirty roles and gotten zero responses, that's a resume or targeting problem worth diagnosing early, not a sign to keep doing the same thing for another thirty applications.",
          "Second, diversify how you apply. Job boards are necessary but they're also the most competitive channel, because everyone uses them. Referrals dramatically outperform cold applications — being mentioned by name inside a company routes your resume around a chunk of the initial filtering. This doesn't require a huge existing network; a short, specific, polite message to someone at a company you're targeting ('I noticed you work on X, I'm applying for Y role, would you be open to a fifteen minute call about the team?') works far more often than people expect, especially when it's genuinely specific rather than a copy-pasted mass message.",
          "Third, follow up deliberately. If you haven't heard back after roughly one to two weeks, one polite, brief follow-up email is appropriate and reflects well on you, not badly. Restate your interest, mention one specific reason you're a fit, and ask if there's an update. After that, let it go and focus energy elsewhere — chasing harder rarely changes an outcome that's already decided internally.",
          "Finally, protect your energy on a schedule, not by mood. Job searching has a real emotional cost, especially across silence and rejection. Decide in advance how many hours per week you're spending on it and what those hours are for — for example, two hours on tailored applications, one hour on networking outreach, one hour on interview practice — rather than letting the whole search sprawl formlessly across every waking hour, which burns people out fast without actually producing more results.",
        ],
        tryThis:
          "Set up a tracker today, even a basic one, with the columns mentioned above. Add every application you've sent in the last month that you can still remember, then commit to logging every new one going forward before you close the tab.",
        quiz: {
          question: "Why does tracking job applications in a system actually help, beyond staying organized?",
          options: [
            "It makes your resume look more professional",
            "It lets you spot patterns early, like a high volume of applications with zero responses, so you can adjust",
            "Recruiters can see that you're organized",
            "It's required by most job boards",
          ],
          correct: 1,
          explain: "Tracking surfaces patterns (like consistent silence) early enough to diagnose and fix, instead of repeating an approach that isn't working.",
        },
      },
    ],
  },
  {
    slug: "professional-communication-at-work",
    title: "Professional Communication at Work",
    subtitle: "Say what you mean, get taken seriously, and handle the conversations most people avoid.",
    instructorId: "david",
    level: "Beginner",
    hours: "2 hours",
    summary:
      "A practical course on the communication skills that shape how you're perceived at work far more than most people realize: writing emails people actually act on, speaking up in meetings, exchanging feedback well, and handling difficult conversations without damaging the relationship.",
    outcomes: [
      "Write emails that are clear enough to get a fast, correct response",
      "Contribute in meetings with the right amount of confidence, not too little or too much",
      "Give feedback that lands, and receive it without getting defensive",
      "Communicate with your manager in a way that builds trust instead of requiring supervision",
    ],
    lessons: [
      {
        id: "email",
        title: "Email that gets read and acted on",
        minutes: 13,
        body: [
          "Most workplace email fails for one of two opposite reasons: it's so brief it's unclear what's actually being asked, or it's so long that the actual ask gets buried in the fourth paragraph. Both produce the same result — the reader skims, doesn't fully register what you need, and either does the wrong thing or does nothing at all.",
          "The fix is to lead with the ask, not the backstory. Most people write emails in the order they thought of the information: context first, then more context, then finally, at the bottom, what they actually want. Flip it. State what you need or what you're informing them of in the first line or two, then give supporting detail after. A reader who only reads your first sentence should still know what this email is about and whether it needs their action.",
          "Use formatting to do work for you. If there's more than one question or action item, use a numbered list, not a paragraph with three questions buried inside it. Bold the one thing that actually matters if the email is otherwise long. A wall of unbroken text signals 'this will take effort to parse,' and busy people deprioritize effort.",
          "Be explicit about what you need and by when. 'Let me know your thoughts when you get a chance' is comfortable to write but nearly useless to receive — it puts zero real structure around the ask. 'Could you confirm by Thursday whether option A or B works for the launch date?' tells the reader exactly what decision you need and gives them a deadline that makes prioritizing easy rather than optional.",
          "Finally, match tone to relationship and stakes, not to a fixed formula. A quick internal Slack-style message to a peer you talk to daily doesn't need 'Dear' and 'Kind regards.' A first email to a senior stakeholder you've never met does need that structure. The goal isn't rigid formality everywhere — it's reading the room correctly, which itself is a communication skill worth practicing consciously until it becomes automatic.",
        ],
        tryThis:
          "Find the last email you sent that didn't get a clear or timely response. Rewrite just the opening line so the ask and the deadline are both stated before any context. Notice how much of the original email that first line alone would have already covered.",
        quiz: {
          question: "What is the most common structural mistake in workplace emails that get ignored or misunderstood?",
          options: [
            "Using too many bullet points",
            "Leading with context and backstory, and putting the actual ask near the end",
            "Being too polite",
            "Sending emails outside of work hours",
          ],
          correct: 1,
          explain: "Burying the real ask after paragraphs of context means busy readers often miss it entirely on a skim.",
        },
      },
      {
        id: "meetings",
        title: "Speaking up in meetings without over-talking",
        minutes: 12,
        body: [
          "There are two failure modes in meetings, and most people default hard to one or the other. The first is staying quiet even when you have something useful to say, usually out of fear it isn't 'important enough' to interrupt with. The second is talking often but without much new content, which trains the room to tune you out a little each time.",
          "If you tend toward silence: the bar for speaking up is lower than you think. You don't need a fully-formed, brilliant insight to justify contributing — a clarifying question, a concern stated early before a decision is locked in, or connecting something someone said to a fact you know that they might not, are all genuinely valuable. Waiting for a perfect moment to say something perfect usually means the moment passes and you say nothing.",
          "A specific, low-risk way to start building this muscle: prepare one question or comment before a recurring meeting, based on the agenda if you have one. Having something ready in advance removes the in-the-moment pressure of trying to think of something worthwhile while also listening to everyone else.",
          "If you tend toward over-talking: the fix isn't to talk less in general, it's to talk with more intention. Before speaking, ask yourself silently whether what you're about to say adds new information, a genuine question, or a decision the group needs — versus restating something already said, thinking out loud, or filling silence because it feels uncomfortable. Silence in a meeting is not a problem that needs to be immediately solved by whoever is most uncomfortable with it.",
          "One habit that helps almost everyone regardless of which direction they lean: when you do speak, say the conclusion first, then the reasoning, rather than building up to a point slowly. 'I think we should push the launch by a week — here's why' lands better than three sentences of reasoning before anyone knows what you're actually recommending, because the listener isn't left guessing where you're headed while you're still talking.",
        ],
        tryThis:
          "Before your next recurring meeting, write down one specific question or point tied to the agenda, and commit to raising it even if the conversation doesn't create an obvious opening — you can create the opening yourself once there's a natural pause.",
        quiz: {
          question: "What's a practical way to start contributing more in meetings if you tend to stay quiet?",
          options: [
            "Wait until you have a fully polished, important insight before speaking",
            "Prepare one question or comment in advance, based on the agenda",
            "Speak as often as possible regardless of content",
            "Only speak when directly asked a question",
          ],
          correct: 1,
          explain: "Preparing something in advance lowers the in-the-moment pressure and makes it far easier to actually speak up.",
        },
      },
      {
        id: "feedback",
        title: "Giving and receiving feedback well",
        minutes: 14,
        body: [
          "Feedback goes wrong in predictable ways. Given badly, it's vague ('you need to communicate better'), or it's delivered as an ambush in a public setting, or it's so cushioned in softening language that the actual point never lands. Received badly, it triggers defensiveness before the message is even fully processed, which means the useful part of it gets lost regardless of how well it was delivered.",
          "When giving feedback, be specific about behavior and impact, not character. 'You're disorganized' describes a person and invites defensiveness. 'The report was sent two days after the deadline without a heads-up, which meant the client meeting had to be pushed' describes a specific instance and its concrete effect, which is much easier to hear and act on without feeling like a personal attack.",
          "Deliver feedback in private unless it's genuine, immediate praise. Public correction, even when well-intentioned, tends to produce embarrassment and defensiveness rather than reflection, and it damages trust in a way that outlasts the specific issue you were trying to address.",
          "When receiving feedback, resist the urge to respond immediately, especially the urge to explain or defend. Your first job is to understand what's being said, not to determine whether it's fair. A simple 'thanks, let me think about that' or a genuine clarifying question ('can you give me an example of when that happened?') buys you the space to actually process it instead of reacting from the first flash of discomfort, which is rarely your most useful response.",
          "It's worth separating two different things that often get tangled: whether feedback is delivered well, and whether it's true. Sometimes you'll get feedback delivered clumsily that's still accurate and worth acting on. Getting stuck on 'they said it in a harsh way' can become an excuse to dismiss a point that would actually help you. Try to extract the useful signal even when the delivery wasn't great.",
        ],
        tryThis:
          "Think of one piece of feedback you gave recently, or need to give soon. Rewrite it using the behavior-plus-impact structure: what specifically happened, and what specifically resulted from it, without any language that describes the person's character.",
        quiz: {
          question: "Why is 'you're disorganized' a weaker piece of feedback than describing a specific missed deadline and its impact?",
          options: [
            "It's shorter and takes less time to say",
            "It describes character rather than a specific, addressable behavior and its impact",
            "It's not true in most cases",
            "It doesn't mention a deadline at all",
          ],
          correct: 1,
          explain: "Character-based feedback invites defensiveness and gives no clear, specific behavior to change, unlike a concrete example.",
        },
      },
      {
        id: "managing-up",
        title: "Managing up: communicating with your manager",
        minutes: 13,
        body: [
          "'Managing up' sounds like corporate jargon, but the actual idea is simple: your manager can only support you well if they have accurate, timely information about what you're doing and where you're stuck. Waiting for them to ask, or hoping problems resolve themselves before anyone notices, usually backfires.",
          "The single highest-value habit here is surfacing problems early, before they become crises. If a deadline is at risk, say so as soon as you know, with a proposed plan, not after it's already been missed. 'I want to flag that the client deliverable might slip by two days because of a dependency on the design team — here's what I'm doing about it' builds far more trust than silence followed by a missed deadline, even though both involve the same underlying problem.",
          "Match your update style to how your specific manager actually prefers to receive information. Some managers want a quick daily Slack message; others want a five-minute check-in once a week; others barely want updates at all unless something's wrong. This isn't something to guess at — it's a completely reasonable thing to directly ask early in a working relationship: 'How do you like to get updates from me — quick async messages, a weekly sync, only when something's off track?'",
          "Bring solutions, or at least options, alongside problems whenever you can. 'This isn't working' is a status report. 'This isn't working, here are two ways I think we could fix it, I'd lean toward option one' is a much more useful contribution, and it positions you as someone actively solving problems rather than only reporting them upward.",
          "Finally, don't confuse managing up with hiding problems to look good. The goal isn't to always appear flawless to your manager — it's to be a reliable, accurate source of information, including when things aren't going well. A manager who can trust your status updates, good or bad, will give you more autonomy over time, not less.",
        ],
        tryThis:
          "If you've never explicitly asked, ask your manager this week how they prefer to receive updates and bad news specifically. Most people never ask this directly, and the answer is often different from what you'd assumed.",
        quiz: {
          question: "What's the main benefit of surfacing a potential problem to your manager early, before it becomes a missed deadline?",
          options: [
            "It guarantees the deadline will still be met",
            "It builds trust and allows a plan to be made, instead of a crisis being discovered after the fact",
            "It removes your responsibility for the outcome",
            "It's required by most company policies",
          ],
          correct: 1,
          explain: "Early, honest flagging with a plan builds trust and creates room to actually address the issue, unlike silence followed by a missed deadline.",
        },
      },
    ],
  },
  {
    slug: "digital-marketing-fundamentals",
    title: "Digital Marketing Fundamentals",
    subtitle: "How to market something online with a small budget, real numbers, and no buzzwords.",
    instructorId: "kemi",
    level: "Beginner",
    hours: "2.5 hours",
    summary:
      "A grounded introduction to digital marketing that skips the jargon: how the channels actually fit together, how to write copy people act on, how to build an audience on social media, which numbers actually matter, and how to run a first small campaign without wasting money learning the hard way.",
    outcomes: [
      "Explain how search, social, email and content marketing actually relate to each other",
      "Write headlines and calls-to-action that get clicked instead of scrolled past",
      "Build a social media approach based on consistency and content pillars, not luck",
      "Read marketing metrics well enough to tell real progress from vanity numbers",
      "Plan and run a small first campaign with a clear goal, budget, and way to measure it",
    ],
    lessons: [
      {
        id: "how-it-fits-together",
        title: "How digital marketing actually fits together",
        minutes: 14,
        body: [
          "The first time I sat in a meeting about \u201cgrowth strategy,\u201d I remember someone throwing around SEO, PPC, CRM, and funnel in the same sentence and I had absolutely no idea how any of it connected. Nobody explained it as a system. That's the first thing I want to fix, because once you see it as a system, every individual channel makes a lot more sense.",
          "Here's the simple version: digital marketing is just getting the right message in front of the right person, at a moment they're actually open to it, then giving them an easy next step. Every channel is just a different way of doing that. Search (like Google Ads or ranking organically) reaches people already looking for something. Social media reaches people scrolling, not looking, so it has to earn attention rather than answer a search. Email reaches people who already said yes once, which makes it the cheapest channel you'll ever use, because you're not paying to find them again. Content, like blog posts or videos, builds trust before someone is ready to buy anything at all.",
          "Where people go wrong early on is treating these as separate jobs instead of one system. A small business owner I consulted for was running Instagram ads to a page with no clear next step, sending traffic nowhere in particular. We didn't need a bigger budget. We needed the ad, the landing page and a follow-up email to actually connect to each other, telling one consistent story instead of three disconnected ones.",
          "A useful way to think about it: awareness (someone learns you exist), consideration (they're deciding if you're right for them), and conversion (they actually act, buy, sign up, or reach out). Different channels are naturally stronger at different stages. Social and content are usually better at awareness. Search captures people already at consideration. Email is extremely good at pushing someone from consideration into conversion, since they already know you. None of this is a strict rule, but it's a far better starting mental model than treating every channel like it's supposed to do everything.",
        ],
        tryThis:
          "Pick a business you know well (yours, an employer's, or one you admire). Write one sentence for each stage \u2014 awareness, consideration, conversion \u2014 describing what that business is currently doing, if anything, at each stage. The gaps you find are usually the actual opportunity.",
        quiz: {
          question: "Why is email often described as the cheapest marketing channel?",
          options: [
            "Because email software is always free",
            "Because you're reaching people who already opted in once, instead of paying to find them again",
            "Because email has the highest click rates of any channel",
            "Because it doesn't require any content to be written",
          ],
          correct: 1,
          explain: "Email reaches an audience that already said yes once, so you're not paying (in ads or effort) to reach them again the way you would with cold channels.",
        },
      },
      {
        id: "copy-that-gets-clicked",
        title: "Writing copy that gets clicked, not scrolled past",
        minutes: 15,
        body: [
          "Most marketing copy fails for a boring reason: it's about the company, not the reader. \u201cWe've been serving customers since 2015 with a passion for excellence\u201d tells the reader nothing about what's in it for them, and they will scroll past it in under a second, because their brain is specifically wired to ignore things that don't seem relevant to them.",
          "A headline's only job is to make the very next line worth reading. It doesn't need to be clever. It needs to be specific and about the reader. \u201cCut your food delivery time in half\u201d beats \u201cRevolutionary delivery technology\u201d every time, because the first one is a concrete outcome the reader can picture, and the second is a claim about the company that requires the reader to do translation work their brain won't bother doing.",
          "Specificity beats cleverness almost everywhere in marketing copy. \u201cSave money on groceries\u201d is forgettable. \u201cSave around \u20a68,000 a month on groceries without changing where you shop\u201d is memorable, because a specific, believable number does something a vague claim can't: it lets the reader picture the actual outcome in their own life.",
          "Calls-to-action fail for a very specific, fixable reason: they describe an action instead of an outcome. \u201cClick here\u201d or \u201cSubmit\u201d tell the reader what to physically do but not why. \u201cGet my free resume score\u201d or \u201cStart saving today\u201d tell them what they'll walk away with, which is a completely different, much stronger kind of motivation. Whenever you're stuck on a button's wording, finish this sentence in your head: after clicking, the person will get ___. Put that ___ on the button instead of a generic verb.",
          "One habit that instantly improves most marketing copy: read it back and count how many times you used \u201cwe,\u201d \u201cour,\u201d or the company name, versus \u201cyou\u201d and \u201cyour.\u201d If the \u201cwe\u201d count is higher, you're probably writing an internal memo about yourself, not copy aimed at a reader who is, understandably, more interested in themselves than in you.",
        ],
        tryThis:
          "Take one piece of marketing copy you've written or seen recently \u2014 an ad, a social caption, an email subject line. Rewrite it once, replacing every instance of \u201cwe/our/company name\u201d with a \u201cyou/your\u201d framing focused on the reader's outcome instead.",
        quiz: {
          question: "Why does \u201cGet my free resume score\u201d tend to outperform \u201cClick here\u201d as a call-to-action?",
          options: [
            "It uses more words, which always performs better",
            "It describes the outcome the reader gets, not just the physical action",
            "It includes the word free, which is required by law to be included",
            "It's shorter and therefore easier to read",
          ],
          correct: 1,
          explain: "Effective CTAs tell the reader what they'll walk away with, which motivates action far more than describing the click itself.",
        },
      },
      {
        id: "social-that-builds-audience",
        title: "Social media that builds an audience, not just posts",
        minutes: 15,
        body: [
          "Posting randomly whenever you think of something is the single most common reason small accounts stay small. Not because the individual posts are bad, but because there's no pattern for people to learn to expect, and audiences are built on expectation as much as on content quality.",
          "Content pillars solve this. Instead of asking \u201cwhat do I post today,\u201d pick three to five recurring themes relevant to your audience, and rotate through them. For a small skincare business, pillars might be: ingredient education, customer results, behind-the-scenes, and common myths debunked. This does two things at once: it makes content far easier to plan (you're choosing from five lanes, not inventing from nothing), and it trains your audience to know what kind of value to expect from you, which is exactly what turns casual scrollers into actual followers.",
          "Consistency matters more than frequency for most small accounts starting out. Posting three times a week, every week, for three months, will usually outperform posting daily for two weeks and then going quiet, because algorithms and audiences both respond to reliability. If you can only realistically sustain two posts a week long-term, plan for two, and do them well, rather than burning out trying to hit a schedule you can't maintain.",
          "The first line or first three seconds of any post carries almost all the weight. On text posts, that's your opening line, not your headline graphic. On video, it's the first three seconds before someone's thumb decides to keep scrolling. A useful test: could someone understand what this post is about and why they'd care, from only the first sentence or first three seconds? If not, that's usually the actual fix needed, more than the rest of the content.",
          "Engagement (comments, saves, shares) matters more than raw likes for actually growing, since most platforms show content to more people specifically when early viewers engage meaningfully, not just when they tap a like button. Ending a post with a genuine, specific question \u2014 not a generic \u201cthoughts?\u201d \u2014 is a simple, repeatable way to invite that engagement.",
        ],
        tryThis:
          "Write down three to five content pillars for a business or personal brand you're thinking about. For each pillar, list one specific post idea you could actually publish this week.",
        quiz: {
          question: "Why do content pillars help a small social media account grow?",
          options: [
            "They guarantee a post will go viral",
            "They make planning easier and train the audience to know what value to expect",
            "They are required by every social media platform's algorithm",
            "They eliminate the need to post consistently",
          ],
          correct: 1,
          explain: "Pillars simplify content planning and build audience expectation, which is a major driver of turning casual viewers into regular followers.",
        },
      },
      {
        id: "metrics-that-matter",
        title: "Reading your numbers: the metrics that actually matter",
        minutes: 15,
        body: [
          "Early in my career I celebrated a post that got thousands of likes and almost no one who actually visited the website linked in it. Likes felt like success. They weren't, at least not for the actual business goal, which was website visits and, eventually, sales. That gap between a number that feels good and a number that means something is the single biggest trap in reading marketing metrics.",
          "Vanity metrics (likes, followers, impressions) tell you something happened, but not whether it mattered. Performance metrics (click-through rate, conversion rate, cost per acquisition) tell you whether it actually moved someone toward the outcome you wanted. Both have a place, but only one should decide whether you keep doing something or change it.",
          "Click-through rate, or CTR, is simply the percentage of people who saw something and then clicked it. If 1,000 people saw an ad and 20 clicked, that's a 2% CTR. This tells you whether your message and targeting are actually relevant to the people seeing it, independent of what happens after the click.",
          "Conversion rate is the percentage of people who took your desired action after landing on your page, whether that's buying, signing up, or filling a form. A high CTR with a low conversion rate usually means the ad promised something the landing page didn't deliver, which is an extremely common and fixable mismatch worth checking before blaming the ad itself.",
          "Cost per acquisition, or CAC, is simply how much you spent to get one customer or one signup. This is the number that actually tells you whether a campaign was worth running, because a campaign can have a great CTR and still lose money if the CAC is higher than what that customer is worth to you. Whenever someone reports a marketing \u201cwin,\u201d the first question worth asking is which of these numbers actually improved, and by how much, rather than accepting a feeling of success at face value.",
        ],
        tryThis:
          "Think of a recent ad, post, or email you remember seeing (yours or someone else's). Guess what its CTR, conversion rate, and CAC might have looked like based on what you observed, then write down what additional information you'd need to know for sure.",
        quiz: {
          question: "What does a high click-through rate combined with a low conversion rate usually suggest?",
          options: [
            "The campaign is performing perfectly",
            "The ad or message promised something the landing page didn't actually deliver",
            "The budget was too small",
            "The audience was too large",
          ],
          correct: 1,
          explain: "Strong CTR with weak conversion usually points to a mismatch between what was promised and what the landing experience actually delivered.",
        },
      },
      {
        id: "first-small-campaign",
        title: "Running your first small campaign",
        minutes: 15,
        body: [
          "The biggest mistake I see in a first campaign isn't the budget size, the platform choice, or even the creative \u2014 it's not having one clear goal before spending a single naira. \u201cGet more visibility\u201d isn't a goal you can measure, so you'll have no honest way to know if it worked. \u201cGet 50 email signups\u201d or \u201cGet 10 people to book a call\u201d are goals you can actually judge a campaign against.",
          "Start with a budget you're genuinely comfortable losing entirely while you learn, not a budget you're counting on for results. A first campaign is primarily a learning exercise, even if it does produce results, and treating it that way removes a lot of the pressure that leads people to panic-change everything after two days of data, which is far too little time to judge anything.",
          "Targeting should start narrower than feels comfortable, not broader. A common instinct is to target \u201ceveryone who might be interested\u201d to maximize reach, but a narrow, specific audience (a defined age range, location, and interest) almost always performs better for a first campaign, because your message can actually speak directly to that specific person instead of trying to be relevant to everyone at once, which usually means being relevant to no one in particular.",
          "Build in a genuine test rather than guessing. Even something simple \u2014 two versions of the same ad with different headlines, shown to similar audiences \u2014 tells you something real about what resonates, instead of relying on your own opinion about which version is better. Small first campaigns rarely have the budget for a rigorous test, but even an informal one beats none at all.",
          "Give it enough time before judging it. Two or three days of data on a small budget is usually just noise. A more honest read comes after the campaign has run long enough to spend a meaningful chunk of the budget, so wait for that before deciding whether to adjust, kill, or scale it up.",
        ],
        tryThis:
          "Write a one-paragraph plan for a small campaign you could realistically run: the specific goal, the budget you're comfortable risking, the audience, and the one thing you'd test between two versions.",
        quiz: {
          question: "Why is having one clear, measurable goal the most important part of a first campaign?",
          options: [
            "It guarantees the campaign will succeed",
            "Without it, there's no honest way to judge afterward whether the campaign actually worked",
            "Platforms require a stated goal before allowing any ad to run",
            "It determines the exact budget you must spend",
          ],
          correct: 1,
          explain: "A vague aim like 'more visibility' can't be judged after the fact \u2014 a specific, measurable goal is what makes the campaign's result meaningful.",
        },
      },
    ],
  },
];

export function getCourseBySlug(slug: string): CuratedCourse | undefined {
  return CURATED_COURSES.find((c) => c.slug === slug);
}
