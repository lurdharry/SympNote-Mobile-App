import { Plan } from '../services/subscription';

export type PlanDef = {
  id: Plan['id'];
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
};

/**
 * Two plans, monthly + annual. Weekly was dropped — at the price
 * point and trial duration we're offering, three SKUs flattened the
 * decision instead of clarifying it. The annual plan still carries
 * the best-value framing.
 */
export const PAYWALL_PLANS: PlanDef[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    per: 'per month',
    subline: '$9.99/month after trial',
    trialBadge: '3-Day Free Trial',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$59.99',
    per: 'per year',
    subline: 'Just $4.99/month',
    valueBadge: 'Best Value',
    saveBadge: 'SAVE 50%',
  },
];

/**
 * Feature list kept around in case any future surface (a comparison
 * sheet, marketing page) wants to use it. The new minimal paywall
 * doesn't render it — mascot + plan cards + CTA carry the screen.
 */
export const PLAN_FEATURES = [] as Array<{ Icon: never; t: string }>;
