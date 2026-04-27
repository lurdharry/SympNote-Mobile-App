import { useRouter } from "expo-router";
import { useEntitlement } from "@/contexts/EntitlementContext";

/**
 * In-app action gate. Wraps any paid action: the consumer calls
 * `requireEntitlement()` before doing the work and only proceeds
 * when it returns true. When the user isn't entitled, the standalone
 * `/paywall` modal route is presented and the gated work is skipped.
 *
 * Reads `entitled` from `EntitlementContext` so the check stays in
 * sync with reactive trial-expiry transitions — the moment a trial
 * lapses mid-session, this hook starts blocking without any extra
 * wiring.
 *
 * The post-purchase flow is "buy → modal dismisses → user retries
 * the action." We deliberately don't pipe a completion callback
 * through navigation; the "tap again to confirm" mental model is
 * fine for the small handful of paid actions, and skipping the
 * stash-and-replay machinery keeps the gate trivial.
 *
 * Use sites:
 *  - `/brief/new` Generate
 *  - `/brief/[id]` Regenerate + PDF export
 *  - Recording entry points (home FAB long-press / short-tap)
 *  - any future paid action
 */
export function usePaywallGate() {
  const router = useRouter();
  const { entitled } = useEntitlement();

  const requireEntitlement = (): boolean => {
    if (entitled) return true;
    router.push("/paywall");
    return false;
  };

  return { requireEntitlement, entitled };
}
