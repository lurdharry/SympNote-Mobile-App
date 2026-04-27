// @ts-nocheck — orphan file, kept on disk for restoration. Do not edit.
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Plus, X } from "lucide-react-native";
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
import {
  CustomMascot,
  getAllergySpecificMascot,
} from "@/components/onboarding/AllergySpecificMascots";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import { ALLERGY_CATEGORY_LABELS, ALLERGY_SPECIFICS } from "@/constants/onboarding";
import type { AllergyEntry } from "@/stores/types";

/**
 * Health-context bookends the allergy walk at 0.35; tracking-style at
 * 0.45. The dynamic screens divide that band evenly so the bar still
 * advances even when the walk has only one screen.
 */
const PROGRESS_START = 0.35;
const PROGRESS_END = 0.45;

const computeProgress = (i: number, total: number): number => {
  if (total <= 0) return PROGRESS_END;
  const span = PROGRESS_END - PROGRESS_START;
  return PROGRESS_START + ((i + 1) / (total + 1)) * span;
};

/**
 * Per-category copy. Each category gets a distinct eyebrow + headline
 * so consecutive screens don't read as a copy-paste template.
 */
const COPY: Record<string, { eyebrow: string; headline: string; sub: string }> = {
  drug: {
    eyebrow: "DRUG ALLERGIES",
    headline: "Which drugs?",
    sub: "Tap any you know about. The AI weights prescription mentions against this — partial info still helps.",
  },
  food: {
    eyebrow: "FOOD ALLERGIES",
    headline: "Which foods?",
    sub: "Tap any that apply. Add anything else at the bottom.",
  },
  environmental: {
    eyebrow: "ENVIRONMENTAL ALLERGIES",
    headline: "Which triggers?",
    sub: "Seasonal, household, outdoor — anything that flares your symptoms.",
  },
  other: {
    eyebrow: "SOMETHING ELSE",
    headline: "Tell us what.",
    sub: "Type anything that doesn't fit the categories above. One per line — tap + to save each.",
  },
};

const fallbackCopy = (category: string) => ({
  eyebrow: (ALLERGY_CATEGORY_LABELS[category] ?? category).toUpperCase(),
  headline: "Any specifics?",
  sub: "Pick any that apply, or skip if nothing fits.",
});

/**
 * One screen of the dynamic allergy-details walk. Reads its position
 * from the route's query params (category + i + total + queue) and
 * either pushes the next category or routes on to tracking-style.
 *
 * Layout: 2-column grid of flat cards. Each card pairs a mini-mascot
 * (paper-clinical family, ~44pt) with the option label. Selection is
 * a tinted background + accent border + corner check pip. Custom
 * entries appear as small chips below the grid; the input row at the
 * bottom adds new ones.
 *
 * Selections are persisted into `onboardingAnswers.allergies` keyed by
 * category — the seed array (with empty `specifics`) was written on
 * health-context's Continue, so each step here just patches the
 * corresponding entry.
 */
