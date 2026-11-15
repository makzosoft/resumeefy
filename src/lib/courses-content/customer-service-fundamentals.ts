import type { CuratedCourse } from "./types";

export const customerServiceFundamentals: CuratedCourse =   {
    slug: "customer-service-fundamentals",
    title: "Customer Service Fundamentals",
    subtitle: "The judgment calls behind good support, not scripts to memorize.",
    instructorId: "yakubu",
    level: "Beginner",
    hours: "2.5 hours",
    summary:
      "A practical course on what actually makes customer service good: understanding what a frustrated customer really wants, de-escalating without getting defensive, writing responses that sound human, setting boundaries with unreasonable demands, and turning ordinary support interactions into real loyalty.",
    outcomes: [
      "Explain what customers actually want when something goes wrong, beyond just an apology",
      "De-escalate an angry customer without becoming defensive or dismissive",
      "Write support responses that sound like a person, not a script",
      "Set firm, professional boundaries when a customer's demand crosses a line",
      "Turn a routine support interaction into a moment that builds real loyalty",
    ],
    lessons: [
      {
        id: "what-customers-want",
        title: "What customers actually want when something goes wrong",
        minutes: 14,
        body: [
          "Early on, I assumed an apology was the main thing an upset customer wanted. It's not, or at least it's not the main thing. What people actually want, in order, is usually: to feel heard, to understand what's happening, and to know when it will be fixed. The apology matters, but it's a small part of a much bigger need to feel like a real person is paying attention.",
          "This is why a technically correct response can still leave someone furious. \u201cYour refund will be processed within 5 to 7 business days\u201d is accurate, but it skips the part where the customer needed to feel like their frustration actually registered with a human being first. Lead with acknowledgment before you lead with process. \u201cThat's frustrating, and I can see why you're upset \u2014 let me sort this out\u201d does more work than any amount of procedural accuracy on its own.",
          "Clarity reduces anxiety more than people expect. A lot of customer frustration isn't really about the original problem \u2014 it's about not knowing what happens next. \u201cI'll look into it\u201d creates more anxiety than \u201cI'm checking with our billing team now and I'll have an answer for you within the hour,\u201d even though both sentences technically promise the same amount of actual work. Specificity is often the difference between a customer who calms down and one who escalates further out of uncertainty.",
          "One habit I try to build into every new hire: read the message twice before responding once. The first read is for the facts. The second read is for the emotion underneath the facts \u2014 are they scared they've lost money, embarrassed they made a mistake, worried about a deadline? Responding only to the facts while ignoring the emotion is the single most common way a technically correct reply still lands badly.",
        ],
        tryThis:
          "Think of the last time you were frustrated as a customer somewhere. Write one sentence describing what you actually needed to hear in that moment \u2014 not what you were told, but what would have actually made you feel better.",
        quiz: {
          question: "Why does leading with acknowledgment often matter more than leading with a correct procedural answer?",
          options: [
            "Procedural answers are usually wrong",
            "Acknowledgment makes the customer feel heard before they're ready to absorb process details",
            "Customers don't care about resolution timelines at all",
            "It allows you to avoid answering the actual question",
          ],
          correct: 1,
          explain: "A customer who doesn't feel heard yet often can't fully absorb procedural information, even if it's accurate and well-intentioned.",
        },
      },
      {
        id: "de-escalating",
        title: "De-escalating an angry customer without getting defensive",
        minutes: 15,
        body: [
          "The hardest instinct to override in customer service is the urge to defend yourself the moment someone is unfair to you. A customer might say something like \u201cyour company clearly doesn't care about customers,\u201d which feels personal even though it almost never actually is. The moment you respond to defend the company or yourself, the conversation usually gets worse, not better.",
          "A technique that works surprisingly well: separate the emotion from the request, and respond to the emotion first, explicitly. \u201cI can hear how frustrating this has been\u201d costs you nothing, concedes nothing false, and immediately lowers the emotional temperature of the conversation, because you're no longer in an argument \u2014 you're on the same side, looking at the same problem.",
          "Avoid the word \u201cbut\u201d directly after an acknowledgment. \u201cI understand you're upset, but our policy is...\u201d cancels out the acknowledgment that came right before it, because the word \u201cbut\u201d signals to the listener that everything before it didn't really count. \u201cI understand you're upset, and here's what I can do\u201d keeps the acknowledgment intact while still moving the conversation forward.",
          "When someone is genuinely being aggressive rather than just frustrated, slowing your own pace down is more effective than matching their energy or rushing to appease them. Short, calm, unhurried responses tend to de-escalate faster than long, anxious, over-explaining ones, because anxious over-explaining often reads as either weakness or guilt, both of which escalate rather than calm a frustrated person.",
          "It's worth naming clearly: de-escalating someone is not the same as agreeing that they're right about everything, or that any behavior on their part is acceptable. You can stay calm, acknowledge real frustration, and still hold a boundary \u2014 those aren't in conflict. We'll go deeper on the boundary side of this in a later lesson.",
        ],
        tryThis:
          "Take a frustrated message you've received (or can imagine receiving) and write two responses: one starting with \u201cI understand, but...\u201d and one starting with \u201cI understand, and...\u201d Read both aloud and notice how differently they land.",
        quiz: {
          question: "Why does starting a response with \u201cI understand you're upset, but...\u201d tend to backfire?",
          options: [
            "The word 'but' is grammatically incorrect in this context",
            "It signals that the acknowledgment before it doesn't really count",
            "It makes the response too long",
            "Customers don't like being told the company understands them",
          ],
          correct: 1,
          explain: "\u201cBut\u201d effectively cancels the acknowledgment that came before it, which can make the customer feel dismissed rather than heard.",
        },
      },
      {
        id: "sound-human-not-scripted",
        title: "Writing responses that sound human, not like a script",
        minutes: 14,
        body: [
          "Customers can tell almost instantly when they're reading a copy-pasted response, even a well-written one, because scripted language has a particular rhythm: overly formal, oddly cheerful regardless of context, and stuffed with phrases nobody would actually say out loud, like \u201cwe apologize for any inconvenience this may have caused.\u201d That specific phrase has been repeated so often it now reads as the opposite of sincere.",
          "A simple test: would you say this sentence out loud to a friend who was frustrated with you? \u201cWe apologize for any inconvenience this may have caused\u201d fails that test badly. \u201cSorry, that's genuinely annoying, let's get it fixed\u201d passes it easily, and says almost the same thing.",
          "Templates and canned responses aren't the enemy here \u2014 efficiency matters, especially at volume. The problem is using a template without adapting it at all to the specific person and situation in front of you. A good habit: keep your canned responses as a starting draft, not a final answer, and always change at least one sentence to reference the actual specifics of this customer's situation before sending.",
          "Contractions, plain words, and shorter sentences all make written support responses sound more human almost automatically. \u201cWe are currently unable to process your request at this time\u201d becomes \u201cWe can't process this right now\u201d \u2014 same meaning, far more human, and noticeably shorter to boot. Whenever a sentence feels stiff, try saying it in the plainest way you'd actually explain it to a friend, then write that down instead.",
        ],
        tryThis:
          "Take a generic customer service phrase you've seen before (or one from this lesson) and rewrite it exactly how you'd say it out loud to a friend who was frustrated with you.",
        quiz: {
          question: "What's a fast, practical test for whether a customer service response sounds too scripted?",
          options: [
            "Whether it's grammatically perfect",
            "Whether you would actually say it out loud to a frustrated friend",
            "Whether it's longer than three sentences",
            "Whether it includes the word 'sorry'",
          ],
          correct: 1,
          explain: "Scripted language usually fails the out-loud test immediately, since nobody naturally speaks in stock corporate phrasing.",
        },
      },
      {
        id: "setting-boundaries",
        title: "Setting boundaries when a customer is being unreasonable",
        minutes: 14,
        body: [
          "Good customer service does not mean agreeing to everything a customer demands, and pretending otherwise leads directly to burnout and, ironically, worse service overall, because an exhausted, resentful support agent serves everyone worse. There's a real difference between being genuinely helpful and being unable to say no to an unreasonable request.",
          "A boundary is most effective when it's stated calmly, briefly, and without over-justifying. \u201cI'm not able to do that, but here's what I can do\u201d is complete on its own. Adding four extra sentences explaining exactly why the policy exists often invites an argument about the policy itself, which rarely goes anywhere productive and just extends a difficult conversation.",
          "When a customer becomes abusive rather than just frustrated \u2014 genuine insults, threats, or repeated shouting \u2014 it's appropriate and professional to name that clearly and calmly: \u201cI want to help you, and I need this conversation to stay respectful for me to keep doing that.\u201d This isn't punishing the customer; it's stating a condition for the conversation to keep being useful for both people.",
          "Escalating to a manager or a different process isn't a personal failure \u2014 it's a normal, expected part of the system for situations genuinely outside what a first-line agent should be resolving alone. Knowing when to say \u201cthis needs to go to my supervisor\u201d, and saying it without guilt or defensiveness, is itself a skill, not an admission of inadequacy.",
        ],
        tryThis:
          "Write one calm, complete boundary-setting sentence for a demand you consider unreasonable (a refund outside policy, abusive language, an unrealistic deadline). Keep it to one sentence, with no extra justification attached.",
        quiz: {
          question: "Why is a short, unjustified boundary often more effective than a long, explained one?",
          options: [
            "Long explanations are always factually wrong",
            "Over-explaining a boundary often invites an argument about the policy itself",
            "Customers prefer shorter emails in general",
            "Short responses are required by most company policies",
          ],
          correct: 1,
          explain: "Extended justification tends to open the boundary itself up for debate, extending an already difficult conversation rather than closing it.",
        },
      },
      {
        id: "support-to-loyalty",
        title: "Turning a support interaction into loyalty",
        minutes: 13,
        body: [
          "There's a counterintuitive pattern in customer experience research that also matches what I've seen directly: a customer whose problem was handled really well often ends up more loyal than one who never had a problem at all. A support interaction is a genuine opportunity, not just a cost to minimize.",
          "The difference between a merely resolved interaction and a loyalty-building one is usually one small extra step beyond what was strictly required. Fixing the immediate issue is the baseline. Proactively flagging a related issue before they notice it, or following up a few days later to confirm everything's still working, is what actually gets remembered and talked about afterward.",
          "Personal, specific language beats generic warmth every time. \u201cThanks for your patience!\u201d is generic and forgettable. \u201cThanks for bearing with the back-and-forth on this, I know the delay was on our side\u201d is specific, honest, and actually acknowledges what happened, which reads as far more genuine even though it's barely longer.",
          "None of this requires grand gestures or unauthorized discounts handed out to smooth things over. It usually just requires treating the interaction as a real conversation with a real person, rather than a ticket to close as fast as possible. The fastest resolution and the most loyalty-building resolution are not always the same thing, and it's worth knowing which one a given moment actually calls for.",
        ],
        tryThis:
          "Think of the last resolved support interaction you had, as either the customer or the agent. Write one specific, small thing that could have been added, beyond the bare resolution, that would have made it memorable.",
        quiz: {
          question: "Why can a well-handled problem sometimes build more loyalty than a customer having no problem at all?",
          options: [
            "Customers prefer companies that make mistakes",
            "A well-handled problem demonstrates how the company behaves under pressure, which a smooth experience never tests",
            "Problems always lead to loyalty regardless of how they're handled",
            "It doesn't \u2014 having no problems is always better for loyalty",
          ],
          correct: 1,
          explain: "A problem is a real test of how a company treats customers under pressure, and handling it well can build more trust than an experience that was never tested at all.",
        },
      },
    ],
  }
