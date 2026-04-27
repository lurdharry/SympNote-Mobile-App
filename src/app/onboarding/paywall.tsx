import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, ShieldCheck, Stethoscope, X as XIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "../../theme";
import { PocketbookMascot } from "../../components/onboarding/PocketbookMascot";
import { PlanCard } from "../../components/onboarding/paywall/PlanCard";
import { CraftingOverlay } from "../../components/onboarding/paywall/CraftingOverlay";
import { PaywallFooter } from "../../components/onboarding/paywall/PaywallFooter";
import { Plan } from "../../services/subscription";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { usePaywallPurchase } from "../../hooks/usePaywallPurchase";
import { PAYWALL_PLANS } from "../../constants/plans";
import { useBriefsStore } from "../../stores/useBriefsStore";

/**
 * Compose the paywall hero copy from the user's actual first brief
 * when one exists. Pulling their top concern (or a clean summary
 * snippet) makes the ask read as "we did this for you" rather than
 * "buy our app." Falls back to brand copy when the brief is missing
 * or empty.
 */
const composePaywallHero = (
  topConcernLabel: string | undefined,
  summaryFirstSentence: string | undefined,
): { eyebrow: string; headline: string; sub: string } => {
  if (topConcernLabel) {
    const concern = topConcernLabel.trim();
    const lower = concern.charAt(0).toLowerCase() + concern.slice(1);
    return {
      eyebrow: "YOUR FIRST BRIEF IS READY",
      headline: `Sympnote heard you about\n${lower}.`,
      sub: "Keep your record sharp — every brief sharper than the last.",
    };
  }
  if (summaryFirstSentence) {
    return {
      eyebrow: "YOUR FIRST BRIEF IS READY",
      headline: "Your first brief is ready.",
      sub: summaryFirstSentence,
    };
  }
  return {
    eyebrow: "ONE STEP TO GO",
    headline: "Make Sympnote yours.",
    sub: "Unlimited briefs, doctor-ready exports, your data on your device.",
  };
};

const ScreenPaywall: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const [selected, setSelected] = useState<Plan["id"]>("monthly");
  const { loading, crafting, buy, skipDev } = usePaywallPurchase();

  const selectedPlan = PAYWALL_PLANS.find((p) => p.id === selected);

  const latestBrief = useBriefsStore((s) => s.briefs[0]);
  const hero = useMemo(() => {
    const concern = latestBrief?.content.topConcerns[0]?.label;
    const summarySentence = latestBrief?.content.summary
      ? latestBrief.content.summary.split(/(?<=[.!?])\s+/)[0]
      : undefined;
    return composePaywallHero(concern, summarySentence);
  }, [latestBrief]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.grabber} />
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <XIcon size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotSlot}>
            <PocketbookMascot reduced={reduced} size={moderateScale(180)} />
          </View>

          <Text style={[styles.heroEyebrow, { color: colors.accent }]}>{hero.eyebrow}</Text>
          <Text style={[styles.heroHeadline, { color: colors.textPrimary }]}>
            {hero.headline}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>{hero.sub}</Text>

          {/* Trust row — three credibility signals stamped at the
              moment of payment. Privacy + clinical input + cancel
              freedom are the three biggest blockers for paid health
              apps; this row addresses each in one beat. */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <View style={[styles.trustTile, { backgroundColor: colors.accent + "1A" }]}>
                <ShieldCheck
                  size={moderateScale(13)}
                  color={colors.accent}
                  strokeWidth={2.4}
                />
              </View>
              <Text style={[styles.trustLabel, { color: colors.textPrimary }]}>
                On-device
              </Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustTile, { backgroundColor: colors.accent + "1A" }]}>
                <Stethoscope
                  size={moderateScale(13)}
                  color={colors.accent}
                  strokeWidth={2.4}
                />
              </View>
              <Text style={[styles.trustLabel, { color: colors.textPrimary }]}>
                Built with clinicians
              </Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustTile, { backgroundColor: colors.accent + "1A" }]}>
                <Lock size={moderateScale(13)} color={colors.accent} strokeWidth={2.4} />
              </View>
              <Text style={[styles.trustLabel, { color: colors.textPrimary }]}>
                Cancel anytime
              </Text>
            </View>
          </View>

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

          {__DEV__ && (
            <Pressable
              onPress={skipDev}
              style={{ marginTop: spacing.s5, alignSelf: "center" }}
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

export default ScreenPaywall;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s2,
    alignItems: "center",
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
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    marginTop: theme.spacing.s5,
    paddingHorizontal: theme.spacing.s2,
    gap: moderateScale(8),
  },
  trustItem: {
    alignItems: "center",
    gap: moderateScale(5),
    flex: 1,
  },
  trustTile: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 0.2,
    textAlign: "center",
  },
}));
