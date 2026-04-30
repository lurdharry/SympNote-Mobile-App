import React from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { PlusMascot, RestoreMascot } from "@/components/settings/SettingsMascots";
import { useProfileStore } from "@/stores/useProfileStore";
import { restorePurchases } from "@/services/subscription";
import { showError, showInfo, showSuccess } from "@/components/ui/Toast";
import type { SubscriptionStatus } from "@/stores/types";
import type { SettingsRow } from "../useSettingsSections";

const PLAN_LABELS: Record<"monthly" | "annual", string> = {
  monthly: "Monthly",
  annual: "Annual",
};

const subscriptionLabel = (status: SubscriptionStatus): string => {
  if (status === "trial") return "Trial";
  if (status === "active") return "Active";
  return "Not subscribed";
};

const formatRenewalDate = (iso: string | null): string => {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return "";
  }
};

/**
 * Build the value for the entitled "Sympnote Plus" row. Returns a
 * ReactNode so the price and renewal date render in
 * `emphasisColor` (the brand accent) while the surrounding labels
 * stay in the row's default tertiary tone. Visual hierarchy makes
 * the numbers the user actually cares about (amount + date) the
 * most readable thing on the row, satisfying App Review 2.1(b)'s
 * requirement that subscription details be visible in-app.
 */
const buildSubscriptionValue = (
  status: SubscriptionStatus,
  planId: "monthly" | "annual" | null,
  trialEndsAt: string | null,
  activePrice: string | null,
  emphasisColor: string,
): React.ReactNode => {
  const planText = planId ? PLAN_LABELS[planId] : subscriptionLabel(status);
  const date = formatRenewalDate(trialEndsAt);
  const emphasisStyle = {
    color: emphasisColor,
    fontFamily: "DMSans_600SemiBold",
  };

  if (status === "trial") {
    return (
      <Text>
        {planText} · Trial
        {date ? (
          <>
            {" · Ends "}
            <Text style={emphasisStyle}>{date}</Text>
          </>
        ) : null}
      </Text>
    );
  }

  return (
    <Text>
      {planText}
      {activePrice ? (
        <>
          {" · "}
          <Text style={emphasisStyle}>{activePrice}</Text>
        </>
      ) : null}
      {date ? (
        <>
          {" · Renews "}
          <Text style={emphasisStyle}>{date}</Text>
        </>
      ) : null}
    </Text>
  );
};

/**
 * Settings-level Restore handler. Mirrors the paywall's restore
 * behavior so users who never see a paywall can still recover a
 * subscription tied to this Apple ID. Required for App Review on
 * subscription apps.
 */
const handleRestore = async () => {
  try {
    const result = await restorePurchases();
    if (result.restored) {
      useProfileStore.getState().setSubscription(result.status, result.trialEndsAt);
      showSuccess("Subscription restored", {
        body: "We've reactivated your Sympnote Plus access on this device.",
      });
    } else {
      showInfo("No purchases found", {
        body: "We couldn't find an active subscription on this Apple ID. Contact support@sympnote.app if you believe this is wrong.",
      });
    }
  } catch (e) {
    showError("Couldn't restore", {
      body: e instanceof Error ? e.message : "Something went wrong reaching the App Store.",
    });
  }
};

export interface SubscriptionRowsArgs {
  router: ReturnType<typeof useRouter>;
  isEntitled: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  planId: "monthly" | "annual" | null;
  activePrice: string | null;
  emphasisColor: string;
}

/**
 * Build the rows for the Subscription section. When entitled the
 * single "Sympnote Plus" row carries plan + amount + expiry in its
 * value line. App Review guideline 2.1(b) requires subscription
 * state to be visible in-app — packing it into the value satisfies
 * that without exiting to the App Store from any row. (An earlier
 * build was rejected for launching the App Store from this row.)
 */
export const buildSubscriptionRows = ({
  router,
  isEntitled,
  subscriptionStatus,
  trialEndsAt,
  planId,
  activePrice,
  emphasisColor,
}: SubscriptionRowsArgs): SettingsRow[] => [
  {
    Mascot: PlusMascot,
    label: "Sympnote Plus",
    value: isEntitled
      ? buildSubscriptionValue(
          subscriptionStatus,
          planId,
          trialEndsAt,
          activePrice,
          emphasisColor,
        )
      : "Subscribe",
    badge: isEntitled ? "PLUS" : undefined,
    onPress: isEntitled ? undefined : () => router.push("/paywall"),
  },
  {
    Mascot: RestoreMascot,
    label: "Restore purchases",
    value: "Recover a previous subscription",
    onPress: handleRestore,
  },
];
