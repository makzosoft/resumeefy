import type { CuratedCourse } from "./types";

export const introductionToProgramming: CuratedCourse = {
  slug: "introduction-to-programming",
  title: "Introduction to Programming",
  subtitle: "How to actually think like a programmer, before worrying about any specific language.",
  instructorId: "chuka",
  level: "Beginner",
  hours: "2.5 hours",
  summary:
    "A concept-first introduction to programming for complete beginners: what programming really is, how to think in variables and steps, using conditionals and loops to make a program actually respond to different situations, debugging without panicking, and where to go next without falling into tutorial hell.",
  outcomes: [
    "Explain what programming actually is, in plain terms, without needing prior technical background",
    "Understand variables and sequential execution as the basic building blocks of any program",
    "Use conditionals and loops to make a program respond differently to different situations",
    "Read an error message calmly and debug systematically instead of guessing randomly",
    "Choose a sensible next step for continued learning instead of endlessly restarting from tutorials",
  ],
  lessons: [
    {
      id: "what-programming-is",
      title: "What programming actually is (and why it's not as scary as it looks)",
      minutes: 13,
      body: [
        "I spent almost a year assuming programming required some kind of innate, different way of thinking that I simply didn't have, before realizing that was completely wrong. Programming is just giving a computer extremely precise, step-by-step instructions. The computer does exactly what you tell it, nothing more, nothing clever added on its own.",
        "That precision is actually the whole challenge, and it's a learnable skill, not a fixed talent. Humans are used to giving each other vague instructions and relying on context and common sense to fill the gaps. \u201cMake me a sandwich\u201d works fine between two people. A computer needs every single step spelled out: which bread, how much of which filling, in what order, because it fills in zero gaps on its own.",
        "This is why learning to program often feels like learning to think differently, but it isn't a different kind of intelligence \u2014 it's a habit of breaking things into small, exact, ordered steps, which genuinely gets easier with practice, the same way any specific skill does. Nobody is born naturally thinking in precise steps; it's built through doing it repeatedly.",
        "One thing worth saying directly: feeling confused early on is not a sign you're bad at this, it's just what learning programming actually feels like for almost everyone at the start, including people who go on to do it professionally. The confusion is the normal cost of learning something genuinely new, not evidence you're not cut out for it.",
      ],
      tryThis:
        "Write out, in plain English, the exact precise steps needed to make a cup of tea, as if explaining it to someone who has never seen tea, water, or a cup before. Notice how many small steps you'd normally skip in conversation.",
      quiz: {
        question: "What is the core skill programming actually requires, according to this lesson?",
        options: [
          "A rare, innate type of intelligence most people don't have",
          "Breaking tasks into small, exact, ordered steps, which is learnable through practice",
          "Memorizing an entire programming language before starting",
          "Natural mathematical talent",
        ],
        correct: 1,
        explain: "Programming is fundamentally about precision and breaking things into ordered steps, a habit that's built through practice rather than an innate, fixed talent.",
      },
    },
    {
      id: "variables-and-steps",
      title: "Variables, values, and thinking in steps",
      minutes: 14,
      body: [
        "A variable is just a labeled container for a piece of information the program needs to remember and possibly change later. If you write something like age = 25, you've created a container named age currently holding the value 25 \u2014 nothing more mysterious than that, even though the word \u201cvariable\u201d sounds intimidating the first time you hear it.",
        "The reason variables matter is that programs need to remember things between steps. Without a way to store a value, a program could only ever react to information in the exact instant it appeared, with no way to use it again a moment later. A variable is what lets a program carry information forward through its steps.",
        "Programs run in order, one instruction after another, top to bottom, unless something specifically redirects that order (which is exactly what the next lesson, on conditionals and loops, covers). This sequential nature means the order you write instructions in genuinely matters \u2014 a step that depends on a variable has to come after that variable was actually set, not before.",
        "A simple, very common beginner mix-up: assuming a variable's value stays whatever it was set to originally, when in fact reassigning it (age = 26) simply overwrites the old value with the new one, discarding the previous value entirely unless it was saved somewhere else first. Thinking of a variable as a labeled box you can put a new item into, replacing whatever was there before, usually clears this up.",
      ],
      tryThis:
        "Write out, step by step in plain English, what happens to a variable called score if you set it to 0, then add 10 to it, then add 5 more, tracking exactly what value it holds after each step.",
      quiz: {
        question: "What happens when you reassign a variable to a new value?",
        options: [
          "The old value is kept alongside the new one automatically",
          "The new value overwrites and replaces the old one",
          "The program creates an error",
          "Nothing happens until the program restarts",
        ],
        correct: 1,
        explain: "A variable holds one value at a time — reassigning it replaces whatever was previously stored, unless the old value was explicitly saved elsewhere first.",
      },
    },
    {
      id: "conditionals-and-loops",
      title: "Making decisions and repeating actions: conditionals and loops",
      minutes: 15,
      body: [
        "Without conditionals and loops, a program can only ever do the exact same fixed sequence of steps every single time, regardless of the situation, which makes it nearly useless for anything real. These two tools are what let a program actually respond differently depending on what's happening.",
        "A conditional (an if statement) lets a program check something and branch its behavior based on the answer: if the temperature is below zero, print \u201cit's freezing,\u201d otherwise print something else. This is the mechanism that lets a program make a decision at all, rather than blindly running the same steps regardless of circumstances.",
        "A loop lets a program repeat a set of steps, either a specific number of times or until some condition is met, without you writing that same block of instructions out over and over by hand. Printing \u201chello\u201d ten times could be ten separate written lines, or one loop that repeats a single line ten times \u2014 the loop version is what scales to a thousand repetitions just as easily as ten.",
        "These two tools combine constantly in real programs: a loop that goes through a list of items, checking a condition on each one with an if statement, and doing something different depending on the result. This exact combination \u2014 loop plus conditional \u2014 is behind an enormous share of what real, useful programs actually do, from filtering a list to processing a batch of files.",
        "A common early confusion: an if statement runs its check once and moves on, while a loop's whole point is repetition. Mixing these up \u2014 expecting an if statement to keep checking repeatedly on its own \u2014 is one of the most frequent beginner misunderstandings, and it's worth deliberately keeping the two roles distinct in your head.",
      ],
      tryThis:
        "Describe, in plain English, a small real-world scenario that would need both a loop and a conditional together — for example, going through a list of emails and flagging only the ones from a specific sender.",
      quiz: {
        question: "What is the key difference in purpose between a conditional (if statement) and a loop?",
        options: [
          "They do exactly the same thing",
          "A conditional makes a one-time decision; a loop repeats a set of steps",
          "A loop only works with numbers, while a conditional works with any data",
          "A conditional is always faster than a loop",
        ],
        correct: 1,
        explain: "A conditional branches behavior based on a single check, while a loop's core purpose is repeating steps — mixing up these two roles is a very common early confusion.",
      },
    },
    {
      id: "debugging-without-panic",
      title: "Why your code breaks (and how to debug without panicking)",
      minutes: 13,
      body: [
        "Every single programmer, at every level of experience, deals with code that doesn't work as expected, constantly. The difference between a beginner and someone experienced usually isn't fewer errors \u2014 it's a calmer, more systematic response to them.",
        "An error message is information, not a verdict on your ability. It's genuinely trying to tell you something specific: often the type of problem and roughly where it happened. Reading it slowly and completely, rather than skimming past it in a moment of panic, usually reveals more than you'd expect on a first careful read.",
        "A useful systematic habit: when something breaks, check the most recent change you made first, before assuming the problem is somewhere else entirely. If code was working a few minutes ago and now isn't, the change you just made is overwhelmingly the most likely place the problem lives, not some unrelated part of the program you haven't touched.",
        "Printing the current value of a variable at different points in your code, to check whether it actually holds what you expect it to at that moment, is a simple, extremely effective debugging technique that beginners often skip in favor of just staring at the code trying to spot the problem by reading alone. Seeing the actual value, rather than assuming what it probably is, catches a huge share of bugs quickly.",
        "Give yourself permission to step away from a stubborn bug for a few minutes. This isn't avoidance \u2014 a fresh look after a short break genuinely catches things a tired, frustrated, too-close look keeps missing, and this is common enough among experienced developers that it's a widely shared, deliberate habit, not a beginner crutch.",
      ],
      tryThis:
        "Think of a time something didn't work the way you expected, in any context, not necessarily code. Write down what your very first troubleshooting step was, and whether it matches the \u201ccheck what changed most recently\u201d habit from this lesson.",
      quiz: {
        question: "When code that was working suddenly breaks, what's usually the most effective first thing to check?",
        options: [
          "Rewrite the entire program from scratch",
          "The most recent change you made, since it's the most likely source of the new problem",
          "A completely unrelated part of the code you haven't touched",
          "Whether your computer needs to be restarted",
        ],
        correct: 1,
        explain: "If something was working before a recent change and now isn't, that recent change is overwhelmingly the most likely place the new problem was introduced.",
      },
    },
    {
      id: "what-to-build-next",
      title: "What to build next and how to keep learning",
      minutes: 12,
      body: [
        "A common trap after finishing an intro course is jumping straight into another intro course, then another, without ever building anything real in between \u2014 often called tutorial hell. Tutorials feel productive because you're always making visible progress, but that progress doesn't always transfer into being able to build something on your own from a blank file.",
        "The fix is deliberately uncomfortable at first: pick a genuinely small project, smaller than feels impressive, and build it without a tutorial guiding every step. A simple to-do list, a basic calculator, a program that renames a batch of files a certain way \u2014 small, useful, finishable projects teach far more than a fourth tutorial on the same core concepts you already sort of know.",
        "Expect to get stuck constantly on your first few independent projects, and treat getting stuck as the actual point, not a sign something's wrong. Struggling to figure out how to apply what you learned, then figuring it out, even slowly and clumsily, is exactly the process that turns tutorial-following into genuine, independent understanding.",
        "Pick one language and stick with it for a real stretch of time before considering switching. Bouncing between languages early, chasing whichever one seems more popular this month, resets a lot of the mental progress you've built without adding much real benefit, since the core concepts from this course \u2014 variables, conditionals, loops, debugging \u2014 transfer almost entirely between languages anyway.",
      ],
      tryThis:
        "Write down one small, specific project idea, smaller than feels impressive, that you could realistically attempt without a tutorial walking you through every step.",
      quiz: {
        question: "Why can repeatedly working through tutorials without building independent projects become a trap?",
        options: [
          "Tutorials teach incorrect information",
          "It feels productive but doesn't necessarily build the ability to work from a blank file on your own",
          "Tutorials are only useful for advanced programmers",
          "It's technically impossible to learn from tutorials",
        ],
        correct: 1,
        explain: "Tutorial hell describes the gap between following guided steps repeatedly and developing the independent problem-solving needed to build something from scratch.",
      },
    },
  ],
};
