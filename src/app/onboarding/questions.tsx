import React, { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { makeStyles, spacing, typography, useTheme, verticalScale } from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { BackButton } from "../../components/ui/BackButton";
import {
  AssistantBubble,
  ChipTray,
  DateTray,
  PlanCard,
  ProgressBar,
  TypingBubble,
  UserBubble,
} from "../../components/onboarding/qualifier";
import { useQualifierFlow } from "../../hooks/useQualifierFlow";

const ScreenQualifier: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const { step, current, answers, planItems, typing, questions, answer, back } = useQualifierFlow(
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
            <ProgressBar step={step} total={questions.length} />
            <Text style={[typography.label, styles.counter, { color: colors.textTertiary }]}>
              {Math.min(step + 1, questions.length)}/{questions.length}
            </Text>
          </View>

          <View style={styles.planSlot}>
            <PlanCard items={planItems} total={questions.length} />
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
                {answers[q.id] && <UserBubble>{answers[q.id]!.t}</UserBubble>}
              </React.Fragment>
            ))}

            {typing ? <TypingBubble /> : <AssistantBubble>{current.ask}</AssistantBubble>}

            <View style={{ height: 8 }} />
          </ScrollView>

          <View
            style={[
              styles.tray,
              { borderTopColor: colors.border, backgroundColor: colors.bgPrimary },
            ]}
          >
            {current.kind === "date" ? (
              <DateTray disabled={typing} onAnswer={answer} />
            ) : (
              <ChipTray disabled={typing} options={current.options ?? []} onAnswer={answer} />
            )}
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

export default ScreenQualifier;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s3,
  },
  counter: { fontVariant: ["tabular-nums"] },
  planSlot: {
    paddingHorizontal: theme.spacing.s5,
    marginTop: theme.spacing.s3,
  },
  feed: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s4,
    gap: spacing.s3,
  },
  tray: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: verticalScale(10),
    paddingBottom: theme.spacing.s4,
    borderTopWidth: 1,
  },
}));
