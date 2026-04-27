import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BellRing, Check, Shuffle, Zap } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import type { TrackingStyle } from "@/stores/types";

interface TrackingOption {
  v: TrackingStyle;
  label: string;
  hint: string;
  Icon: typeof BellRing;
  /** Two-stop gradient applied to the icon tile. */
  grad: [string, string];
}

const OPTIONS: TrackingOption[] = [
  {
    v: "daily",
    label: "Every day",
    hint: "Quick check-in each morning. Even when nothing's wrong, you build a baseline.",
    Icon: BellRing,
    grad: ["#3BA79F", "#2C6E6B"],
  },
  {
    v: "episodic",
    label: "When something feels off",
    hint: "Open the app when symptoms flare. No daily nag — just there when you need it.",
    Icon: Zap,
    grad: ["#E07A5F", "#C45C3F"],
  },
  {
    v: "mixed",
    label: "A bit of both",
    hint: "Daily check-ins on bad weeks, ambient on good ones. Most people land here.",
    Icon: Shuffle,
    grad: ["#F6C06A", "#D9964A"],
  },
];

/**
 * Tracking style — purely a UX preference (not clinical), but
 * meaningful enough to deserve its own screen. Calibrates the home
 * screen's daily-prompt vs ambient feel and the AI's narrative tone
 * (continuous tracking vs episodic incidents).
 *
 * Three big cards, each with its own gradient-tile icon so the
 * difference between options reads at a glance.
 */
const ScreenTrackingStyle: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [picked, setPicked] = useState<TrackingStyle | null>(null);

  const onContinue = () => {
    if (!picked) return;
    setAnswer("trackingStyle", picked);
    router.push("/onboarding/focus");
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: moderateScale(40) }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.45} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR RHYTHM</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              How will you{"\n"}use Sympnote?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              We'll shape the home screen and the AI's tone around your answer. Change it
              anytime in Settings.
            </Text>

            <View style={styles.list}>
              {OPTIONS.map((o) => {
                const selected = picked === o.v;
                return (
                  <Pressable
                    key={o.v}
                    onPress={() => {
                      hapticLight();
                      setPicked(o.v);
                    }}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: selected ? colors.accent : colors.border,
                        borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
                      },
                      shadows.card,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.label}. ${o.hint}`}
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.iconTile}>
                      <LinearGradient
                        colors={o.grad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <o.Icon
                        size={moderateScale(22)}
                        color="#FFFFFF"
                        strokeWidth={2.2}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[styles.cardLabel, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {o.label}
                      </Text>
                      <Text
                        style={[styles.cardHint, { color: colors.textSecondary }]}
                      >
                        {o.hint}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.check,
                        {
                          backgroundColor: selected ? colors.accent : "transparent",
                          borderColor: selected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      {selected && (
                        <Check size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.5} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: spacing.s4 }} />
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={picked ? "Lock in my rhythm" : "Pick one to continue"}
              onPress={onContinue}
              disabled={!picked}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenTrackingStyle;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressSlot: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s2,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s5,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  headline: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
    maxWidth: moderateScale(360),
  },
  list: {
    marginTop: theme.spacing.s6,
    gap: moderateScale(12),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
  },
  iconTile: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(13),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
  cardHint: {
    ...typography.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 3,
  },
  check: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
}));
