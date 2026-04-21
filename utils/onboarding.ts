/**
 * Converts the free-form qualifier answers into concrete onboarding
 * behavior: a tentative appointment date, a paywall headline that speaks
 * to the user's stated pain, and the phrasing of each "Analyzing..." step.
 *
 * The question keys match those written by `app/onboarding/questions.tsx`.
 */

const Q_HARDEST = 'hardest';
const Q_NEXT_APPT = 'nextAppointment';
const Q_FORGETTING = 'forgetting';

type Answers = Record<string, unknown>;

function str(answers: Answers, key: string): string {
  const v = answers[key];
  return typeof v === 'string' ? v : '';
}

/**
 * Rough date derived from Q4. Returns null for "Not scheduled yet" so the
 * Prep tab starts empty in that case. The date is always a placeholder
 * the user can edit later.
 */
export function q4AnswerToDate(answers: Answers): Date | null {
  const a = str(answers, Q_NEXT_APPT);
  const now = new Date();
  switch (a) {
    case 'Within a week':
      now.setDate(now.getDate() + 5);
      return now;
    case 'Within a month':
      now.setDate(now.getDate() + 18);
      return now;
    case 'Later this year':
      now.setDate(now.getDate() + 90);
      return now;
    default:
      return null;
  }
}

export type PaywallCopy = {
  title: string;
  sub: string;
};

/**
 * Paywall copy tailored to the user's Q2 (hardest part) answer. Falling
 * back to the generic copy keeps the layout stable if the user skipped.
 */
export function getPaywallCopy(answers: Answers): PaywallCopy {
  const hardest = str(answers, Q_HARDEST);
  const forgetting = str(answers, Q_FORGETTING);

  switch (hardest) {
    case 'Remembering symptoms':
      return {
        title: 'Never forget a symptom again',
        sub: 'Capture concerns as they come up. Walk into every visit with every detail.',
      };
    case 'Explaining clearly':
      return {
        title: 'Explain clearly every visit',
        sub: "A doctor-ready summary, in the words you'd use. No fumbling, no blanks.",
      };
    case 'Feeling rushed':
      return {
        title: 'Never feel rushed again',
        sub: 'Your concerns, prioritized and structured before you walk in.',
      };
    case 'Taking notes':
      return {
        title: 'Notes taken for you',
        sub: 'Speak what matters; we organize it. Then show your doctor.',
      };
    default:
      if (forgetting === 'Always' || forgetting === 'Often') {
        return {
          title: "Stop forgetting what to say",
          sub: 'A doctor-ready summary of everything you meant to bring up.',
        };
      }
      return {
        title: 'Keep building your appointment summary',
        sub: 'Unlimited recordings + AI summary before every visit.',
      };
  }
}

/**
 * Three personalized step labels for the "Analyzing..." screen. Keeping
 * them short — the screen itself is now ~2.5s.
 */
export function getAnalyzingSteps(answers: Answers): [string, string, string] {
  const hardest = str(answers, Q_HARDEST);
  const nextAppt = str(answers, Q_NEXT_APPT);

  const first =
    hardest === 'Remembering symptoms'
      ? 'Setting up your symptom log...'
      : hardest === 'Explaining clearly'
      ? 'Preparing clear-summary mode...'
      : hardest === 'Feeling rushed'
      ? 'Setting up your prep checklist...'
      : hardest === 'Taking notes'
      ? 'Turning on auto-notes...'
      : 'Setting up your visit prep...';

  const second =
    nextAppt === 'Within a week'
      ? 'Prioritizing this week\'s visit...'
      : nextAppt === 'Within a month'
      ? 'Scheduling next month\'s visit...'
      : nextAppt === 'Later this year'
      ? 'Pacing your prep for later...'
      : 'Personalizing your experience...';

  return [first, second, 'Ready'];
}

/**
 * Short label for the tentative appointment we prefill. Users can edit it
 * in the Prep tab — but a date in the back pocket is better than nothing.
 */
export function tentativeAppointmentTitle(): string {
  return 'Next appointment (tap to edit)';
}

/**
 * Sympnote's conversational reply to each qualifier answer. Used in the
 * chat-bubble questions screen so the AI feels like it's listening, and
 * in the analyzing screen to recap what it learned.
 */
export function getSympnoteReply(qKey: string, answer: string): string {
  if (qKey === 'regularity') {
    switch (answer) {
      case 'Yes, often':
        return "You'll get the most out of me — I'll get sharper each visit.";
      case 'Sometimes':
        return "Then let's make each one count.";
      case 'Rarely':
        return 'Even a rare visit deserves to be prepared.';
    }
  }
  if (qKey === 'hardest') {
    switch (answer) {
      case 'Remembering symptoms':
        return "Noted. I'll keep a running log so nothing slips.";
      case 'Explaining clearly':
        return "Got it. I'll write summaries in your own words.";
      case 'Feeling rushed':
        return 'Understood. Short and high-impact, every time.';
      case 'Taking notes':
        return "Done. I'll take the notes — you just listen.";
    }
  }
  if (qKey === 'forgetting') {
    switch (answer) {
      case 'Always':
        return "Totally get it. That's the whole point of me.";
      case 'Often':
        return "We'll fix that.";
      case 'Sometimes':
        return 'Even sometimes is too much. Let me handle it.';
      case 'Rarely':
        return "You're already ahead — let's make it airtight.";
    }
  }
  if (qKey === 'nextAppointment') {
    switch (answer) {
      case 'Within a week':
        return "We've got time. Let's get you ready.";
      case 'Within a month':
        return 'Plenty of runway to build up the full picture.';
      case 'Later this year':
        return "Great — let's start now so you're never playing catch-up.";
      case 'Not scheduled yet':
        return "No problem — we'll be ready when you are.";
    }
  }
  return 'Got it.';
}
