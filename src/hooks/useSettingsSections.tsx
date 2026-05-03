import type React from "react";
import { Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PRIVACY_POLICY_URL, SUPPORT_URL, TERMS_URL } from "@/constants/legal";
import { useTheme } from "@/theme";
import {
  ClearMascot,
  DisclaimerMascot,
  ExportMascot,
  HelpMascot,
  PrivacyPolicyMascot,
  TermsMascot,
} from "@/components/settings/SettingsMascots";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticSuccess } from "@/services/haptics";
import { exportUserData } from "@/services/export";
import { getOfferingPackages } from "@/services/subscription";
import { showError, showInfo, showSuccess } from "@/components/ui/Toast";
import { buildProfileRows } from "./settings/buildProfileRows";
import { buildSubscriptionRows } from "./settings/buildSubscriptionRows";

type Mascot = React.FC<{ size?: number }>;

export interface SettingsRow {
  /** Bespoke SVG mascot rendered as the row's leading element. */
  Mascot: Mascot;
  label: string;
  /** String for plain text rows; ReactNode for rows that need
   *  inline colored spans (e.g. the Subscription row emphasises
   *  price + renewal date). The host RowItem wraps the value in a
   *  caption-styled Text — child Text spans override color. */
  value?: React.ReactNode;
  badge?: string;
  onPress?: () => void;
  /** Marks the row as destructive — the row item uses this to dim
   *  the label tone slightly. The mascot itself already carries its
   *  own palette (e.g. ClearMascot is coral), so no icon tint needed. */
  destructive?: boolean;
}

export interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

const clearAllContent = () => {
  Alert.alert(
    "Clear all data?",
    "This deletes every recording, appointment, and visit brief. Your profile and subscription stay. You can start fresh right after.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear everything",
        style: "destructive",
        onPress: () => {
          useRecordingsStore.setState({ recordings: [] });
          useAppointmentsStore.setState({ appointments: [] });
          usePendingRecordingStore.getState().clear();
          useProfileStore.setState({ firstEntryHeroDismissed: false });
          hapticSuccess();
          showSuccess("Cleared", { body: "Your record has been reset." });
        },
      },
    ],
  );
};

/**
 * Builds the grouped settings sections. Theme toggle and conditions
 * editor are NOT here — they're dedicated components rendered
 * directly in settings.tsx because they don't fit the simple
 * label/value/onPress row contract.
 *
 * Per-section row builders live in `./settings/`. The hook reads
 * the data each section needs and threads it into the builders.
 */
export const useSettingsSections = (): SettingsSection[] => {
  const router = useRouter();
  const { colors } = useTheme();
  const recordings = useRecordingsStore((s) => s.recordings);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const planId = useProfileStore((s) => s.planId);
  const personalization = useProfileStore((s) => s.personalization);
  const isEntitled = subscriptionStatus === "trial" || subscriptionStatus === "active";

  // Live offerings — same cache the paywall uses (prefetched in
  // _layout.tsx). Read here to surface the localized price alongside
  // the user's subscription state, satisfying App Review's 2.1(b)
  // requirement that subscription details be visible in-app.
  const { data: offerings } = useQuery({
    queryKey: ["paywall-offerings"],
    queryFn: getOfferingPackages,
    staleTime: 1000 * 60 * 5,
    enabled: isEntitled,
  });
  const activePrice =
    planId && offerings?.[planId]?.product.priceString
      ? offerings[planId]?.product.priceString
      : null;

  return [
    { title: "Profile", rows: buildProfileRows(router, personalization) },
    {
      title: "Privacy & data",
      rows: [
        {
          Mascot: PrivacyPolicyMascot,
          label: "Privacy policy",
          onPress: () => {
            Linking.openURL(PRIVACY_POLICY_URL).catch(() => {
              showError("Couldn't open", { body: "Try again with a connection." });
            });
          },
        },
        {
          Mascot: TermsMascot,
          label: "Terms of use",
          value: "Read in browser",
          onPress: () => {
            Linking.openURL(TERMS_URL).catch(() => {
              showError("Couldn't open", { body: "Try again with a connection." });
            });
          },
        },
        {
          Mascot: ExportMascot,
          label: `Export your data`,
          value: `${recordings.length} ${recordings.length === 1 ? "recording" : "recordings"} · JSON`,
          onPress: exportUserData,
        },
        {
          Mascot: DisclaimerMascot,
          label: "Medical disclaimer",
          onPress: () =>
            showInfo("Not medical advice", {
              body: "Sympnote is an organizational tool. Always consult your doctor for medical decisions.",
            }),
        },
        {
          Mascot: ClearMascot,
          label: "Clear all data",
          value: "Recordings, appointments, briefs",
          destructive: true,
          onPress: clearAllContent,
        },
      ],
    },
    {
      title: "Subscription",
      rows: buildSubscriptionRows({
        router,
        isEntitled,
        subscriptionStatus,
        trialEndsAt,
        planId,
        activePrice,
        emphasisColor: colors.accent,
      }),
    },
    {
      title: "Help",
      rows: [
        {
          Mascot: HelpMascot,
          label: "Help & support",
          value: "FAQs and contact",
          onPress: () => {
            Linking.openURL(SUPPORT_URL).catch(() => {
              showError("Couldn't open", { body: "Try again with a connection." });
            });
          },
        },
      ],
    },
  ];
};
