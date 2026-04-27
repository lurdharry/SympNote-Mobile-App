import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { usePendingRecordingStore } from "@/stores/usePendingRecordingStore";
import { hapticLight } from "@/services/haptics";
import { QUESTIONS } from "@/constants/onboarding";

const QUESTION = QUESTIONS.find((q) => q.id === "sex")!;

/**
 * Sex qualifier — single-select with auto-advance. Skippable: "Skip"
 * pill at the bottom advances without persisting an answer; the
 * downstream coercion falls back to 'prefer-not'.
 */
const ScreenSex: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = usePendingRecordingStore((s) => s.setAnswer);

  const [picked, setPicked] = useState<string | null>(null);
  // Guards double-tap during auto-advance — *not* "is anything
  // picked", since the user can navigate back here and should be
  // allowed to change their answer.
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    },
    [],
  );

  const advance = () => router.push("/onboarding/conditions");

  const onSelect = (v: string) => {
    if (navTimerRef.current) return;
    hapticLight();
    setPicked(v);
    setAnswer(QUESTION.profileKey, v);
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      advance();
    }, 280);
  };

  const onSkip = () => {
    if (navTimerRef.current) return;
    hapticLight();
    advance();
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Pressable onPress={onSkip} hitSlop={12}>
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>
                Skip
              </Text>
            </Pressable>
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.4} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Sex on your{"\n"}medical records?
            </Text>

            <View style={styles.list}>
              {(QUESTION.options ?? []).map((o, i) => {
                const active = picked === o.v;
                const Icon = o.Icon;
                const tint = o.tint ?? colors.accent;
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

export default ScreenSex;

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
  skipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.1,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
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
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
  },
  iconTile: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
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
