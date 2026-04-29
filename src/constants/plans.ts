import {
  FileText,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import type { ComponentType } from "react";
import type { PurchasesPackage } from "react-native-purchases";
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
 * Marketing-only decoration for each plan. Prices, periods, and trial
 * details come from RevenueCat at runtime so they stay localized and
 * in sync with App Store Connect — never hardcode money here.
 *
 * What lives here:
 *  - label, badges (trial / value / save), and any derivation helpers
 *    that turn live price data into copy ("Just $4.99/month").
 *
 * What does NOT live here:
 *  - Price strings, currency symbols, period units, trial duration —
 *    every one of those would drift from App Store Connect and break
 *    localization. They come from `PurchasesPackage.product.*` via
 *    `usePaywallPlans()`.
 */
type PlanPresentation = {
  id: Plan["id"];
  label: string;
  trialBadge?: string;
  valueBadge?: string;
  /**
   * Build the subline that sits under the plan label. Receives the
   * live price string (already localized) so we can compose copy like
   * "$9.99/month after trial" or "Just $4.99/month" without baking
   * the currency symbol into a constant.
   */
  formatSubline?: (priceString: string) => string;
  /**
   * Annual plans show a strikethrough "what you'd pay billed monthly"
   * to visualise the discount. Receives the live monthly price (or
   * undefined if monthly hasn't loaded yet).
   */
  formatOriginalPrice?: (monthlyPriceString: string | undefined) => string | undefined;
  saveBadge?: string;
};

const PLAN_PRESENTATIONS: Record<Plan["id"], PlanPresentation> = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    trialBadge: "7-Day Free Trial",
    formatSubline: (price) => `${price}/month after trial`,
  },
  annual: {
    id: "annual",
    label: "Annual",
    valueBadge: "Best Value",
    saveBadge: "Save 37%",
    formatSubline: (price) => `Just ${perMonthFromAnnual(price)}/month`,
    formatOriginalPrice: (monthly) => annualizedPriceFromMonthly(monthly),
  },
};

const PLAN_ORDER: Plan["id"][] = ["monthly", "annual"];

/**
 * Given a live RevenueCat package + the plan id, build the PlanDef
 * the UI consumes. Always reads price + period from the package so
 * what the user sees matches what App Store will charge — never
 * hardcoded. Caller must only invoke this once a package is loaded;
 * the paywall shows a loading state until then.
 */
export const buildPlanDef = (
  id: Plan["id"],
  pkg: PurchasesPackage,
  monthlyPriceForOriginal?: string,
): PlanDef => {
  const presentation = PLAN_PRESENTATIONS[id];
  const price = pkg.product.priceString;
  const per = perFromPackage(pkg);

  return {
    id,
    label: presentation.label,
    price,
    per,
    trialBadge: presentation.trialBadge,
    valueBadge: presentation.valueBadge,
    saveBadge: presentation.saveBadge,
    subline: presentation.formatSubline?.(price),
    originalPrice: presentation.formatOriginalPrice?.(monthlyPriceForOriginal),
  };
};

export const PLAN_IDS = PLAN_ORDER;

/** Naive per-month from an annual price string. Strips non-numeric
 *  chars, divides by 12, formats to 2 decimals, restores the original
 *  currency prefix. Good enough for the marketing subline; we never
 *  charge based on this number. */
function perMonthFromAnnual(annualPriceString: string): string {
  const numeric = parseFloat(annualPriceString.replace(/[^\d.]/g, ""));
  if (!isFinite(numeric)) return annualPriceString;
  const monthly = (numeric / 12).toFixed(2);
  const symbol = annualPriceString.replace(/[\d.,\s]/g, "").trim() || "$";
  return `${symbol}${monthly}`;
}

/** Strikethrough "what you'd pay billed monthly" displayed above the
 *  annual price. Computes monthly × 12 with the same currency symbol.
 *  Returns undefined if the input is missing or unparseable so the
 *  PlanCard skips rendering the strikethrough rather than show junk. */
function annualizedPriceFromMonthly(monthlyPriceString: string | undefined): string | undefined {
  if (!monthlyPriceString) return undefined;
  const numeric = parseFloat(monthlyPriceString.replace(/[^\d.]/g, ""));
  if (!isFinite(numeric)) return undefined;
  const total = (numeric * 12).toFixed(2);
  const symbol = monthlyPriceString.replace(/[\d.,\s]/g, "").trim() || "$";
  return `${symbol}${total}`;
}

function perFromPackage(pkg: PurchasesPackage): string {
  // packageType is more reliable than parsing subscriptionPeriod.
  switch (pkg.packageType) {
    case "MONTHLY":
      return "per month";
    case "ANNUAL":
      return "per year";
    case "WEEKLY":
      return "per week";
    case "SIX_MONTH":
      return "per 6 months";
    case "THREE_MONTH":
      return "per 3 months";
    case "TWO_MONTH":
      return "per 2 months";
    case "LIFETIME":
      return "lifetime";
    default:
      return "";
  }
}

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
