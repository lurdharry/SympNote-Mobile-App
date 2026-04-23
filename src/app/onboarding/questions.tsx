import React, { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  makeStyles,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import {
  AssistantBubble,
  ChipTray,
  TypingBubble,
  UserBubble,
} from "@/components/onboarding/qualifier";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useQualifierFlow, type QualifierAnswer } from "@/hooks/useQualifierFlow";

const labelFor = (answer: QualifierAnswer): string => {
  if (!Array.isArray(answer)) return answer.t;
  if (answer.length === 0) return 'Skipped';
  return answer.map((o) => o.t).join(', ');
};

const ScreenQualifier: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const { step, current, answers, typing, questions, answer, skip, back } = useQualifierFlow(
    () => router.push("/onboarding/focus"),
  );

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [step, typing]);

  const onBack = () => {
    if (step === 0) router.back();
    else back();
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={onBack} />
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.25} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.feed}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {questions.slice(0, step).map((q) => (
              <React.Fragment key={`${q.id}-turn`}>
                <AssistantBubble>{q.ask}</AssistantBubble>
                {answers[q.id] && <UserBubble>{labelFor(answers[q.id]!)}</UserBubble>}
              </React.Fragment>
            ))}

            {typing ? (
              <TypingBubble />
            ) : (
              <>
                <AssistantBubble>{current.ask}</AssistantBubble>
                {current.hint && (
                  <Text style={[typography.caption, styles.hint, { color: colors.textTertiary }]}>
                    {current.hint}
                  </Text>
                )}
              </>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          <View
            style={[
              styles.tray,
              { borderTopColor: colors.border, backgroundColor: colors.bgPrimary },
            ]}
          >
            <ChipTray
              disabled={typing}
              options={current.options ?? []}
              multi={current.multi}
              onAnswer={answer}
              onSkip={current.skippable ? skip : undefined}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenQualifier;

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
  feed: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s4,
    gap: spacing.s3,
  },
  hint: {
    paddingHorizontal: theme.spacing.s4,
    paddingTop: 4,
  },
  tray: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: verticalScale(10),
    paddingBottom: theme.spacing.s4,
    borderTopWidth: 1,
  },
}));
