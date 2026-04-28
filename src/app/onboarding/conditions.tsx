import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { ConditionCard } from "@/components/onboarding/conditions/ConditionCard";
import { CustomChipStack } from "@/components/onboarding/conditions/CustomChipStack";
import { AddCustomRow } from "@/components/onboarding/conditions/AddCustomRow";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { QUESTIONS } from "@/constants/onboarding";

const QUESTION = QUESTIONS.find((q) => q.id === "conditions")!;

/**
 * Conditions qualifier — multi-select with optional free-text. Last
 * screen of the qualifier sequence; routes on to summary (record).
 *
 * Continue label adapts: with 0 selected it reads "None apply" so
 * users don't feel they have to pick something to advance. Free-text
 * "Add your own" appends `custom:`-prefixed entries.
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

  const count = picked.size;
  const ctaLabel = count === 0 ? "None apply" : `These apply · ${count}`;

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
                {(QUESTION.options ?? []).map((o, i) => (
                  <ConditionCard
                    key={o.v}
                    label={o.t}
                    Icon={o.Icon}
                    tint={o.tint}
                    active={picked.has(o.v)}
                    index={i}
                    onPress={() => toggle(o.v)}
                  />
                ))}
              </View>

              <CustomChipStack values={customs} onRemove={removeCustom} />
              <AddCustomRow value={draft} onChange={setDraft} onSubmit={addCustom} />

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
  cta: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
}));
