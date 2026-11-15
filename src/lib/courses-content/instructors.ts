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
    title: "Public Speaking & Presentation Coach",
    bio: "David has run presentation and public speaking training for new hires and mid-level managers at three multinational companies, after years managing customer-facing teams where he regularly had to brief leadership, pitch ideas, and defend decisions on the spot. He's coached everyone from first-time presenters freezing up before a five-person team update to managers preparing for all-hands addresses to hundreds of people.",
    greeting: "Hey, I'm David. I've spent years coaching people through presentations that terrified them \u2014 a first team update, a pitch to leadership, a room full of people waiting for someone to say something useful. The nerves don't fully disappear, even for people who do this constantly, including me. This course isn't about becoming a different, more polished version of yourself. It's about having real structure and enough practice that you can say what you actually mean, clearly, even when you're nervous. Let's get into it.",
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
  yakubu: {
    id: "yakubu",
    name: "Yakubu Bello",
    title: "Customer Service Team Lead",
    bio: "Yakubu has run support desks for a telecoms company and an e-commerce startup, which between them means he's personally handled or supervised tens of thousands of customer conversations — furious ones, confused ones, and everything in between. He trains new hires the same way he wishes someone had trained him: with real conversations, not scripts to memorize.",
    greeting: "Hi, I'm Yakubu. I've spent years on support desks, which means I've been shouted at more times than I can count, and I've also seen quiet, simple techniques turn a furious customer into a genuinely grateful one. This course isn't scripts to memorize — it's the actual judgment calls behind good customer service, the kind you can't fake your way through.",
    initials: "YB",
    gradient: ["#14B8A6", "#4F46E5"],
    voiceProfile: { pitch: 0.88, rate: 0.97, preferGender: "male" },
  },
  blessing: {
    id: "blessing",
    name: "Blessing Etim",
    title: "Virtual Assistant & Remote Work Consultant",
    bio: "Blessing built a virtual assistant business from a single client to a full roster of international clients across three time zones, before moving into coaching other VAs. She's made most of the early mistakes herself — underpricing, saying yes to everything, losing track of who needed what — which is exactly why she teaches the systems that fix them.",
    greeting: "Hi, I'm Blessing. I built my virtual assistant work from one nervous client to a full roster of people across different time zones, and I made almost every mistake possible along the way — underpricing myself badly being the big one. This course is the version of that journey with the mistakes already taken out.",
    initials: "BE",
    gradient: ["#D6336C", "#7048E8"],
    voiceProfile: { pitch: 1.07, rate: 1.0, preferGender: "female" },
  },
  tobi: {
    id: "tobi",
    name: "Tobi Fashola",
    title: "AI & Automation Consultant",
    bio: "Tobi spent three years building no-code automations for small businesses that couldn't afford a developer — connecting their forms, spreadsheets, inboxes and AI tools together so repetitive work stopped eating their week. He's allergic to AI hype; his whole approach is built around one question: does this actually save real time, or does it just look impressive?",
    greeting: "Hi, I'm Tobi. I've spent years building automations for small businesses, and if there's one thing I've learned, it's that most people massively overestimate how complicated this needs to be, and massively underestimate how much time a few small automations can hand back. No hype here, just what actually works.",
    initials: "TF",
    gradient: ["#8B5CF6", "#06B6D4"],
    voiceProfile: { pitch: 0.95, rate: 1.05, preferGender: "male" },
  },
  halima: {
    id: "halima",
    name: "Halima Sani",
    title: "AI Prompt Engineer",
    bio: "Halima started as a copywriter before moving into prompt engineering work for companies trying to get consistent, usable output from AI models instead of impressive-sounding nonsense. Her background in writing turned out to be the actual advantage — prompting well is mostly a language and clarity problem wearing a technical name.",
    greeting: "Hi, I'm Halima. I came into this from copywriting, not computer science, and that's exactly why I think I'm good at it — prompting is really a communication skill, not a technical one. This course is everything I wish someone had told me in my first month, instead of the vague 'just be clearer' advice everyone gives.",
    initials: "HS",
    gradient: ["#0EA5E9", "#F59E0B"],
    voiceProfile: { pitch: 1.02, rate: 0.95, preferGender: "female" },
  },
  zainab: {
    id: "zainab",
    name: "Zainab Yusuf",
    title: "Self-Published Author & AI Illustrator",
    bio: "Zainab has self-published several illustrated children's books using AI image generation as her illustration pipeline, after years of the traditional route being too expensive to even attempt. She's learned the real, unglamorous parts most tutorials skip — keeping a character looking the same page to page, and what actually happens between a finished image and a printed book.",
    greeting: "Hi, I'm Zainab. I always wanted to make children's books, but hiring an illustrator for a whole book was never something I could afford. Learning to do this properly with AI tools changed that completely, but it took me a lot of frustrating trial and error to get characters looking consistent. This course skips the trial and error part.",
    initials: "ZY",
    gradient: ["#F472B6", "#FBBF24"],
    voiceProfile: { pitch: 1.08, rate: 0.96, preferGender: "female" },
  },
  chuka: {
    id: "chuka",
    name: "Chuka Nnamdi",
    title: "Self-Taught Software Developer & Coding Instructor",
    bio: "Chuka taught himself to code from free resources over two frustrating, confusing years, without a computer science degree, before landing his first developer role. He remembers exactly which parts of learning to program felt genuinely confusing rather than just hard, which is precisely what he built this course to fix.",
    greeting: "Hi, I'm Chuka. I taught myself to code the slow, confusing way, without a computer science background, so I know exactly which parts feel genuinely disorienting when you're starting out. Nothing here assumes you already think like a programmer — that's exactly the part we're building together.",
    initials: "CN",
    gradient: ["#22C55E", "#3B82F6"],
    voiceProfile: { pitch: 0.9, rate: 0.94, preferGender: "male" },
  },
  musa: {
    id: "musa",
    name: "Musa Danladi",
    title: "Operations Analyst & Excel Trainer",
    bio: "Musa has spent years running budgets, reports and operations data almost entirely in Excel, most of it self-taught out of necessity rather than formal training. He trains new analysts on his team the way he wishes someone had trained him — the handful of skills that cover most real work, not an exhaustive tour of every function that exists.",
    greeting: "Hi, I'm Musa. I've lived in spreadsheets for most of my career, and almost everything I know I picked up by needing it urgently, not from a course. This is that knowledge organized properly — the parts of Excel that actually get used constantly, not a tour of every feature that exists.",
    initials: "MD",
    gradient: ["#CA8A04", "#65A30D"],
    voiceProfile: { pitch: 0.93, rate: 0.98, preferGender: "male" },
  },
};
