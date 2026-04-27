import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useProfileStore } from "@/stores/useProfileStore";
import type { SubscriptionStatus } from "@/stores/types";

/**
 * Single source of truth for "is the user entitled to paid features?"
 *
 * What lives here:
 *  - Reactive `entitled` flag derived from `subscriptionStatus` and
 *    `trialEndsAt`. `'trial'` only counts as entitled while the wall
 *    clock is still before `trialEndsAt`.
 *  - A timer that auto-flips the persisted status from `'trial'` to
 *    `'expired'` at the exact moment `trialEndsAt` is crossed (so the
 *    rest of the app sees consistent store state without polling).
 *  - An AppState listener that re-evaluates on app foreground — the
 *    OS may have advanced the system clock past `trialEndsAt` while
 *    we were backgrounded.
 *
 * What does NOT live here:
 *  - Auto-presentation of the paywall on expiry. The product spec is
 *    "view existing data, hit gates on paid actions" — so the gate
 *    discovery happens at the action level (`usePaywallGate`) and at
 *    the view level (`LockedView`). The Context just publishes truth.
 *
 * Consumers:
 *  - `useEntitlement()` — direct read of the flag and metadata.
 *  - `usePaywallGate()` — wraps `entitled` with a "push paywall on
 *    fail" behavior for action gates.
 *  - `<LockedView>` — wraps `entitled` for view-level gates (Insights,
 *    /record screen mount).
 */
export interface EntitlementValue {
  /** True iff status is 'active', or 'trial' with a future end date. */
  entitled: boolean;
  /**
   * Whether the user has finished onboarding. Combined with `entitled`,
   * this lets call sites distinguish "still onboarding" from "lapsed
   * subscriber" — the gate UX differs.
   */
  onboardingComplete: boolean;
  /** Raw status from the profile store. */
  status: SubscriptionStatus;
  /** ISO string of trial expiration; null when not in trial. */
  trialEndsAt: string | null;
  /** Whole calendar days remaining on trial; null outside trial. */
  daysRemaining: number | null;
}

const computeEntitled = (
  status: SubscriptionStatus,
  trialEndsAt: string | null,
): boolean => {
  if (status === "active") return true;
  if (status === "trial") {
    if (!trialEndsAt) return true; // missing date but flagged as trial — be permissive
    return parseISO(trialEndsAt).getTime() > Date.now();
  }
  return false;
};

const Context = createContext<EntitlementValue | null>(null);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const status = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const setSubscription = useProfileStore((s) => s.setSubscription);

  // `tick` forces a recomputation of memoized derivations on signals
  // that aren't store changes — AppState foreground in particular.
  const [tick, setTick] = useState(0);

  // Trial expiry: schedule a one-shot timer to flip status at
  // `trialEndsAt`, or flip immediately if we're already past it.
  useEffect(() => {
    if (status !== "trial" || !trialEndsAt) return;
    const ms = parseISO(trialEndsAt).getTime() - Date.now();
    if (ms <= 0) {
      setSubscription("expired", trialEndsAt);
      return;
    }
    // setTimeout is capped at ~24.8 days on most JS engines, but our
    // trials are 3 days, so a single timeout suffices. The +500ms
    // buffer ensures we fire just past expiry rather than the very
    // edge.
    const id = setTimeout(() => {
      setSubscription("expired", trialEndsAt);
      setTick((n) => n + 1);
    }, ms + 500);
    return () => clearTimeout(id);
  }, [status, trialEndsAt, setSubscription]);

  // App foreground: clocks can advance during background; re-check.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      // If we're still flagged as trial but the clock has crossed
      // expiry, flip the persisted status. The effect above handles
      // the future case; this handles the "we were backgrounded
      // through expiry" case.
      const s = useProfileStore.getState();
      if (
        s.subscriptionStatus === "trial" &&
        s.trialEndsAt &&
        parseISO(s.trialEndsAt).getTime() <= Date.now()
      ) {
        setSubscription("expired", s.trialEndsAt);
      }
      setTick((n) => n + 1);
    });
    return () => sub.remove();
  }, [setSubscription]);

  const value = useMemo<EntitlementValue>(() => {
    const entitled = computeEntitled(status, trialEndsAt);
    const daysRemaining =
      status === "trial" && trialEndsAt
        ? Math.max(
            0,
            differenceInCalendarDays(parseISO(trialEndsAt), new Date()),
          )
        : null;
    return {
      entitled,
      onboardingComplete,
      status,
      trialEndsAt,
      daysRemaining,
    };
    // `tick` is intentionally a dependency — it forces re-derivation
    // after foreground re-evaluation flips the status in the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, trialEndsAt, onboardingComplete, tick]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useEntitlement = (): EntitlementValue => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      "useEntitlement must be used inside <EntitlementProvider>. " +
        "Mount it once at the app root.",
    );
  }
  return ctx;
};
