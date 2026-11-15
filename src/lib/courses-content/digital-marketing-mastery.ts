import type { CuratedCourse } from "./types";

export const digitalMarketingMastery: CuratedCourse = {
  slug: "digital-marketing-mastery",
  title: "Digital Marketing Mastery",
  subtitle: "How to market something online with a small budget, real numbers, and no buzzwords.",
  instructorId: "kemi",
  level: "Beginner",
  hours: "15+ hours",
  summary:
    "A complete, practical course on digital marketing built around real constraints — limited time, limited budget, and a need for results you can actually measure. From understanding an audience and defining a brand, through content, the major channels, and honest measurement, to running a first real campaign.",
  outcomes: [
    "Understand your audience and define a brand voice and positioning before choosing a single tactic",
    "Write copy, headlines, and content that get clicked and remembered, not scrolled past",
    "Choose and run the right channels — social, SEO, email, paid ads, and partnerships — for your actual audience and budget",
    "Measure what actually matters, set up basic tracking, and test honestly instead of chasing vanity metrics",
    "Plan, launch, diagnose, and scale a first real campaign, with a realistic ninety-day roadmap",
  ],
  lessons: [
    {
      id: "intro-how-marketing-channels-fit-together",
      title: "Intro, and how marketing channels actually fit together",
      minutes: 36,
      intro:
        "Most digital marketing advice treats each channel \u2014 social, email, ads, SEO \u2014 as its own separate world with its own separate rules. In practice, the channels that work best are the ones used as a connected system, not a pile of disconnected tactics. Let's start with how this course is built, then why that distinction matters as much as it does.",
      sections: [
        {
          heading: "What this course covers, and why the order matters",
          illustration: "marketing-course-roadmap",
          paragraphs: [
            "This course has five parts, in a deliberate order. The first part, which you're in now, covers foundations: how channels actually connect, understanding your audience before you touch a single tactic, and defining a brand voice and positioning worth being consistent about.",
            "The second part is content and copy \u2014 writing that gets clicked, headlines, content calendars, storytelling, and the basics of visual content. The third part is channels themselves, covered in real depth: social, SEO, email, paid ads, and partnerships, each with its own practical mechanics. The fourth part is measurement \u2014 which numbers actually matter, tracking, testing, and budgeting across channels. The fifth part is execution: running an actual first campaign, diagnosing when something isn't working, scaling without breaking it, and a realistic ninety-day plan from scratch.",
          ],
        },
        {
          heading: "Why channels work as a system, not in isolation",
          paragraphs: [
            "A common, costly mistake is treating each channel as its own separate project \u2014 a social strategy here, an email strategy there, ads running with no connection to either. In reality, the channels that perform best are the ones feeding each other: content built for social also feeds email and SEO, an audience built organically becomes the audience ads can target more precisely and cheaply, and email nurtures people who found you through a channel that will never convert them on the first visit.",
            "Thinking of your marketing as one connected system, rather than a collection of separate channel projects, is exactly what lets a small team or a single person accomplish far more than the number of hours they have would otherwise suggest.",
          ],
        },
        {
          heading: "What this course is not",
          paragraphs: [
            "This isn't recycled buzzwords, and it isn't advice that quietly assumes you already have a large budget to work with. Everything in this course is built around what's actually achievable with limited time and limited spend, because that's the real starting position for most people and most small businesses, not the exception.",
            "It's also not a course built around chasing whatever platform or tactic is trending this month. Platforms change constantly; the underlying principles \u2014 understanding an audience, writing clearly, measuring honestly \u2014 don't, and that's what this course is actually built around.",
          ],
        },
        {
          heading: "How to actually get value from this course",
          paragraphs: [
            "Every lesson has a \u201ctry this\u201d exercise, and most of them are things you can apply directly to something real \u2014 an actual product, an actual audience, an actual budget, even a small or hypothetical one. Doing the exercises against something real, rather than treating them abstractly, is where this course actually pays off.",
            "The channels module later in this course is large and detailed on purpose. You don't need to use every channel covered there \u2014 part of the value is being equipped to deliberately choose which ones are actually worth your limited time, rather than defaulting to all of them at once.",
          ],
        },
      ],
      tryThis:
        "Think of a product, service, or idea you might market, real or hypothetical. Write one sentence on how you'd currently describe your marketing approach to it \u2014 you'll compare this to how you'd describe it by the end of this course.",
      quiz: {
        question: "According to this lesson, what's the main problem with treating each marketing channel as a separate, disconnected project?",
        options: [
          "Channels should always be run by entirely separate teams",
          "There is no real downside, since every channel works identically",
          "It misses the way channels that feed each other let a small team accomplish far more than their hours alone would suggest",
          "Only large companies with big budgets can run more than one channel at a time",
        ],
        correct: 2,
        explain: "Channels that feed each other \u2014 content supporting SEO and email, an organic audience sharpening paid targeting \u2014 compound in a way that isolated, disconnected efforts never do.",
      },
    },
    {
      id: "understanding-your-audience-first",
      title: "Understanding your audience first",
      minutes: 38,
      intro:
        "The single most common reason marketing underperforms isn't a weak channel or a bad headline \u2014 it's marketing aimed at an audience that was never clearly defined in the first place. This lesson is about getting that foundation right before any tactic gets chosen.",
      sections: [
        {
          heading: "The foundational mistake: channels before audience",
          paragraphs: [
            "It's tempting to start with a channel \u2014 \u201cwe should be on TikTok,\u201d \u201cwe need an email newsletter\u201d \u2014 before ever clearly answering who exactly you're trying to reach and why they'd care. This gets the order backwards: the audience should drive which channels are worth your time, not the other way around.",
            "A channel is only a place to reach people. If you don't know who those people actually are, what they care about, and where they already spend time, even a technically well-executed channel strategy ends up pointed in the wrong direction.",
          ],
        },
        {
          heading: "Building a real, specific customer profile",
          illustration: "audience-profile-anatomy",
          paragraphs: [
            "\u201cEveryone\u201d is not an audience. A useful profile gets specific: who actually has the problem your product or service solves, what are they trying to accomplish, what do they currently search for or ask about, and where do they already spend time online. A small, specific audience clearly understood is far more valuable than a vague, enormous one described loosely.",
            "Specificity also makes everything downstream easier \u2014 copy, content topics, channel choice, even ad targeting all get dramatically simpler once you can describe, concretely, one real kind of person you're trying to reach.",
          ],
        },
        {
          heading: "Who you wish your audience was vs. who it actually is",
          paragraphs: [
            "It's easy to build an audience profile around who you'd like to be selling to \u2014 a more affluent, more engaged, more glamorous customer than the one you actually have. This quietly produces marketing that appeals to a customer who doesn't exist in meaningful numbers, while overlooking the real people already paying attention.",
            "Look honestly at who is actually buying, engaging, or asking questions right now, even if it isn't the audience you pictured. Real data about real customers, even a small amount of it, beats an idealized picture every time.",
          ],
        },
        {
          heading: "Talking to real customers directly",
          paragraphs: [
            "The highest-signal research method available, and one of the most underused, is simply talking to actual customers or prospects \u2014 a short conversation, a few direct questions, a brief survey, or even reading the messages and reviews they've already left. Ask what problem they were trying to solve when they found you, what almost stopped them from buying, and what words they use to describe it.",
            "That last question is especially valuable: the exact language real customers use to describe their own problem is, in the most literal sense, the copy that will resonate with the next person who has the same problem.",
          ],
        },
        {
          heading: "Letting audience understanding drive channel choice",
          paragraphs: [
            "Once you clearly understand who you're reaching and where they actually spend time, channel choice becomes a straightforward, evidence-based decision rather than a guess or a response to whatever's trending. If your audience is mostly active on one platform, that's where your limited time belongs, regardless of how popular another platform currently is in general.",
          ],
        },
      ],
      tryThis:
        "Write a one-paragraph profile of the single most specific kind of person you're trying to reach: what problem they have, what they currently search for, and where they spend time online. If you can't answer one of those, identify how you could find out.",
      quiz: {
        question: "According to this lesson, what's the most useful thing to learn from talking directly with real customers?",
        options: [
          "The exact language they use to describe their own problem, which is the copy most likely to resonate with the next person",
          "Which competitors have the largest advertising budgets",
          "How many followers each customer has on social media",
          "Whether customers prefer longer or shorter product descriptions in general",
        ],
        correct: 0,
        explain: "The words real customers use to describe their own problem are, quite literally, the language that will resonate with the next person facing the same problem.",
      },
    },
    {
      id: "brand-voice-and-positioning",
      title: "Brand voice and positioning",
      minutes: 36,
      intro:
        "Two businesses can sell nearly the same thing and feel completely different to a customer, purely based on how they sound and what they stand for. This lesson covers the two things that create that difference: your voice, and your positioning.",
      sections: [
        {
          heading: "Brand voice is more than a logo and colors",
          paragraphs: [
            "A brand's visual identity \u2014 logo, colors, fonts \u2014 is only the surface layer. Voice is how a brand actually sounds across every piece of content it produces: formal or casual, playful or serious, direct or warm. It's the difference between a brand that reads like a real, consistent personality and one that reads like it was written by a different person every time.",
            "Voice matters because it's cumulative. Any single post or email is a small moment, but a consistent voice across hundreds of them builds genuine recognition and trust that no single, isolated piece of content ever could.",
          ],
        },
        {
          heading: "Positioning: why someone should choose you specifically",
          paragraphs: [
            "Positioning answers a direct question: out of everything available to a customer, why should they choose you specifically? A clear position is specific \u2014 not \u201cwe offer great quality and service,\u201d which almost every competitor also claims, but something concrete about who you serve best, what you do differently, or what you're genuinely better at.",
            "A useful test: if you could swap a competitor's name into your positioning statement and it would still read as true, it isn't positioning yet \u2014 it's a generic claim anyone in your category could make.",
          ],
        },
        {
          heading: "The risk of sounding like everyone else",
          paragraphs: [
            "In a crowded market, generic marketing disappears \u2014 the same phrases, the same promises, the same stock imagery as every competitor leaves a customer with no real reason to remember or prefer any one of them. Differentiation doesn't require being loud or unusual for its own sake; it requires being specific and genuinely clear about what's actually true and distinct about you.",
          ],
        },
        {
          heading: "A simple way to actually define your voice",
          paragraphs: [
            "Pick three or four adjectives that describe how your brand should sound \u2014 for example, direct, warm, and a little dry \u2014 and then write two or three short example sentences for each: one that sounds like you, and one that definitely doesn't. This turns an abstract idea into something concrete enough to actually guide real writing, and to share with anyone else who ever writes on your behalf.",
            "The \u201cwould never say\u201d examples are often the most useful part, since they draw a real boundary around the voice rather than describing it only in vague, flattering terms.",
          ],
        },
        {
          heading: "Consistency across channels is what makes it work",
          paragraphs: [
            "A voice only becomes recognizable through repetition across every place a customer encounters you \u2014 social posts, emails, your website, even customer replies. This is another place the channels-as-a-system idea from the first lesson applies directly: a consistent voice carrying across all of them is exactly what makes a collection of separate touchpoints feel like one recognizable brand.",
          ],
        },
      ],
      tryThis:
        "Choose three adjectives for your brand's voice. For each one, write one sentence that sounds like your brand and one that definitely doesn't \u2014 and keep the \u201cwould never say\u201d list somewhere you can actually find it later.",
      quiz: {
        question: "According to this lesson, what's a useful test for whether a positioning statement is actually specific?",
        options: [
          "Whether it uses industry buzzwords that sound impressive",
          "Whether it's longer than three sentences",
          "Whether it mentions the founder's name",
          "Whether swapping in a competitor's name would still read as true \u2014 if it would, it isn't specific yet",
        ],
        correct: 3,
        explain: "A generic claim could describe any competitor equally well; real positioning is specific enough that swapping in someone else's name makes it stop being true.",
      },
    },
  ],
};
