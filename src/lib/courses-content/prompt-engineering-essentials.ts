import type { CuratedCourse } from "./types";

export const promptEngineeringEssentials: CuratedCourse = {
  slug: "prompt-engineering-essentials",
  title: "Prompt Engineering Essentials",
  subtitle: "Prompting is a communication skill wearing a technical name — here's the craft of it.",
  instructorId: "halima",
  level: "Beginner",
  hours: "2 hours",
  summary:
    "A practical course on getting genuinely useful output from AI models: why vague prompts get vague answers, giving context the AI can't guess, asking for the right format, iterating instead of restarting, and the common mistakes that quietly ruin results.",
  outcomes: [
    "Explain why identical AI models give wildly different quality answers to different prompts",
    "Add the context an AI model needs but can't guess on its own",
    "Ask for output in a format you can actually use without heavy editing",
    "Iterate on an AI response instead of starting over from scratch each time",
    "Recognize the common prompting mistakes that quietly produce weak results",
  ],
  lessons: [
    {
      id: "why-quality-varies",
      title: "Why the same AI gives you different quality answers",
      minutes: 13,
      body: [
        "People often conclude an AI model is \u201cbad at\u201d something after one disappointing answer, when the actual issue was the prompt, not the model. Two people can ask the same AI model about the same topic and get wildly different quality answers, purely because of how specifically they asked.",
        "\u201cWrite me a marketing email\u201d and \u201cWrite a 150-word marketing email announcing a 20% discount on winter boots, aimed at existing customers, in a warm but not overly salesy tone\u201d will produce very different quality results, even though both are grammatically valid requests. The second one removes almost all the guessing the model would otherwise have to do.",
        "This isn't really different from working with a new human employee who doesn't know your business yet. \u201cHandle the customer emails\u201d gives a new hire almost nothing to go on. \u201cReply to billing complaints using this tone, escalate anything over $500, and always confirm the account number first\u201d gives them what they need to actually do it well. AI models need the same kind of specific direction, every single time, since they don't retain what worked well in a previous unrelated conversation.",
        "A useful habit: before sending a prompt, ask yourself what a new employee would need to know to do this task well, that you haven't already said out loud. Almost always, the gap between a mediocre AI answer and a great one is exactly that missing information, not some deeper limitation of the model itself.",
      ],
      tryThis:
        "Take a vague request you might normally give an AI model (\u201cwrite me a bio,\u201d \u201chelp me plan a trip\u201d) and rewrite it with at least three specific details a new employee would need to do it well.",
      quiz: {
        question: "Why can the same AI model produce very different quality answers to seemingly similar questions?",
        options: [
          "The model's quality randomly changes throughout the day",
          "Prompt specificity removes guesswork the model would otherwise have to fill in on its own",
          "Some questions are technically impossible for AI to answer",
          "It only happens with certain topics",
        ],
        correct: 1,
        explain: "A vague prompt leaves gaps the model has to guess how to fill, and different guesses produce different quality outcomes — specificity closes those gaps.",
      },
    },
    {
      id: "giving-context",
      title: "Giving context the AI can't guess",
      minutes: 13,
      body: [
        "An AI model has no memory of your business, your audience, or your goals unless you tell it, every time, in the conversation itself. This is the single most common gap between a flat, generic answer and a genuinely useful one: missing context that lives entirely in your head and never made it into the prompt.",
        "Four kinds of context consistently make the biggest difference: who the output is for (a technical audience versus a general one changes everything about word choice), what the goal is (informing versus persuading versus entertaining), what tone fits (formal, casual, playful, serious), and any hard constraints (a word limit, things that must be included or avoided).",
        "Role framing is a simple, powerful shortcut for supplying a lot of context at once. \u201cYou're an experienced pediatric nurse explaining this to a worried new parent\u201d instantly shapes vocabulary, tone, and level of reassurance, in a way that a plain instruction like \u201cexplain this simply\u201d doesn't achieve nearly as well on its own.",
        "Examples are an underused, extremely effective form of context. Rather than trying to describe a style in the abstract, showing one or two examples of the tone or format you want (\u201cwrite it more like this example\u201d) often gets a far more accurate result than any amount of adjective-based description like \u201cmake it punchier.\u201d",
      ],
      tryThis:
        "Pick something you'd want to ask an AI model to write. Add all four context types from this lesson \u2014 audience, goal, tone, and one hard constraint \u2014 to the request.",
      quiz: {
        question: "Why does role framing (\u201cyou are an experienced X explaining this to Y\u201d) tend to work so well?",
        options: [
          "It makes the AI model run faster",
          "It efficiently supplies audience, tone, and vocabulary context all at once",
          "It's required for the AI to understand the question at all",
          "It only affects the length of the response",
        ],
        correct: 1,
        explain: "A single role-framing sentence can carry several kinds of context simultaneously, which is why it's such an efficient prompting technique.",
      },
    },
    {
      id: "asking-for-format",
      title: "Asking for the right format",
      minutes: 12,
      body: [
        "A technically correct, well-written answer in the wrong format still creates real work for you, because you now have to manually restructure it into something usable. Asking for the right format up front is one of the cheapest ways to save yourself significant editing time later.",
        "Be explicit about structure: bullet points versus flowing paragraphs, a specific word or character count, a table with named columns, numbered steps. \u201cGive me this as a table with columns for Task, Owner, and Deadline\u201d removes any ambiguity about what shape the output should take, compared to just asking for \u201cinformation about the tasks.\u201d",
        "Length constraints matter more than people expect. Without one, AI models often default to a longer, more thorough-sounding answer than you actually need for the context, which then requires you to trim it down yourself. Stating a rough length upfront, like \u201cin about 100 words\u201d or \u201cin three sentences,\u201d usually gets you closer to something you can use immediately.",
        "For anything you're going to reuse as a template, ask for the output in the exact structure you'll need to paste it into elsewhere \u2014 plain text, markdown, a specific heading structure. Matching the destination format from the start avoids a second reformatting pass that's easy to forget you'll need until it's already too late.",
      ],
      tryThis:
        "Take a request you might make of an AI model and add a specific format instruction to it \u2014 a word count, a table structure, or a numbered list \u2014 that matches exactly how you'd actually want to use the output.",
      quiz: {
        question: "Why does specifying a length constraint upfront tend to save editing time?",
        options: [
          "It makes the AI model respond faster",
          "Without one, responses often default to longer than needed, requiring you to trim it down yourself afterward",
          "It's a technical requirement for most AI models",
          "It has no real effect on the final response",
        ],
        correct: 1,
        explain: "AI models often default toward thorough, longer answers unless told otherwise, so stating a length upfront avoids an unnecessary editing pass.",
      },
    },
    {
      id: "iterating-not-restarting",
      title: "Iterating instead of starting over",
      minutes: 12,
      body: [
        "A common, inefficient habit is rewriting an entire prompt from scratch every time a response isn't quite right, instead of simply telling the AI model what specifically was wrong and asking it to adjust. Iteration is almost always faster and produces better results than starting over.",
        "Give feedback the way you would to a person: specific and about the actual gap. \u201cThis is too formal, make it sound more like a quick note to a colleague\u201d gives the model something concrete to change. \u201cThis isn't quite right, try again\u201d gives it almost nothing to work with, and often produces an equally wrong answer in a new, different way.",
        "For anything genuinely complex, breaking a big ask into smaller steps across a conversation usually beats one giant, all-in-one prompt. Asking for an outline first, approving or adjusting it, then asking for the full draft based on that approved outline, produces a far more accurate final result than requesting the finished piece in one shot and hoping it lands correctly.",
        "It's worth remembering that a conversation with an AI model carries context forward within that same conversation, which is exactly what makes iteration so effective \u2014 you don't need to re-explain everything each time, just the specific adjustment. Starting a brand new conversation loses that accumulated context, which is often why a fresh attempt at the same task feels like it's starting from zero.",
      ],
      tryThis:
        "Think of a recent AI response that wasn't quite what you wanted. Write the specific, concrete feedback you could have given instead of starting the whole prompt over.",
      quiz: {
        question: "Why does giving specific feedback (\u201ctoo formal, make it sound like a quick note\u201d) work better than \u201ctry again\u201d?",
        options: [
          "It's shorter to type",
          "It gives the model a concrete gap to close, instead of guessing what was wrong in a new way",
          "The AI model ignores vague feedback entirely",
          "It only matters for very long conversations",
        ],
        correct: 1,
        explain: "Vague feedback like 'try again' still leaves the model guessing what was actually wrong, which can just produce a different kind of wrong answer.",
      },
    },
    {
      id: "common-mistakes",
      title: "Common mistakes that quietly ruin your results",
      minutes: 10,
      body: [
        "Stacking too many separate asks into one prompt is one of the most common mistakes: \u201cwrite this email, and also suggest three subject lines, and also tell me if the tone is right, and also shorten it\u201d tends to produce a rushed, uneven attempt at all four instead of one strong result at any of them. Splitting these into separate, sequential requests almost always produces better quality on each one.",
        "Forgetting to state the audience is a quiet, easy-to-miss mistake, because the request often reads as complete without it. \u201cExplain quantum computing\u201d is answerable at wildly different levels of complexity, and without an audience specified, the model has to guess which one you actually wanted, which is exactly the kind of gap from the first lesson.",
        "Trusting a confident-sounding answer without checking it is a genuinely important habit to build, especially for facts, numbers, or anything with real consequences if wrong. AI models can state incorrect information with exactly the same confident tone as correct information, so confidence in the writing itself is never a signal of accuracy on its own.",
        "Not providing an example when one would clearly help is a missed opportunity more than an active mistake, but it's worth naming because it's so easy to fix. If you already have one example of the tone, format, or style you want, even an imperfect one, sharing it usually gets you a far more accurate result than any amount of additional descriptive adjectives.",
      ],
      tryThis:
        "Look back at a recent prompt you've written or can imagine writing. Check it against this lesson: did it stack too many asks together, and did it clearly state the audience?",
      quiz: {
        question: "Why is stacking many separate asks into one prompt often counterproductive?",
        options: [
          "AI models have a strict limit on how many sentences they can read",
          "It tends to produce a rushed, uneven attempt at all of them instead of a strong result at any one",
          "It costs significantly more to run",
          "Most AI models refuse prompts with multiple requests",
        ],
        correct: 1,
        explain: "Splitting a multi-part request into separate, sequential prompts generally produces stronger quality on each individual part.",
      },
    },
  ],
};
