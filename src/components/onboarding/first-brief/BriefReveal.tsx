import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { CheckCircle2, Sparkles } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { RedFlagAlert } from "@/components/clinical/RedFlagAlert";
import { StructuredHeaderCard } from "@/components/clinical/StructuredHeaderCard";
import type { BriefContent, StructuredEntry } from "@/stores/types";

interface BriefRevealProps {
  content: BriefContent;
  structured: StructuredEntry | null;
  reduced: boolean;
}

/**
 * Sequenced multi-card payoff for the first-brief screen. Order:
 * structured header (the AI's parsed reading of the user's own words)
 * → red-flag alert (when present) → ASK YOUR DOCTOR (questions) →
 * PATTERNS (when present) → insights count-up pill.
 *
 * The structured header replaces the older "TOP CONCERN" card. From
 * a single recording the brief's topConcerns/patterns are partly
 * forced; the structured fields (severity, body system, symptoms,
 * urgency) come straight from what the user just said and read as
 * "AI is reading my words" — the harder visceral hit that earns the
 * paywall ask.
 */
export const BriefReveal: React.FC<BriefRevealProps> = ({ content, structured, reduced }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const questions = content.questions.slice(0, 3);
  const patterns = content.patterns.slice(0, 2);
  const totalInsights =
    content.topConcerns.length +
    content.questions.length +
    content.patterns.length +
    content.flags.length;

  const d = (n: number) => (reduced ? 0 : n);

  // Count-up on the insights total — pill fades in at ~640ms, then
  // the number ticks from 0 to total over 700ms. Single animated
  // number lands harder than four micro-counters.
  const [countProgress, setCountProgress] = useState(reduced ? 1 : 0);
  const countUpRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (reduced) {
      setCountProgress(1);
      return;
    }
    setCountProgress(0);
    const startDelay = setTimeout(() => {
      const start = Date.now();
      const dur = 700;
      const id = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / dur);
        setCountProgress(p);
        if (p >= 1) clearInterval(id);
      }, 33);
      countUpRef.current = id;
    }, 1100);
    return () => {
      clearTimeout(startDelay);
      if (countUpRef.current) clearInterval(countUpRef.current);
    };
  }, [totalInsights, reduced]);
  const animatedCount = Math.round(countProgress * totalInsights);

  const hasStructured =
    !!structured &&
    (structured.severity > 0 ||
      structured.bodySystem.length > 0 ||
      structured.symptoms.length > 0);

  return (
    <View style={styles.stack}>
      {hasStructured && structured ? (
        <Animated.View
          entering={FadeInDown.delay(d(60)).duration(420).easing(Easing.out(Easing.cubic))}
        >
          <StructuredHeaderCard structured={structured} />
        </Animated.View>
      ) : content.summary ? (
        <Animated.View
          entering={FadeInDown.delay(d(60)).duration(420).easing(Easing.out(Easing.cubic))}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
            shadows.card,
          ]}
        >
          <LinearGradient
            colors={[colors.accent + "14", colors.accent + "00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.wash}
            pointerEvents="none"
          />
          <Text style={[styles.eyebrow, { color: colors.accent }]}>SUMMARY</Text>
          <Text
            style={[styles.body, { color: colors.textPrimary, marginTop: 6 }]}
            numberOfLines={5}
          >
            {content.summary}
          </Text>
        </Animated.View>
      ) : null}

      {structured && structured.redFlags.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(d(180)).duration(420).easing(Easing.out(Easing.cubic))}
        >
          <RedFlagAlert items={structured.redFlags} />
        </Animated.View>
      ) : null}

      {questions.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(d(280)).duration(420).easing(Easing.out(Easing.cubic))}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
            shadows.card,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>ASK YOUR DOCTOR</Text>
          <View style={styles.list}>
            {questions.map((q, i) => (
              <View key={`q-${i}`} style={styles.row}>
                <CheckCircle2 size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
                <Text style={[styles.rowText, { color: colors.textPrimary }]} numberOfLines={3}>
                  {q}
                </Text>
              </View>
            ))}
          </View>
          {content.questions.length > questions.length ? (
            <Text style={[styles.more, { color: colors.textTertiary }]}>
              +{content.questions.length - questions.length} more inside
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      {patterns.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(d(480)).duration(420).easing(Easing.out(Easing.cubic))}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
            shadows.card,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>PATTERNS WE NOTICED</Text>
          <View style={styles.list}>
            {patterns.map((p, i) => (
              <View key={`p-${i}`} style={styles.row}>
                <View style={[styles.patternDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.rowText, { color: colors.textPrimary }]} numberOfLines={3}>
                  {p}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(d(640)).duration(420).easing(Easing.out(Easing.cubic))}
        style={[styles.pill, { backgroundColor: colors.accent + "10" }]}
      >
        <Sparkles size={moderateScale(12)} color={colors.accent} strokeWidth={2.2} />
        <Text style={[styles.pillText, { color: colors.accent }]}>
          {animatedCount} insights inside
        </Text>
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  stack: {
    marginTop: theme.spacing.s5,
    gap: moderateScale(10),
  },
  card: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(60),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  body: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: 6,
  },
  list: {
    marginTop: moderateScale(8),
    gap: moderateScale(8),
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(8),
  },
  rowText: {
    flex: 1,
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
    marginTop: 1,
  },
  more: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    fontStyle: "italic",
    marginTop: moderateScale(8),
  },
  patternDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginTop: moderateScale(7),
  },
  pill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: theme.radius.full,
    marginTop: moderateScale(4),
  },
  pillText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.3,
  },
}));
