import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { QUESTIONS } from "@/constants/onboarding";

const QUESTION = QUESTIONS.find((q) => q.id === "conditions")!;

/**
 * Conditions qualifier — multi-select with optional free-text. Last
 * screen of the qualifier sequence; routes on to summary (record).
 *
 * Continue label adapts: with 0 selected it reads "Skip — none of
 * these" so users don't feel they have to pick something to advance.
 * Free-text "Add your own" appends `custom:`-prefixed entries.
 */
const ScreenConditions: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = usePendingRecordingStore((s) => s.setAnswer);

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [customs, setCustoms] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const toggle = (v: string) => {
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

  const onContinue = () => {
    setAnswer(QUESTION.profileKey, Array.from(picked));
    router.push("/onboarding/summary");
  };

  const customLabel = (value: string) =>
    value.startsWith("custom:") ? value.slice("custom:".length) : value;

  const count = picked.size;
  const ctaLabel = count === 0 ? "None apply" : `That's me · ${count}`;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={{ width: moderateScale(40) }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.55} />
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
              <Text style={[styles.headline, { color: colors.textPrimary }]}>
                Anything we should{"\n"}know about?
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Pick any that apply. Skip if none.
              </Text>

              <View style={styles.list}>
                {(QUESTION.options ?? []).map((o, i) => {
                  const active = picked.has(o.v);
                  const Icon = o.Icon;
                  const tint = o.tint ?? colors.accent;
                  return (
                    <Animated.View
                      key={o.v}
                      entering={FadeInDown.delay(40 + i * 28).duration(320)}
                    >
                      <Pressable
                        onPress={() => toggle(o.v)}
                        style={[
                          styles.card,
                          {
                            backgroundColor: active
                              ? colors.accent + "12"
                              : colors.bgSurface,
                            borderColor: active ? colors.accent : colors.border,
                            borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={o.t}
                      >
                        {Icon ? (
                          <View
                            style={[
                              styles.iconTile,
                              { backgroundColor: tint + "1F" },
                            ]}
                          >
                            <Icon
                              size={moderateScale(16)}
                              color={tint}
                              strokeWidth={2.2}
                            />
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.cardLabel,
                            {
                              color: active ? colors.accent : colors.textPrimary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {o.t}
                        </Text>
                        <View
                          style={[
                            styles.checkPip,
                            {
                              backgroundColor: active
                                ? colors.accent
                                : "transparent",
                              borderColor: active
                                ? colors.accent
                                : colors.border,
                            },
                          ]}
                        >
                          {active ? (
                            <Check
                              size={moderateScale(11)}
                              color="#FFFFFF"
                              strokeWidth={3}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              {customs.length > 0 ? (
                <View style={styles.customStack}>
                  {customs.map((value) => (
                    <Pressable
                      key={value}
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
                      <Text
                        style={[styles.customChipText, { color: colors.accent }]}
                        numberOfLines={1}
                      >
                        {customLabel(value)}
                      </Text>
                      <View
                        style={[
                          styles.customRemove,
                          { backgroundColor: colors.accent },
                        ]}
                      >
                        <X
                          size={moderateScale(11)}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

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
                  placeholder="Add your own…"
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
                      backgroundColor: draft.trim()
                        ? colors.accent
                        : colors.bgMuted,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add"
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
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenConditions;

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
    paddingTop: theme.spacing.s6,
    paddingBottom: theme.spacing.s5,
  },
  headline: {
    ...typography.h1,
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
    letterSpacing: -0.5,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  list: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(8),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  iconTile: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: -0.1,
  },
  checkPip: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
    paddingLeft: scale(12),
    paddingRight: moderateScale(6),
    paddingVertical: moderateScale(6),
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
  },
}));
