import type { CuratedCourse } from "./types";

export const aiIllustratedBookDesign: CuratedCourse = {
  slug: "ai-illustrated-book-design",
  title: "AI Illustrated Book Design",
  subtitle: "Write, illustrate, and lay out a picture book using AI tools, without hiring an illustrator.",
  instructorId: "zainab",
  level: "Beginner",
  hours: "2.5 hours",
  summary:
    "A practical walkthrough of making an AI-illustrated picture book: what the process really involves, writing a story that actually works as a picture book, getting illustrations that look consistent across pages, laying out text and art together, and turning finished files into a publishable book.",
  outcomes: [
    "Describe the full pipeline from story idea to a finished illustrated book, and where the real effort actually goes",
    "Write a picture book manuscript structured for illustration, not just as a short story",
    "Apply techniques that keep a character looking consistent across many AI-generated illustrations",
    "Lay out a page so text and illustration support each other instead of competing",
    "Understand what's involved in taking finished files to a publishable book",
  ],
  lessons: [
    {
      id: "what-this-involves",
      title: "What this actually involves (and setting realistic expectations)",
      minutes: 14,
      body: [
        "My first attempt at an AI-illustrated book took three times longer than I expected, and the slow part wasn't writing the story \u2014 it was getting twenty-four illustrations to actually look like they belonged in the same book. Anyone selling this as a fast, one-click process is skipping the part that actually takes the work.",
        "The realistic pipeline has five stages: writing a manuscript structured for illustration, designing your main character's look in detail, generating illustrations page by page while fighting to keep that character consistent, laying text and images out together, and finally preparing files for however you plan to publish. Each stage has its own specific challenges, which is exactly why we're covering them as separate lessons rather than one blurred process.",
        "Set your expectations honestly around AI image generation's real current limitation: getting a character's face, outfit, and proportions to look identical across many separate generations is genuinely difficult, and no tool fully solves it yet. The next lesson on consistency covers the actual techniques that help, but going in expecting perfect, effortless consistency sets you up for frustration rather than realistic planning.",
        "A finished book is not just a folder of pretty pictures. It needs a manuscript with real structure, a design decision about trim size and page count, and eventually a plan for where and how it'll actually be read \u2014 print-on-demand, a PDF, an e-book platform. Thinking about the destination early shapes decisions you'll make much earlier in the process than most first-time creators expect.",
      ],
      tryThis:
        "Write down the five pipeline stages from this lesson, and next to each one, note which stage you expect to be hardest for you personally, and why.",
      quiz: {
        question: "What is the most commonly underestimated challenge in making an AI-illustrated book?",
        options: [
          "Writing the story text itself",
          "Keeping a character looking consistent across many separate illustrations",
          "Choosing a book title",
          "Deciding on a page count",
        ],
        correct: 1,
        explain: "Character consistency across separately generated images is the specific, genuinely difficult part of the process that most first-time creators don't anticipate.",
      },
    },
    {
      id: "writing-for-picture-books",
      title: "Writing a story that works as a picture book",
      minutes: 13,
      body: [
        "A picture book manuscript is not a short story with pictures added afterward \u2014 it's written specifically to leave room for the illustration to carry part of the meaning. My first draft explained everything in the text, which left the illustrations with nothing left to add, and that's a very common first-timer mistake.",
        "Picture books are typically built around a fixed page-turn rhythm, often 12 to 16 spreads (a spread being the two facing pages a reader sees at once), each carrying a small, complete beat of the story. Writing with that spread structure in mind from the start, rather than a continuous flowing text you chop up later, produces a much more natural pacing.",
        "Keep the text per page genuinely short, especially for younger age ranges \u2014 often just one or two sentences per spread. The instinct to explain more feels safer, but a page crowded with text competes with the illustration for the reader's attention instead of working alongside it.",
        "Write with \u201cshow, don't tell\u201d taken literally here: if the text says \u201cshe was scared,\u201d the illustration should be doing the work of showing that fear, not just decorating the sentence. Leaving genuine room for the picture to say something the words don't is what makes a page feel like a real picture book page, not illustrated prose.",
        "A page-turn should ideally end on a small hook \u2014 a question, a hint of what's coming, a moment of suspense \u2014 that makes turning to the next spread feel necessary rather than optional. This is especially important for children's books, where the physical act of turning the page is part of the reading experience itself.",
      ],
      tryThis:
        "Take one page of a story idea you have (or a short scene) and rewrite it in one or two sentences meant for a single spread, leaving something specific for the illustration to show instead of tell.",
      quiz: {
        question: "Why should picture book text typically be much shorter per page than in regular prose?",
        options: [
          "Publishers require a strict word count by law",
          "A crowded page competes with the illustration instead of working alongside it",
          "Shorter text is always better writing",
          "AI illustration tools can't handle pages with a lot of text",
        ],
        correct: 1,
        explain: "Leaving room on the page lets the illustration carry part of the storytelling weight, rather than competing with dense text for attention.",
      },
    },
    {
      id: "consistent-characters",
      title: "Getting consistent characters and style across illustrations",
      minutes: 15,
      body: [
        "This is the lesson I wish existed when I started. Getting a character to look like the same character across twenty separate illustrations is the single hardest technical part of this whole process, and it's worth taking seriously rather than hoping it works out.",
        "Start with an extremely detailed, written character description before generating anything \u2014 specific hair style and color, exact outfit including colors, distinguishing features, approximate age and build. Vague descriptions like \u201ca young girl\u201d leave enormous room for variation between generations. \u201cA seven-year-old girl with curly black hair in two puffs, a yellow raincoat with a duck print, and round glasses\u201d gives far more to hold onto consistently.",
        "Reuse that exact description, word for word, in every single prompt for that character, rather than paraphrasing it differently each time. Small wording changes between prompts can produce surprisingly large visual differences, so treat your character description as a fixed block of text you copy in every time, not something to casually rewrite from memory.",
        "Many current tools support reference images or character-locking features that let you feed a previously generated image back in as a style anchor for the next one. Learning and using whatever version of this your specific tool offers is usually more effective than description alone, since it gives the model something visual to match, not just words.",
        "Accept some manual cleanup as a normal, expected part of the process, not a failure. Even with the best techniques, some pages will need small edits \u2014 color correction, minor retouching \u2014 to bring them fully in line with the rest of the book. Budgeting time for this cleanup pass from the start avoids the frustration of expecting a perfectly consistent result straight out of generation.",
      ],
      tryThis:
        "Write a full, specific character description (hair, outfit, distinguishing features, age) for a character you might illustrate, detailed enough that you could reuse it word-for-word across many prompts.",
      quiz: {
        question: "Why does reusing the exact same character description across prompts matter?",
        options: [
          "It makes the AI tool generate images faster",
          "Small wording changes between prompts can produce noticeably different visual results",
          "It's required by most AI image generation tools",
          "It only matters for backgrounds, not characters",
        ],
        correct: 1,
        explain: "Because AI image generation is sensitive to exact wording, even small paraphrased changes between prompts can shift how a character looks from one image to the next.",
      },
    },
    {
      id: "layout-text-and-art",
      title: "Laying out pages so text and art work together",
      minutes: 12,
      body: [
        "A beautiful illustration and well-written text can still make a bad page if the layout fights both of them. Text placed directly over a busy part of an illustration becomes hard to read, no matter how good each piece looks on its own.",
        "Look for natural negative space in each illustration \u2014 a plain sky, a calm patch of ground, an empty wall \u2014 and place text there rather than forcing it over the busiest part of the image. If an illustration doesn't have a natural quiet spot, a simple solution is a text box with a soft, semi-transparent background, which keeps words readable without completely hiding the art beneath it.",
        "Keep font choice and size consistent across the whole book. It's tempting to get creative page by page, but a picture book reads as more professional and calmer when the same one or two fonts, at a fairly consistent size, carry the whole story, with variation reserved for a title page or a specific emphasized word here and there.",
        "Match the emotional tone of the text to the illustration on the same page, and check this deliberately rather than assuming it lines up automatically. A cheerful sentence paired with an illustration that reads as anxious or gloomy creates a subtle mismatch that readers, especially children, pick up on even if they can't articulate exactly what feels off.",
      ],
      tryThis:
        "Look at an illustration you have (or imagine one) and identify where the natural negative space is \u2014 the spot where text could sit without competing with the busiest part of the image.",
      quiz: {
        question: "Why is placing text over a natural empty space in an illustration usually better than placing it over a busy area?",
        options: [
          "It's a strict rule enforced by publishing platforms",
          "It keeps the text readable without fighting the illustration for attention",
          "Busy areas of an illustration take longer to generate",
          "It has no real effect on readability",
        ],
        correct: 1,
        explain: "Text over a visually busy area competes with the illustration and becomes harder to read, while natural negative space lets both elements work together.",
      },
    },
    {
      id: "file-to-published-book",
      title: "From file to published book",
      minutes: 12,
      body: [
        "Finishing your illustrations and layout is a major milestone, but there's a real gap between that and an actual publishable file, and underestimating this step is a common way projects stall right at the finish line.",
        "Print-on-demand platforms have specific technical requirements \u2014 trim size, bleed margins so nothing important gets cut off at the edge, minimum image resolution for print quality, a particular file format for upload. These specifics vary by platform and do change over time, so check your chosen platform's current published requirements directly rather than assuming last year's rules still apply.",
        "Your cover deserves separate, deliberate attention from the interior pages. A cover has to work as a small thumbnail image online just as much as a physical print, which means bold, simple, readable-at-small-sizes design usually outperforms something intricate that only reads well at full size.",
        "If you're using AI-generated illustrations, check the current content and disclosure policies of whichever platform you plan to publish through before you finalize everything. These policies are still actively evolving across different platforms, so treat this as something to verify directly and recently, not something to assume based on what you may have read a while ago.",
        "Plan for at least one full proof read-through of the finished, laid-out book, ideally as a physical proof copy if you're printing, before considering it done. Errors that are invisible on a screen \u2014 a slightly cropped image, a color that prints differently than it displayed, a typo missed in five earlier passes \u2014 have a way of surfacing only in the final physical or fully assembled version.",
      ],
      tryThis:
        "Look up the current cover and interior file requirements (trim size, bleed, resolution) for one specific publishing platform you might use, and write down the three that surprised you most.",
      quiz: {
        question: "Why should you check a publishing platform's current requirements directly, rather than relying on general advice?",
        options: [
          "General advice is always wrong",
          "Technical requirements and content policies vary by platform and change over time",
          "Every platform has identical requirements",
          "It's only necessary for print books, not digital ones",
        ],
        correct: 1,
        explain: "Trim sizes, resolution requirements, and content policies differ across platforms and are updated over time, so current, platform-specific verification matters more than general or dated advice.",
      },
    },
  ],
};
