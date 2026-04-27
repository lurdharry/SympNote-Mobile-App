import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from "@/theme";
import { PocketbookMascot } from "@/components/onboarding/PocketbookMascot";
import { PlanCard } from "@/components/onboarding/paywall/PlanCard";
import { CraftingOverlay } from "@/components/onboarding/paywall/CraftingOverlay";
import { PaywallFooter } from "@/components/onboarding/paywall/PaywallFooter";
import { Plan } from "@/services/subscription";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import {
  KEEP_FEATURES,
  PAYWALL_PLANS,
  composePaywallHero,
} from "@/constants/plans";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useProfileStore } from "@/stores/useProfileStore";

/**
 * Shared paywall body. Two callers:
 *
 *  - `mode="onboarding"`: rendered by `/onboarding/paywall.tsx` at the
 *    end of the onboarding flow. **No close affordance** — first-time
 *    users must pick a plan (trial counts) to enter the app. Runs
 *    the full purchase pipeline (commits the pending draft, flips
 *    `onboardingComplete`, routes to home).
 *  - `mode="gate"`: rendered by `/paywall.tsx` as a dismissable modal
 *    when an action gate fires post-onboarding. Has an X to dismiss
 *    (user can return to view-only). Purchase just transacts; the
 *    EntitlementContext flips `entitled` to true and any view-level
 *    LockedView placeholders auto-unmount.
 *
 * Hero copy reads from the most recent brief in either mode so the
 * ask remains personal — the user's onboarding brief stays on device
 * even when their subscription doesn't.
 */
export interface PaywallContentProps {
  mode: "onboarding" | "gate";
}

export const PaywallContent: React.FC<PaywallContentProps> = ({ mode }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const purchaseMode = mode === "onboarding" ? "onboarding" : "gate";

  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const { loading, crafting, buy, skipDev } = usePaywallPurchase(purchaseMode);

  const selectedPlan = PAYWALL_PLANS.find((p) => p.id === selected);

  const latestBrief = useBriefsStore((s) => s.briefs[0]);
  const prepGap = useProfileStore((s) => s.personalization?.prepGap);
  const hero = useMemo(() => {
    const concern = latestBrief?.content.topConcerns[0]?.label;
    const summarySentence = latestBrief?.content.summary
      ? latestBrief.content.summary.split(/(?<=[.!?])\s+/)[0]
      : undefined;
    return composePaywallHero(concern, summarySentence, prepGap);
  }, [latestBrief, prepGap]);

  // Onboarding paywall is a hard gate — no escape until they pick a
  // plan. The in-app gate modal can be dismissed (user returns to
  // view-only) so an X button is rendered there.
  const showClose = mode === "gate";

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.grabber} />
          {showClose ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={[styles.close, { backgroundColor: colors.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon
                size={moderateScale(16)}
                color={colors.textPrimary}
                strokeWidth={2.2}
              />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mascotSlot}>
            <PocketbookMascot reduced={reduced} size={moderateScale(100)} />
          </View>

          <Text style={[styles.heroEyebrow, { color: colors.accent }]}>
            {hero.eyebrow}
          </Text>
          <Text style={[styles.heroHeadline, { color: colors.textPrimary }]}>
            {hero.headline}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {hero.sub}
          </Text>

          {/* Plans visible early — the user shouldn't have to scroll
              past three trust elements to find the choice. */}
          <View style={styles.plans}>
            {PAYWALL_PLANS.map((p, i) => (
              <PlanCard
                key={p.id}
                plan={p}
                index={i}
                selected={selected === p.id}
                onSelect={() => setSelected(p.id)}
              />
            ))}
          </View>

          {/* Compact "what you keep" — label-only rows, no hint
              sublines. Loss frame stays; the dense card doesn't. */}
          <View
            style={[
              styles.featuresCard,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
            ]}
          >
            {KEEP_FEATURES.map((f, i) => (
              <View
                key={f.label}
                style={[
                  styles.featureRow,
                  i > 0 && {
                    borderTopColor: colors.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureCheck,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Check size={moderateScale(10)} color="#FFFFFF" strokeWidth={3.2} />
                </View>
                <Text
                  style={[styles.featureLabel, { color: colors.textPrimary }]}
                >
                  {f.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Single muted trust line — replaces the three-chip row.
              Same content, ~80% less visual weight. */}
          <Text style={[styles.trustLine, { color: colors.textTertiary }]}>
            Private · Built with clinicians · Cancel anytime
          </Text>

          {__DEV__ && (
            <Pressable
              onPress={skipDev}
              style={{ marginTop: spacing.s4, alignSelf: "center" }}
              hitSlop={12}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textDecorationLine: "underline",
                  },
                ]}
              >
                Dev: skip paywall
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <PaywallFooter
          selectedPlan={selectedPlan}
          loading={loading}
          onBuy={() => buy(selected)}
        />
      </SafeAreaView>

      {crafting && <CraftingOverlay reduced={reduced} />}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s2,
    alignItems: "center",
    minHeight: moderateScale(40),
  },
  grabber: {
    width: moderateScale(36),
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  close: {
    position: "absolute",
    top: theme.spacing.s2,
    right: theme.spacing.s5,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s6,
  },
  mascotSlot: {
    alignItems: "center",
    marginTop: theme.spacing.s2,
  },
  plans: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(12),
  },
  heroEyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    textAlign: "center",
    marginTop: theme.spacing.s2,
  },
  heroHeadline: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    letterSpacing: -0.4,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: theme.spacing.s4,
  },
  heroSub: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    textAlign: "center",
    marginTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
  },
  featuresCard: {
    marginTop: theme.spacing.s4,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
  },
  featureLabel: {
    flex: 1,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
  },
  featureCheck: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  trustLine: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: theme.spacing.s4,
  },
}));
