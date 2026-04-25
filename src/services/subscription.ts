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

export function isEntitled(): boolean {
  if (__DEV__) return true;
  const { subscriptionStatus } = useProfileStore.getState();
  return subscriptionStatus === 'trial' || subscriptionStatus === 'active';
}

export function bypassForDev(): boolean {
  return __DEV__;
}
