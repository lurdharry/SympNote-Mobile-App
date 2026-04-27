// @ts-nocheck — orphan file, kept on disk for restoration. Do not edit.
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
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
import type { PregnancyStatus } from "@/stores/types";

interface ChipOption<V extends string> {
  v: V;
  label: string;
  hint?: string;
}

const PREGNANCY_OPTIONS: ChipOption<PregnancyStatus>[] = [
  { v: "no", label: "No" },
  { v: "yes", label: "Yes" },
  { v: "possibly", label: "Possibly" },
  { v: "unknown", label: "Prefer not to say" },
];

/**
 * Health context — pregnancy ask only. Allergy categories + the
 * dynamic specifics walk were cut from onboarding (files retained in
 * the repo for now). The screen is now only routed to when sex ===
 * "female"; non-female users skip straight from questions to the
 * first recording.
 *
 * Tracking style (a UX preference, not a clinical prior) lives on
 * its own screen after this one.
 */
const ScreenHealthContext: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);
  const sex = useProfileStore(
    (s) => (s.onboardingAnswers.sex as string | undefined) ?? null,
  );

  const showPregnancy = sex === "female";

  const [pregnancy, setPregnancy] = useState<PregnancyStatus | null>(null);

  const canContinue = useMemo(() => {
    // Pregnancy is the only ask on this screen now (allergies + their
    // dynamic walk were cut from onboarding for friction reasons).
    // The screen is only routed to when sex === "female"; non-female
    // users skip it entirely from questions.tsx.
    if (showPregnancy && !pregnancy) return false;
    return true;
  }, [showPregnancy, pregnancy]);

  const onContinue = () => {
    if (!canContinue) return;
    if (showPregnancy && pregnancy) setAnswer("pregnancyStatus", pregnancy);
    router.push("/onboarding/summary");
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
            <OnboardingProgress value={0.5} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: colors.accent }]}>HEALTH CONTEXT</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              One clinical{"\n"}prior.
            </Text>

            {/* Pregnancy — only ask shown on this screen now. The
                screen itself is only routed to when sex === 'female';
                everyone else skips straight to the recording step. */}
            {showPregnancy && (
              <Section label="PREGNANCY" styles={styles} colors={colors}>
                <ChipGrid>
                  {PREGNANCY_OPTIONS.map((o) => (
                    <ChipBtn
                      key={o.v}
                      active={pregnancy === o.v}
                      onPress={() => {
                        hapticLight();
                        setPregnancy(o.v);
                      }}
                      label={o.label}
                      colors={colors}
                      styles={styles}
                    />
                  ))}
                </ChipGrid>
              </Section>
            )}

            <View style={{ height: spacing.s4 }} />
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={canContinue ? "Sharpen the AI" : "Pick an option"}
              onPress={onContinue}
              disabled={!canContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

interface SectionProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  styles: ReturnType<typeof useStyles>;
  colors: ReturnType<typeof useTheme>["colors"];
}
const Section: React.FC<SectionProps> = ({ label, hint, children, styles, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
    {hint && <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>{hint}</Text>}
    {children}
  </View>
);

const ChipGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <View style={styles.chipGrid}>{children}</View>;
};

interface ChipBtnProps {
  active: boolean;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
  variant?: "default" | "ghost";
}
const ChipBtn: React.FC<ChipBtnProps> = ({ active, label, onPress, colors, styles }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: active ? colors.accent + "1A" : "transparent",
        borderColor: active ? colors.accent : colors.border,
      },
    ]}
  >
    <Text
      style={[
        styles.chipText,
        { color: active ? colors.accent : colors.textPrimary },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

export default ScreenHealthContext;

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
  },
  section: {
    marginTop: theme.spacing.s6,
    gap: theme.spacing.s2,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  sectionHint: {
    ...typography.caption,
    fontStyle: "italic",
    fontSize: fontScale(11),
    lineHeight: fontScale(16),
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: theme.spacing.s2,
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
  },
  // ── Allergy row cards — vertical stack of full-width rows
  allergyStack: {
    marginTop: theme.spacing.s2,
    gap: moderateScale(10),
  },
  allergyRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  allergyRowLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
  allergyRowHint: {
    ...typography.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 2,
  },
  allergyCheckBox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCol: {
    gap: moderateScale(10),
    marginTop: theme.spacing.s2,
  },
  bigCard: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  bigCardLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
  bigCardHint: {
    ...typography.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 4,
  },
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
}));