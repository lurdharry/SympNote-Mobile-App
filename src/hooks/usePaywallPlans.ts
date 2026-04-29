import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PLAN_IDS, PlanDef, buildPlanDef } from "../constants/plans";
import { getOfferingPackages } from "../services/subscription";

/**
 * Live paywall plans hydrated from RevenueCat. Returns localized,
 * App-Store-Connect-truth prices (so EU users see euros, JP users
 * see yen, etc.) merged with the static marketing presentation
 * (badges, label copy, derived sublines).
 *
 * Returns an empty `plans` array while loading or when RevenueCat
 * has nothing to give. Never returns hardcoded fallback prices —
 * showing the wrong number is worse than showing none. Callers
 * should render a loading state until `plans.length > 0`.
 *
 * Uses TanStack Query so the prefetch in `_layout.tsx` and any
 * later paywall mount share the same cache and don't double-fetch.
 */
export function usePaywallPlans(): {
  plans: PlanDef[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["paywall-offerings"],
    queryFn: getOfferingPackages,
    // Offerings rarely change. 5 min cache keeps the experience
    // snappy on the second paywall view in a session.
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const plans = useMemo<PlanDef[]>(() => {
    if (!data) return [];
    const monthlyPrice = data.monthly?.product.priceString;
    return PLAN_IDS.map((id) => {
      const pkg = data[id];
      return pkg ? buildPlanDef(id, pkg, monthlyPrice) : null;
    }).filter((p): p is PlanDef => p !== null);
  }, [data]);

  return {
    plans,
    isLoading,
    isError,
    refetch: () => {
      refetch();
    },
  };
}