const ScreenAllergyDetails: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<{
    category?: string;
    i?: string;
    total?: string;
    queue?: string;
  }>();

  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);
  const existing = useProfileStore((s) => s.onboardingAnswers.allergies);

  const category = params.category ?? "";
  const i = Number(params.i ?? "0");
  const total = Number(params.total ?? "1");
  const queue = (params.queue ?? "").split(",").filter(Boolean);

  const copy = COPY[category] ?? fallbackCopy(category);
  const presets = ALLERGY_SPECIFICS[category] ?? [];
  const isOther = category === "other";

  const seedSpecifics = useMemo<string[]>(() => {
    if (!Array.isArray(existing)) return [];
    const hit = (existing as AllergyEntry[]).find((e) => e?.category === category);
    return hit?.specifics ?? [];
  }, [existing, category]);

  const [picked, setPicked] = useState<Set<string>>(new Set(seedSpecifics));
  const [customs, setCustoms] = useState<string[]>(
    seedSpecifics.filter((s) => s.startsWith("custom:")),
  );
  const [draft, setDraft] = useState("");

  const togglePreset = (v: string) => {
    hapticLight();
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const value = `custom:${trimmed}`;
    if (customs.includes(value) || picked.has(value)) {
      setDraft("");
      return;
    }
    hapticLight();
    setCustoms((prev) => [...prev, value]);
    setPicked((prev) => {
      const next = new Set(prev);
      next.add(value);
      return next;
    });
    setDraft("");
  };

  const removeCustom = (value: string) => {
    hapticLight();
    setCustoms((prev) => prev.filter((v) => v !== value));
    setPicked((prev) => {
      const next = new Set(prev);
      next.delete(value);
      return next;
    });
  };

  const advance = (specifics: string[]) => {
    const current: AllergyEntry[] = Array.isArray(existing) ? (existing as AllergyEntry[]) : [];
    const merged = current.map((e) => (e.category === category ? { ...e, specifics } : e));
    if (!current.some((e) => e.category === category)) {
      merged.push({ category, specifics });
    }
    setAnswer("allergies", merged);

    const nextIndex = i + 1;
    if (nextIndex < total && queue[nextIndex]) {
      router.push({
        pathname: "/onboarding/allergy-details",
        params: {
          category: queue[nextIndex],
          i: String(nextIndex),
          total: String(total),
          queue: queue.join(","),
        },
      });
      return;
    }
    router.push("/onboarding/tracking-style");
  };

  const onContinue = () => advance(Array.from(picked));
  const onSkip = () => advance(seedSpecifics);

  const customLabel = (value: string) =>
    value.startsWith("custom:") ? value.slice("custom:".length) : value;

  const selectedCount = picked.size;
  const ctaLabel =
    selectedCount === 0
      ? isOther
        ? "Continue"
        : "Skip — none of these"
      : `Continue · ${selectedCount}`;
  const showSkipPill = selectedCount === 0 && !isOther;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={[styles.counterPill, { backgroundColor: colors.bgMuted }]}>
              <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                {`${i + 1} / ${total}`}
              </Text>
            </View>
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={computeProgress(i, total)} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={verticalScale(24)}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.eyebrow, { color: colors.accent }]}>{copy.eyebrow}</Text>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>{copy.headline}</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>{copy.sub}</Text>

              {presets.length > 0 && (
                <View style={styles.grid}>
                  {presets.map((o, idx) => {
                    const Mascot = getAllergySpecificMascot(o.v);
                    const active = picked.has(o.v);
                    return (
                      <Animated.View
                        key={o.v}
                        entering={FadeInDown.delay(60 + idx * 32).duration(360)}
                        style={styles.gridItem}
                      >
                        <Pressable
                          onPress={() => togglePreset(o.v)}
                          style={[
                            styles.card,
                            {
                              backgroundColor: active ? colors.accent + "12" : colors.bgSurface,
                              borderColor: active ? colors.accent : colors.border,
                              borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={o.t}
                        >
                          <View
                            style={[
                              styles.checkPip,
                              {
                                backgroundColor: active ? colors.accent : "transparent",
                                borderColor: active ? colors.accent : colors.border,
                              },
                            ]}
                          >
                            {active && (
                              <Check size={moderateScale(9)} color="#FFFFFF" strokeWidth={3.4} />
                            )}
                          </View>
                          <View style={styles.mascotSlot}>
                            <Mascot size={moderateScale(40)} />
                          </View>
                          <Text
                            style={[
                              styles.cardLabel,
                              {
                                color: active ? colors.accent : colors.textPrimary,
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {o.t}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}

              {customs.length > 0 && (
                <View style={styles.customStack}>
                  {customs.map((value, idx) => (
                    <Animated.View
                      key={value}
                      entering={FadeInDown.delay(80 + idx * 40).duration(320)}
                    >
                      <Pressable
                        onPress={() => removeCustom(value)}
                        style={[
                          styles.customChip,
                          {
                            backgroundColor: colors.accent + "12",
                            borderColor: colors.accent,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${customLabel(value)}`}
                      >
                        <CustomMascot size={moderateScale(28)} />
                        <Text
                          style={[styles.customChipText, { color: colors.accent }]}
                          numberOfLines={1}
                        >
                          {customLabel(value)}
                        </Text>
                        <View style={[styles.customRemove, { backgroundColor: colors.accent }]}>
                          <X size={moderateScale(11)} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}

              <View
                style={[
                  styles.addRow,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={isOther ? "e.g. bee stings" : "Add your own…"}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.addInput, { color: colors.textPrimary }]}
                  returnKeyType="done"
                  onSubmitEditing={addCustom}
                  autoCorrect
                  autoCapitalize="sentences"
                />
                <Pressable
                  onPress={addCustom}
                  disabled={!draft.trim()}
                  style={[
                    styles.addBtn,
                    {
                      backgroundColor: draft.trim() ? colors.accent : colors.bgMuted,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom entry"
                >
                  <Plus
                    size={moderateScale(16)}
                    color={draft.trim() ? "#FFFFFF" : colors.textTertiary}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>

              <View style={{ height: spacing.s4 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.cta}>
            <PrimaryButton label={ctaLabel} onPress={onContinue} />
            {showSkipPill && (
              <Pressable onPress={onSkip} style={styles.skipBtn} accessibilityRole="button">
                <Text style={[styles.skipText, { color: colors.textTertiary }]}>Not sure</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenAllergyDetails;

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
  counterPill: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  counterText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.1,
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
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.5,
    marginTop: 4,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(8),
    marginTop: theme.spacing.s5,
  },
  gridItem: {
    width: "48.5%",
  },
  card: {
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(14),
    alignItems: "center",
    minHeight: moderateScale(92),
    justifyContent: "center",
  },
  checkPip: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    borderWidth: 1.4,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotSlot: {
    marginBottom: moderateScale(4),
  },
  cardLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: -0.1,
    textAlign: "center",
    lineHeight: fontScale(15),
  },
  customStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: theme.spacing.s4,
  },
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: moderateScale(6),
    paddingRight: moderateScale(6),
    paddingVertical: moderateScale(4),
    borderRadius: theme.radius.full,
    borderWidth: 1.2,
  },
  customChipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
    maxWidth: scale(160),
  },
  customRemove: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: theme.spacing.s5,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  addInput: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
    paddingVertical: verticalScale(8),
  },
  addBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
    gap: moderateScale(8),
  },
  skipBtn: {
    alignSelf: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
  },
  skipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
  },
}));
