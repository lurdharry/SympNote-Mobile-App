import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { QUESTIONS } from "@/constants/onboarding";
import { AGE_MASCOTS } from "@/components/onboarding/AgeMascots";
import type { AgeBand } from "@/stores/types";

const QUESTION = QUESTIONS.find((q) => q.id === "age")!;

/**
 * Age qualifier — single screen, single-select, auto-advance. Same
 * pattern as prep-gap. Replaces the chat-style multi-question screen
 * (one direct screen feels faster than three chat exchanges, even
 * though there are more taps in absolute terms).
 */
const ScreenAge: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = usePendingRecordingStore((s) => s.setAnswer);

  const [picked, setPicked] = useState<string | null>(null);
  // Guards against double-tapping during the auto-advance window.
  // Crucially this is *not* `picked`: a user who navigates back to
  // this screen after a previous selection still has `picked` set,
  // and we want them to be able to change their answer.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    },
    [],
  );

  const onSelect = (v: string) => {
    if (navTimerRef.current) return;
    hapticLight();
    setPicked(v);
    setAnswer(QUESTION.profileKey, v);
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      router.push("/onboarding/sex");
    }, 280);
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
            <OnboardingProgress value={0.25} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              How old are you?
            </Text>

            <View style={styles.list}>
              {(QUESTION.options ?? []).map((o, i) => {
                const active = picked === o.v;
                const Mascot = AGE_MASCOTS[o.v as AgeBand];
                return (
                  <Animated.View
                    key={o.v}
                    entering={FadeInDown.delay(60 + i * 50).duration(340)}
                  >
                    <Pressable
                      onPress={() => onSelect(o.v)}
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
                      {Mascot ? (
                        <View style={styles.mascotSlot}>
                          <Mascot size={moderateScale(40)} />
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
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            <View style={{ height: spacing.s4 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenAge;

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
  list: {
    marginTop: theme.spacing.s6,
    gap: moderateScale(10),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: theme.radius.lg,
  },
  mascotSlot: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
