import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInRight,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles as SparkleIcon } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { ChipTray } from "@/components/onboarding/qualifier";
import { SympnoteSprite } from "@/components/onboarding/SympnoteSprite";
import { useQualifierFlow, type QualifierAnswer } from "@/hooks/useQualifierFlow";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const labelFor = (answer: QualifierAnswer): string => {
  if (!Array.isArray(answer)) return answer.t;
  if (answer.length === 0) return "Skipped";
  return answer.map((o) => o.t).join(", ");
};

const ScreenQualifier: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const { step, current, answers, typing, questions, answer, skip, back } =
    useQualifierFlow(() => router.push("/onboarding/focus"));

  const onBack = () => {
    if (step === 0) router.back();
    else back();
  };

  const totalSteps = questions.length;
  const answeredTags: { id: string; label: string }[] = questions
    .slice(0, step)
    .map((q) => ({ id: q.id, label: answers[q.id] ? labelFor(answers[q.id]!) : "—" }))
    .filter((t) => t.label !== "—");

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        {/* Stage aurora — gold at top, teal at bottom, sets the "game" vibe. */}
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[
              colors.gold + "2A",
              colors.accent + "22",
              colors.accent + "00",
            ]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={styles.safe}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <View style={styles.topBar}>
              <BackButton onPress={onBack} />
              <XPBar current={step} total={totalSteps} />
            </View>

            {/* Mascot on a spotlit stage. */}
            <View style={styles.stage}>
              <StageSpotlight reduced={reduced} />
              <SympnoteSprite
                pose="greeting"
                reduced={reduced}
                size={moderateScale(144)}
              />
            </View>

            {/* Parchment speech bubble with typewriter animation. */}
            <View style={styles.bubbleWrap}>
              <SpeechBubble text={current.ask} typing={typing} reduced={reduced} />
              {current.hint && !typing && (
                <Text
                  style={[typography.caption, styles.hint, { color: colors.textTertiary }]}
                >
                  {current.hint}
                </Text>
              )}
            </View>

            {/* Inventory ribbon — tags earned so far. Each slides in
                from the right the moment it's committed. */}
            {answeredTags.length > 0 && (
              <View style={styles.inventoryWrap}>
                <Text style={[styles.inventoryLabel, { color: colors.textTertiary }]}>
                  COLLECTED
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.inventoryRow}
                >
                  {answeredTags.map((t, i) => (
                    <Animated.View
                      key={t.id}
                      entering={reduced ? undefined : FadeInRight.duration(320).delay(i * 60)}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: colors.accent + "55",
                        },
                      ]}
                    >
                      <SparkleIcon
                        size={moderateScale(10)}
                        color={colors.gold}
                        strokeWidth={2.4}
                      />
                      <Text
                        style={[styles.tagText, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {t.label}
                      </Text>
                    </Animated.View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ flex: 1 }} />

            {/* Action bar — chip choices. */}
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
                allowCustom={current.allowCustom}
                onAnswer={answer}
                onSkip={current.skippable ? skip : undefined}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenQualifier;

// ── XP bar ──────────────────────────────────────────────────────────

interface XPBarProps {
  current: number;
  total: number;
}

const XPBar: React.FC<XPBarProps> = ({ current, total }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(total > 0 ? current / total : 0, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [current, total, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.xpWrap}>
      <Text style={[styles.xpLabel, { color: colors.textTertiary }]}>
        PROFILE · {Math.min(current, total)} / {total}
      </Text>
      <View style={[styles.xpTrack, { backgroundColor: colors.bgMuted }]}>
        <Animated.View style={[styles.xpFill, fillStyle]}>
          <LinearGradient
            colors={[colors.gold, "#E07A5F"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// ── Stage spotlight — pulsing ring behind the mascot ──────────────

interface StageSpotlightProps {
  reduced: boolean;
}

const StageSpotlight: React.FC<StageSpotlightProps> = ({ reduced }) => {
  const styles = useStyles();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced, pulse]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
    transform: [{ scale: 0.9 + pulse.value * 0.12 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.spotlight, style]} />;
};

// ── Parchment speech bubble with typewriter ───────────────────────

interface SpeechBubbleProps {
  text: string;
  typing: boolean;
  reduced: boolean;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, typing, reduced }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [typed, setTyped] = useState(reduced ? text : "");
  const [showDots, setShowDots] = useState(typing);

  useEffect(() => {
    if (typing) {
      setShowDots(true);
      setTyped("");
      return;
    }
    setShowDots(false);
    if (reduced) {
      setTyped(text);
      return;
    }
    let i = 0;
    setTyped("");
    const id = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text, typing, reduced]);

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(320)}
      style={[
        styles.bubble,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "33" },
      ]}
    >
      {/* Small tail pointing toward the mascot above. */}
      <View
        style={[
          styles.bubbleTail,
          {
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: colors.bgSurface,
          },
        ]}
      />
      {showDots ? (
        <TypingDotsInline color={colors.textTertiary} />
      ) : (
        <Text style={[styles.bubbleText, { color: colors.textPrimary }]}>
          {typed}
          {!reduced && typed.length < text.length && (
            <Text style={{ color: colors.accent }}>▍</Text>
          )}
        </Text>
      )}
    </Animated.View>
  );
};

const TypingDotsInline: React.FC<{ color: string }> = ({ color }) => {
  const styles = useStyles();
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);
  useEffect(() => {
    const loop = (sv: SharedValue<number>, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 380, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      setTimeout(() => {}, delay);
    };
    loop(d1, 0);
    loop(d2, 150);
    loop(d3, 300);
  }, [d1, d2, d3]);
  const s = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: 0.35 + sv.value * 0.6,
      transform: [{ translateY: -sv.value * 3 }],
    }));
  const s1 = s(d1);
  const s2 = s(d2);
  const s3 = s(d3);
  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s3]} />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(380),
  },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  // ── XP bar
  xpWrap: {
    flex: 1,
  },
  xpLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(9),
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  xpTrack: {
    height: moderateScale(6),
    borderRadius: 999,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  // ── Stage
  stage: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.s2,
    height: moderateScale(170),
  },
  spotlight: {
    position: "absolute",
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: "rgba(246,192,106,0.18)",
  },
  // ── Speech bubble
  bubbleWrap: {
    paddingHorizontal: theme.spacing.s5,
    marginTop: theme.spacing.s3,
    alignItems: "center",
  },
  bubble: {
    position: "relative",
    maxWidth: "100%",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bubbleTail: {
    position: "absolute",
    top: -moderateScale(8),
    left: "50%",
    marginLeft: -moderateScale(8),
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(8),
    borderRightWidth: moderateScale(8),
    borderBottomWidth: moderateScale(8),
  },
  bubbleText: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    letterSpacing: -0.2,
    textAlign: "center",
  },
  hint: {
    marginTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    paddingVertical: verticalScale(6),
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  // ── Inventory
  inventoryWrap: {
    marginTop: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s5,
    gap: moderateScale(6),
  },
  inventoryLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(9),
    letterSpacing: 1.4,
  },
  inventoryRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    paddingRight: theme.spacing.s4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
    maxWidth: moderateScale(120),
  },
  // ── Tray
  tray: {
    paddingHorizontal: theme.spacing.s5,
    paddingTop: verticalScale(10),
    paddingBottom: theme.spacing.s4,
    borderTopWidth: 1,
  },
}));
