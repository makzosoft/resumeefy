import type { CuratedCourse } from "./types";

export const spreadsheetsWithExcel: CuratedCourse = {
  slug: "spreadsheets-with-excel",
  title: "Spreadsheets with Excel",
  subtitle: "The handful of Excel skills that cover most real work, not a tour of every feature that exists.",
  instructorId: "musa",
  level: "Beginner",
  hours: "2.5 hours",
  summary:
    "A practical, no-fluff Excel course: thinking correctly about rows, columns and cells, the small set of formulas that cover most real needs, formatting that actually aids readability, building a simple summary view from raw data, and the common mistakes that quietly break spreadsheets over time.",
  outcomes: [
    "Think about spreadsheet structure correctly before building anything in it",
    "Use SUM, IF, and a lookup formula confidently for real, common tasks",
    "Apply formatting that improves readability instead of just adding color",
    "Build a simple summary view that turns raw data into something decision-useful",
    "Recognize and avoid the habits that quietly turn a spreadsheet into an unmaintainable mess",
  ],
  lessons: [
    {
      id: "thinking-in-rows-and-columns",
      title: "Thinking in rows, columns, and cells",
      minutes: 13,
      body: [
        "I've fixed more broken spreadsheets caused by bad structure than by any actual formula mistake. Before a single formula gets written, the way data is laid out determines whether everything downstream is going to be easy or painful.",
        "The single most important habit: one row per record, one column per category of information, headers in the very first row, no merged cells in the data area. This sounds almost too simple to matter, but merged cells and inconsistent row structure break sorting, filtering, and formulas in ways that are genuinely difficult to fix later without redoing the whole sheet.",
        "Keep raw data and summary or analysis views on separate sheets, rather than mixing them together on one crowded sheet. A raw data sheet should stay untouched and unopinionated \u2014 just the facts, cleanly structured. Summaries, totals, and charts belong on a separate sheet that references the raw data, which keeps the original data safe from accidental edits and keeps each sheet focused on one job.",
        "Name your sheets and key columns clearly and specifically, not \u201cSheet1\u201d and \u201cSheet2\u201d left as defaults. This feels like a small, cosmetic thing when you're the only one who'll ever open the file, and it stops feeling small the moment you reopen it in six months or hand it to a colleague who has no idea what \u201cSheet2\u201d is supposed to contain.",
      ],
      tryThis:
        "Look at a spreadsheet you currently use or have used before. Check it against the habits in this lesson: one row per record, clean headers, no merged cells in the data area, clearly named sheets.",
      quiz: {
        question: "Why do merged cells in a data area cause real problems later?",
        options: [
          "They make the file size too large",
          "They break sorting, filtering, and formulas that expect a consistent row and column structure",
          "Excel doesn't allow merged cells at all",
          "They only cause problems when printing",
        ],
        correct: 1,
        explain: "Sorting, filtering, and most formulas rely on a consistent grid structure, which merged cells disrupt in ways that are hard to fully undo later.",
      },
    },
    {
      id: "formulas-that-do-real-work",
      title: "Formulas that do real work: SUM, IF, and lookups",
      minutes: 15,
      body: [
        "You don't need to know most of Excel's hundreds of functions. In years of real operations and reporting work, a small handful of formulas have covered the overwhelming majority of what I've actually needed, and they're worth genuinely mastering before chasing anything more exotic.",
        "SUM and AVERAGE are the true basics, and the main habit worth building is selecting ranges correctly and letting them update automatically as data changes, rather than manually recalculating and retyping a number every time a row gets added. A formula that references a range, like SUM(B2:B50), stays correct as the underlying data changes. A hardcoded typed number does not, and quietly becomes wrong the moment the data does.",
        "IF lets a cell show different results depending on a condition: IF the sales figure is above target, show \u201cMet,\u201d otherwise show \u201cMissed.\u201d This single formula covers an enormous share of real conditional logic in everyday spreadsheets \u2014 flagging overdue items, categorizing values, building simple pass/fail columns \u2014 without needing anything more complex.",
        "A lookup formula (VLOOKUP, or XLOOKUP on newer versions) finds a matching value in one place and pulls back related information from another, which is exactly how most real-world data connects: looking up a customer's name from their ID, or a product's price from its code. Learning one lookup formula solidly covers the specific, extremely common task of connecting two related tables of data.",
        "Whenever a formula gives an unexpected result, check the range or reference it's actually pointing to before assuming the formula itself is wrong. An overwhelming share of formula errors are a mismatched or outdated reference, not a genuinely broken formula \u2014 the formula is usually doing exactly what it was told, just pointed at the wrong place.",
      ],
      tryThis:
        "Think of a real task you do (or could do) with data \u2014 totaling numbers, flagging something above or below a threshold, or matching one list to another. Write down which of SUM, IF, or a lookup formula would solve it.",
      quiz: {
        question: "Why does a formula-based total (like SUM over a range) tend to be better than a manually typed number?",
        options: [
          "Formulas always calculate faster than manual entry",
          "A formula automatically stays correct as the underlying data changes, while a typed number doesn't",
          "Manual numbers are not allowed in most spreadsheet templates",
          "There's no real difference between the two",
        ],
        correct: 1,
        explain: "A formula referencing a range updates automatically as data changes, while a manually typed number silently becomes outdated the moment the data does.",
      },
    },
    {
      id: "formatting-for-readability",
      title: "Formatting that makes data readable, not just colorful",
      minutes: 12,
      body: [
        "Formatting should answer a real question faster \u2014 which numbers are over budget, which rows need attention \u2014 not just make a sheet look busier. A spreadsheet covered in decorative colors that don't mean anything specific is often harder to read than a plain one, not easier.",
        "Conditional formatting, which changes a cell's appearance automatically based on its value, is the formatting feature that actually earns its place in real work. Automatically highlighting any figure over budget in red, or any overdue date in orange, lets a reader's eye go straight to what matters without scanning every single cell manually.",
        "Number formatting deserves more attention than it usually gets: currency should display as currency, percentages as percentages, dates in one single consistent format throughout the whole sheet. A column mixing 5000, \u20a65,000, and 5,000.00 as plain, differently formatted text is a small, avoidable readability tax paid every single time anyone looks at that column.",
        "Freeze the header row on any sheet with more than a screen's worth of data, so column headers stay visible while scrolling down through rows. This single, extremely quick setting fixes one of the most common everyday annoyances in a working spreadsheet, and it's frequently the very first fix I make when reviewing someone else's file.",
      ],
      tryThis:
        "Pick a spreadsheet you use regularly and identify one place where conditional formatting (highlighting a threshold automatically) could replace manually scanning the whole column for values that need attention.",
      quiz: {
        question: "What makes conditional formatting more useful than purely decorative color choices?",
        options: [
          "It makes the file smaller",
          "It automatically highlights values based on a real rule, helping the eye find what matters faster",
          "It's required for the spreadsheet to calculate correctly",
          "It changes the underlying data values",
        ],
        correct: 1,
        explain: "Conditional formatting is tied to an actual rule about the data, which is what makes it functionally useful rather than just visually busy.",
      },
    },
    {
      id: "building-a-summary-view",
      title: "Building a simple dashboard or summary view",
      minutes: 13,
      body: [
        "Raw data and a useful summary are two very different things, and confusing them is a common mistake \u2014 handing someone fifty rows of raw data and calling it a report puts the actual analysis work back onto the reader, when that work should have already been done for them.",
        "A pivot table is the fastest way to turn a large, raw data set into a genuinely useful summary: total sales by region, average response time by agent, count of tickets by category, built by dragging fields into place rather than writing formulas by hand. Learning this one tool well replaces an enormous amount of manual summarizing work.",
        "A good summary view answers a specific question at a glance, ideally the exact question the person opening it actually has. \u201cHow are we doing against target this month\u201d deserves a summary built around exactly that comparison, not a general-purpose dump of every number that happens to exist in the underlying data.",
        "Keep a summary view visually calm: a small number of clearly labeled totals or a simple chart, not every possible metric crammed onto one screen. A summary trying to answer twelve questions at once usually ends up answering none of them clearly, which defeats the entire purpose of building a summary in the first place.",
      ],
      tryThis:
        "Think of a raw data set you have or could imagine (sales records, survey responses, expense entries). Write down the one specific question a summary view of that data should answer at a glance.",
      quiz: {
        question: "Why is handing someone raw data, on its own, often not the same as giving them a useful report?",
        options: [
          "Raw data is always inaccurate",
          "It leaves the actual analysis and summarizing work for the reader to do themselves",
          "Raw data can't be opened in Excel",
          "Reports must always include a chart",
        ],
        correct: 1,
        explain: "A genuinely useful report has already done the summarizing work, answering a specific question, rather than leaving that work for whoever opens the file.",
      },
    },
    {
      id: "common-mistakes",
      title: "Common mistakes that quietly break spreadsheets",
      minutes: 12,
      body: [
        "Typing a fixed number where a formula should be is one of the most common, quietly dangerous habits in everyday spreadsheet work. It looks identical to a formula result at first glance, but it silently stops being correct the moment the underlying data changes, and nothing visually signals that it's now wrong.",
        "Not understanding the difference between a relative and an absolute cell reference causes a very specific, very common bug: copying a formula down a column and having it subtly shift its reference in a way you didn't intend. Locking a reference with a dollar sign, like $B$2, when you specifically want it to stay fixed while copying, prevents this exact class of error.",
        "Letting one spreadsheet slowly grow into everything \u2014 raw data, calculations, notes, an unrelated second project \u2014 all on different tabs of the same file, makes it progressively harder to trust or hand off to anyone else. A spreadsheet that's grown unclear even to the person who built it is a sign it's overdue for a genuine cleanup or a split into separate, focused files.",
        "Not protecting header rows or key formulas from accidental edits is a small oversight with an outsized cost \u2014 a single accidental keystroke in the wrong cell can silently corrupt a formula that then produces confidently wrong numbers for weeks before anyone notices. Locking cells that shouldn't be casually edited is a small, cheap habit that prevents a genuinely costly class of mistake.",
      ],
      tryThis:
        "Open a spreadsheet you use regularly and check for one specific issue from this lesson: a hardcoded number where a formula should be, or a formula that might have shifted unexpectedly when copied down a column.",
      quiz: {
        question: "Why is typing a fixed number where a formula should be a quietly dangerous habit?",
        options: [
          "Excel will show an error immediately",
          "It looks correct at first but silently becomes wrong as soon as the underlying data changes",
          "It makes the file too large to open",
          "It's not actually a problem in practice",
        ],
        correct: 1,
        explain: "A hardcoded number provides no visual warning that it's outdated, unlike a formula, which would automatically reflect the current data.",
      },
    },
  ],
};
