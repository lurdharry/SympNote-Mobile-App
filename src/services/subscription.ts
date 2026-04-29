import Purchases, { CustomerInfo, PurchasesError } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useProfileStore } from '../stores/useProfileStore';

/**
 * RevenueCat entitlement identifier. Set in the RevenueCat dashboard
 * under Project → Entitlements. The dashboard binds this string to
 * one or more App Store Connect product IDs (the monthly + annual
 * subscriptions). The app only ever talks about "plus" — the
 * dashboard handles the product mapping.
 */
const ENTITLEMENT_ID = 'plus';

const apiKey =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const isRealKey = (key: string | undefined): key is string =>
  !!key && !key.toLowerCase().includes('dummy');

let configured = false;

/**
 * Configure the RevenueCat SDK. Must be called once on app boot
 * (root layout). Idempotent — safe to call from a useEffect.
 *
 * Bails silently when the key is the placeholder so local dev
 * without a RevenueCat account doesn't crash. The paywall will
 * still render; purchase / restore will throw with a clear message.
 */
export function initRevenueCat(): void {
  if (configured) return;
  if (!isRealKey(apiKey)) {
    if (__DEV__) {
      console.warn(
        '[RevenueCat] No real API key in env — purchases will fail until EXPO_PUBLIC_REVENUECAT_IOS_KEY is set.',
      );
    }
    return;
  }
  Purchases.configure({ apiKey });
  Purchases.addCustomerInfoUpdateListener(syncCustomerInfo);
  configured = true;
  // Best-effort sync of any existing entitlement on boot. Fires and
  // forgets — the listener above takes over for live updates.
  Purchases.getCustomerInfo().then(syncCustomerInfo).catch(() => {});
}

/**
 * Mirror RevenueCat's customer state into the local profile store.
 * Called from the SDK listener (renewal, expiration, change-of-plan)
 * and after every purchase / restore so the UI flips immediately.
 */
function syncCustomerInfo(info: CustomerInfo): void {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  if (!ent) {
    useProfileStore.getState().setSubscription('none', null);
    return;
  }
  const status = ent.periodType === 'TRIAL' ? 'trial' : 'active';
  useProfileStore.getState().setSubscription(status, ent.expirationDate ?? null);
}

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

export type PurchaseResult = { ok: true } | { cancelled: true };

/**
 * Trigger a RevenueCat purchase for the given plan. The plan id
 * ('monthly' / 'annual') must match the package identifier configured
 * in the RevenueCat dashboard offering.
 *
 * Returns `{ cancelled: true }` if the user dismissed the system
 * sheet — callers should treat that as a quiet exit, not an error.
 * Throws on any other failure.
 */
export async function purchase(planId: Plan['id']): Promise<PurchaseResult> {
  if (!configured) throw new Error('Subscriptions are not available right now.');
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find((p) => p.identifier === planId);
  if (!pkg) throw new Error(`Plan "${planId}" is not available.`);
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    syncCustomerInfo(customerInfo);
    return { ok: true };
  } catch (e) {
    const err = e as PurchasesError & { userCancelled?: boolean };
    if (err.userCancelled) return { cancelled: true };
    throw new Error(err.message ?? 'Purchase failed.');
  }
}

export type RestoreResult =
  | { restored: true; status: 'trial' | 'active'; trialEndsAt: string | null }
  | { restored: false };

/**
 * Restore previously-purchased subscription. App Store / Play Store
 * require this affordance on every paywall — without it, App Review
 * will reject the submission.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!configured) return { restored: false };
  const info = await Purchases.restorePurchases();
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  if (!ent) {
    useProfileStore.getState().setSubscription('none', null);
    return { restored: false };
  }
  const status = ent.periodType === 'TRIAL' ? 'trial' : 'active';
  useProfileStore.getState().setSubscription(status, ent.expirationDate ?? null);
  return { restored: true, status, trialEndsAt: ent.expirationDate ?? null };
}

export function isEntitled(): boolean {
  const { subscriptionStatus } = useProfileStore.getState();
  return subscriptionStatus === 'trial' || subscriptionStatus === 'active';
}

export function bypassForDev(): boolean {
  return __DEV__;
}
