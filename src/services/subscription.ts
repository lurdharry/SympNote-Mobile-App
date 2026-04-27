// Mock RevenueCat integration. Wire up react-native-purchases here once
// RevenueCat project IDs are provisioned; the shape of this module is
// designed to swap in without changing callers.

import { addDays } from 'date-fns';
import { useProfileStore } from '../stores/useProfileStore';

export type Plan = {
  id: 'monthly' | 'annual';
  price: string;
  period: string;
  badge?: string;
  savingsTag?: string;
};

export const PLANS: Plan[] = [
  { id: 'monthly', price: '$9.99', period: 'month' },
  {
    id: 'annual',
    price: '$59.99',
    period: 'year',
    badge: 'BEST VALUE',
    savingsTag: 'save 50%',
  },
];

export async function purchase(planId: Plan['id']): Promise<{ ok: true }> {
  // Simulate latency and then set a 3-day trial.
  await new Promise((r) => setTimeout(r, 1400));
  const trialEnds = addDays(new Date(), 3).toISOString();
  useProfileStore.getState().setSubscription('trial', trialEnds);
  return { ok: true };
}

export type RestoreResult =
  | { restored: true; status: 'trial' | 'active'; trialEndsAt: string | null }
  | { restored: false };

/**
 * Restore previously-purchased subscription. App Store / Play Store
 * require this affordance on every paywall — without it, App Review
 * will reject the submission. Currently mocked to "no purchases
 * found" because the RevenueCat SDK is not yet wired; this matches
 * the shape the real call will return so swap-in is mechanical.
 *
 * Real implementation when RevenueCat lands:
 *   const customerInfo = await Purchases.restorePurchases();
 *   const sub = customerInfo.entitlements.active['plus'];
 *   if (sub) {
 *     setSubscription(sub.willRenew ? 'active' : 'trial', sub.expirationDate);
 *     return { restored: true, status: ..., trialEndsAt: ... };
 *   }
 *   return { restored: false };
 */
export async function restorePurchases(): Promise<RestoreResult> {
  await new Promise((r) => setTimeout(r, 1200));
  // Mocked. The real RevenueCat call goes here. See comment above.
  return { restored: false };
}

export function isEntitled(): boolean {
  // No dev bypass: the in-app paywall gate has to be testable in
  // development. Use the dev "skip paywall" affordance on the
  // onboarding paywall (which sets the trial status) when seeding
  // an entitled state for local testing.
  const { subscriptionStatus } = useProfileStore.getState();
  return subscriptionStatus === 'trial' || subscriptionStatus === 'active';
}

export function bypassForDev(): boolean {
  return __DEV__;
}
