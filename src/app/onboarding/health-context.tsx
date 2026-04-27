import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
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
import {
  DrugMascot,
  FoodMascot,
  LatexMascot,
  NoneMascot,
  OtherMascot,
  PollenMascot,
} from "@/components/onboarding/AllergyMascots";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import type { PregnancyStatus } from "@/stores/types";

interface ChipOption<V extends string> {
  v: V;
  label: string;
  hint?: string;
}

interface AllergyOption {
  v: string;
  label: string;
  hint: string;
  Mascot: React.FC<{ size?: number }>;
}

const PREGNANCY_OPTIONS: ChipOption<PregnancyStatus>[] = [
  { v: "no", label: "No" },
  { v: "yes", label: "Yes" },
  { v: "possibly", label: "Possibly" },
  { v: "unknown", label: "Prefer not to say" },
];

/**
 * Allergy categories rendered as full-width row cards, each anchored
 * by a custom paper-clinical mascot. Mascots live in
 * components/onboarding/AllergyMascots — same family as the home /
 * paywall illustrations.
 */
const ALLERGY_OPTIONS: AllergyOption[] = [
  {
    v: "__none",
    label: "No allergies",
    hint: "Nothing the AI needs to weight against — this is your default.",
    Mascot: NoneMascot,
  },
  {
    v: "drug",
    label: "Drug",
    hint: "Antibiotics, NSAIDs, anaesthetics — anything pharmacy-shelf.",
    Mascot: DrugMascot,
  },
  {
    v: "food",
    label: "Food",
    hint: "Nuts, shellfish, dairy, gluten — and the rest.",
    Mascot: FoodMascot,
  },
  {
    v: "environmental",
    label: "Environmental",
    hint: "Pollen, dust, pet dander, mold — seasonal or chronic.",
    Mascot: PollenMascot,
  },
  {
    v: "latex",
    label: "Latex",
    hint: "Gloves, balloons, medical adhesives — skin-contact reactions.",
    Mascot: LatexMascot,
  },
  {
    v: "other",
    label: "Something else",
    hint: "Worth flagging but doesn't fit the categories above.",
    Mascot: OtherMascot,
  },
];

/**
 * Health context — the second qualifier screen. Two clinical priors
 * the AI needs that don't fit a single-symptom assumption:
 *
 *   • pregnancy status — only when sex is 'female' (set on the prior
 *     questions screen). Massive clinical prior for that branch.
 *   • allergies — separate from conditions; carry distinct clinical
 *     weight (drug / contrast-agent decisions ride on them).
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
  const [allergyTags, setAllergyTags] = useState<Set<string>>(new Set());
  const [allergyNone, setAllergyNone] = useState(false);

  const onAllergyTap = (v: string) => {
    hapticLight();
    if (v === "__none") {
      setAllergyNone(true);
      setAllergyTags(new Set());
      return;
    }
    setAllergyNone(false);
    setAllergyTags((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const canContinue = useMemo(() => {
    // Pregnancy is required when shown.
    if (showPregnancy && !pregnancy) return false;
    // Allergies require either "None" or at least one tag.
    if (!allergyNone && allergyTags.size === 0) return false;
    return true;
  }, [showPregnancy, pregnancy, allergyNone, allergyTags]);

  const onContinue = () => {
    if (!canContinue) return;
    if (showPregnancy && pregnancy) setAnswer("pregnancyStatus", pregnancy);
    setAnswer("allergies", allergyNone ? [] : Array.from(allergyTags));
    router.push("/onboarding/tracking-style");
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
            <OnboardingProgress value={0.35} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: colors.accent }]}>HEALTH CONTEXT</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Two clinical{"\n"}priors.
            </Text>

            {/* ── Pregnancy (conditional) ─────────────────────── */}
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

            {/* ── Allergies — full-width row cards w/ mascots ─── */}
            <Section label="ALLERGIES" styles={styles} colors={colors}>
              <View style={styles.allergyStack}>
                {ALLERGY_OPTIONS.map((o) => {
                  const active =
                    o.v === "__none" ? allergyNone : !allergyNone && allergyTags.has(o.v);
                  return (
                    <Pressable
                      key={o.v}
                      onPress={() => onAllergyTap(o.v)}
                      style={[
                        styles.allergyRowCard,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: active ? colors.accent : colors.border,
                          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                        },
                        shadows.card,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${o.label}: ${o.hint}`}
                    >
                      <o.Mascot size={moderateScale(56)} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            styles.allergyRowLabel,
                            { color: active ? colors.accent : colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {o.label}
                        </Text>
                        <Text
                          style={[styles.allergyRowHint, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {o.hint}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.allergyCheckBox,
                          {
                            backgroundColor: active ? colors.accent : "transparent",
                            borderColor: active ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        {active && (
                          <Check size={moderateScale(13)} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <View style={{ height: spacing.s4 }} />
          </ScrollView>

          <View style={styles.cta}>
            <PrimaryButton
              label={canContinue ? "Sharpen the AI" : "Pick an option in each"}
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
