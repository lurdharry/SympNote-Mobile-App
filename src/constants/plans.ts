import {
  FileText,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { Plan } from "../services/subscription";
import type { PrepGap } from "../stores/types";

export type PlanDef = {
  id: Plan["id"];
  label: string;
  /** Big price on the right of the card. */
  price: string;
  /** Tiny line beneath the price. */
  per: string;
  /** Subtitle line under the plan label (e.g. "$9.99/month after trial"). */
  subline?: string;
  /** Pill next to the label for trial offers (e.g. "3-Day Free Trial"). */
  trialBadge?: string;
  /** Pill next to the label for value framing (e.g. "Best Value"). */
  valueBadge?: string;
  /** Corner ribbon ("SAVE 50%"), rendered top-right of the card. */
  saveBadge?: string;
  /**
   * Strikethrough "before" price rendered above the live price. Used
   * to visualise a discount: e.g. annual at $59.99 with `originalPrice`
   * "$119.88" reads as a 50%-off deal. Visualising the cut converts
   * better than showing only the discounted price + a "Save N%" badge.
   */
  originalPrice?: string;
};

/**
 * Two plans, monthly + annual. Weekly was dropped — at the price
 * point and trial duration we're offering, three SKUs flattened the
 * decision instead of clarifying it. The annual plan still carries
 * the best-value framing.
 */
export const PAYWALL_PLANS: PlanDef[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$9.99",
    per: "per month",
    subline: "$9.99/month after trial",
    trialBadge: "3-Day Free Trial",
  },
  {
    id: "annual",
    label: "Annual",
    price: "$59.99",
    per: "per year",
    subline: "Just $4.99/month",
    valueBadge: "Best Value",
    saveBadge: "Save 50%",
    // $9.99 × 12 = $119.88, what they'd pay billed monthly.
    originalPrice: "$119.88",
  },
];

/**
 * Feature list kept around in case any future surface (a comparison
 * sheet, marketing page) wants to use it. The new minimal paywall
 * doesn't render it — mascot + plan cards + CTA carry the screen.
 */
export const PLAN_FEATURES = [] as Array<{ Icon: never; t: string }>;

type LucideIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export interface PaywallFeature {
  Icon: LucideIcon;
  label: string;
  hint: string;
}

/**
 * "What you'll keep" — loss-framed feature list rendered on both
 * paywalls (onboarding + in-app gate). Single source of truth so the
 * promise stays consistent across the two surfaces.
 */
export const KEEP_FEATURES: PaywallFeature[] = [
  {
    Icon: HeartPulse,
    label: "Unlimited briefs",
    hint: "Voice or text — every visit prepared.",
  },
  {
    Icon: FileText,
    label: "Doctor-ready PDFs",
    hint: "Share or print straight from the app.",
  },
  {
    Icon: ShieldCheck,
    label: "Patterns and red flags",
    hint: "Reviewed and surfaced in every brief.",
  },
  {
    Icon: Users,
    label: "Care-team sync",
    hint: "One record, every clinician.",
  },
];

/**
 * Loss-framed sub-line tied to the prep-gap problem-anchor answer the
 * user picked at the start of onboarding. The headline stays
 * personalised to the brief content; the sub closes the loop on the
 * pain they named ("you said you forget — don't do that again").
 *
 * Falls back to a generic loss line for users who reported they're
 * already prepared (no problem to anchor against).
 */
const heroSubForPrepGap = (prepGap: PrepGap | undefined): string => {
  switch (prepGap) {
    case 'often':
      return "You said you forget almost every visit. This is the brief that ends that.";
    case 'sometimes':
      return "You said something always slips. Don't lose this brief — or the next.";
    case 'occasional':
      return "Keep this one. The next ones need Sympnote.";
    case 'rare':
    default:
      return "Keep this one. The next ones need Sympnote.";
  }
};

/**
 * Compose the paywall hero copy from the user's actual first brief
 * when one exists. Pulling their top concern (or a clean summary
 * snippet) makes the ask read as "we did this for you" rather than
 * "buy our app." Loss-framed sub in every variant, tied to prepGap
 * when it's set.
 *
 * Shared between onboarding paywall (post-first-brief) and in-app
 * paywall (post-trial / post-free-brief gate). The copy reads the
 * same in both contexts because the user's most recent brief carries
 * the same emotional weight either way.
 */
export const composePaywallHero = (
  topConcernLabel: string | undefined,
  summaryFirstSentence: string | undefined,
  prepGap?: PrepGap,
): { eyebrow: string; headline: string; sub: string } => {
  const sub = heroSubForPrepGap(prepGap);
  if (topConcernLabel) {
    const concern = topConcernLabel.trim();
    const lower = concern.charAt(0).toLowerCase() + concern.slice(1);
    return {
      eyebrow: "YOUR FIRST BRIEF IS READY",
      headline: `Sympnote heard you about\n${lower}.`,
      sub,
    };
  }
  if (summaryFirstSentence) {
    return {
      eyebrow: "YOUR FIRST BRIEF IS READY",
      headline: "Your first brief is ready.",
      sub: summaryFirstSentence,
    };
  }
  // Fallback path — fires when the most recent brief came back empty
  // (no concerns, no summary). The prepGap-driven sub references "this
  // brief", which doesn't exist in this state — so we ignore prepGap
  // here and use the generic loss line instead. Mismatched headline /
  // sub pairs are worse than a slightly less-personal fallback.
  return {
    eyebrow: "ONE STEP TO GO",
    headline: "Unlock Sympnote Plus.",
    sub: "Without it, your next visit is back to memory and Post-its.",
  };
};
