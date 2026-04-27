import React, { useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { fontScale, makeStyles, moderateScale, useTheme, verticalScale } from "../../../theme";
import { PrimaryButton } from "../../ui/PrimaryButton";
import { PlanDef } from "../../../constants/plans";
import { restorePurchases } from "../../../services/subscription";
import { useProfileStore } from "../../../stores/useProfileStore";
import { hapticLight } from "../../../services/haptics";

interface PaywallFooterProps {
  selectedPlan: PlanDef | undefined;
  loading: boolean;
  onBuy: () => void;
}

export const PaywallFooter: React.FC<PaywallFooterProps> = ({ selectedPlan, loading, onBuy }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [restoring, setRestoring] = useState(false);

  const perDuration = `${selectedPlan?.price ?? ""} ${
    selectedPlan ? `/${selectedPlan.per.replace("per ", "")}` : ""
  }`;
  const isFreeTrial = !!selectedPlan?.trialBadge;

  // App Review requires a working Restore Purchases path on every
  // paywall. Calls into the (currently mocked) subscription service;
  // when RevenueCat is wired this becomes the real recover path.
  // Success flips entitlement via the profile store, which the
  // EntitlementContext picks up reactively — no navigation needed.
  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    hapticLight();
    try {
      const result = await restorePurchases();
      if (result.restored) {
        useProfileStore
          .getState()
          .setSubscription(result.status, result.trialEndsAt);
        Alert.alert(
          "Subscription restored",
          "We've reactivated your Sympnote Plus access on this device.",
        );
      } else {
        Alert.alert(
          "No purchases found",
          "We couldn't find an active subscription on this Apple ID. If you believe this is wrong, contact support@sympnote.app.",
        );
      }
    } catch (e) {
      Alert.alert(
        "Couldn't restore",
        e instanceof Error ? e.message : "Something went wrong reaching the App Store.",
      );
    } finally {
      setRestoring(false);
    }
  };
  const onTerms = () => {
    Linking.openURL("https://sympnote.app/terms").catch(() => {
      Alert.alert("Couldn't open Terms", "Visit sympnote.app/terms in your browser.");
    });
  };
  const onPrivacy = () => {
    Linking.openURL("https://sympnote.app/privacy").catch(() => {
      Alert.alert("Couldn't open Privacy", "Visit sympnote.app/privacy in your browser.");
    });
  };

  return (
    <View style={styles.ctaArea}>
      <Text style={[styles.todayLine, { color: colors.textPrimary }]}>
        {isFreeTrial
          ? `0 today · Then ${perDuration}`
          : `${selectedPlan?.subline} • ${selectedPlan?.saveBadge}`}
      </Text>
      <Text style={[styles.autorenewLine, { color: colors.textTertiary }]}>
        {isFreeTrial ? "Auto-renews." : "Billed annually."} Cancel anytime.
      </Text>
      <PrimaryButton
        label={isFreeTrial ? "Start free trial" : `Subscribe • ${perDuration}`}
        onPress={onBuy}
        loading={loading}
      />
      <View style={styles.legalRow}>
        <Pressable hitSlop={8} onPress={onRestore} disabled={restoring}>
          <Text style={[styles.legalLink, { color: colors.textTertiary }]}>
            {restoring ? "Restoring…" : "Restore"}
          </Text>
        </Pressable>
        <View style={[styles.legalDot, { backgroundColor: colors.textTertiary }]} />
        <Pressable hitSlop={8} onPress={onTerms}>
          <Text style={[styles.legalLink, { color: colors.textTertiary }]}>Terms</Text>
        </Pressable>
        <View style={[styles.legalDot, { backgroundColor: colors.textTertiary }]} />
        <Pressable hitSlop={8} onPress={onPrivacy}>
          <Text style={[styles.legalLink, { color: colors.textTertiary }]}>Privacy</Text>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  ctaArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(6),
    borderTopWidth: 0.5,
    borderColor: theme.colors.border,
  },
  todayLine: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    textAlign: "center",
  },
  autorenewLine: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(11),
    textAlign: "center",
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(14),
    paddingTop: verticalScale(6),
  },
  legalLink: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  legalDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
}));
