import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  useTheme,
  verticalScale,
} from "../../theme";
import { Button } from "../ui/Button";

interface ReviewPhaseProps {
  text: string;
  onChange: (v: string) => void;
  onProcess: () => void;
  onDiscard: () => void;
  error?: string | null;
  retryInSec?: number;
  /** Tiny masthead line — date stamped left of the rule. */
  mastheadDate: string;
  /** Tiny masthead line — entry number stamped right of the rule. */
  mastheadIssue: string;
  /** Editorial headline rendered ON the page in Fraunces italic. */
  headline: string;
  /** Optional subhead below the headline rule. */
  subhead?: string;
}

/**
 * "The Folio" — an editorial-magazine composition surface for the
 * type-only /record flow.
 *
 *   • Tiny masthead bar at the top of the screen carries the date
 *     and a running entry number ("No. 042"), so each note feels
 *     like a chapter in the user's ongoing record.
 *
 *   • The paper page is the hero. Binder spine + rivets on the left
 *     edge keep visual kinship with the brand mascot family. The
 *     headline lives ON the page in oversized Fraunces italic, with
 *     a hairline rule beneath that anchors the writing surface.
 *
 *   • A massive serif "S" watermark sits faint behind the input as
 *     a quiet brand stamp.
 *
 *   • Word count is rendered as marginalia — small Fraunces italic
 *     in the bottom-right of the page — instead of an icon pill.
 *
 *   • The CTA sits below the page; "Start over" only appears once
 *     the user has typed something so the surface stays calm at
 *     start.
 */
export const ReviewPhase: React.FC<ReviewPhaseProps> = ({
  text,
  onChange,
  onProcess,
  onDiscard,
  error,
  retryInSec = 0,
  mastheadDate,
  mastheadIssue,
  headline,
  subhead,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const blocked = retryInSec > 0;
  const continueLabel = blocked ? `Try again in ${retryInSec}s` : "Make it doctor-ready";

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  return (
    <View style={styles.root}>
      {/* ── Masthead: tiny date stamp + entry number ────────────── */}
      <View style={styles.masthead}>
        <Text style={[styles.mastheadText, { color: colors.textTertiary }]}>{mastheadDate}</Text>
        <View style={[styles.mastheadRule, { backgroundColor: colors.border }]} />
        <Text style={[styles.mastheadText, { color: colors.textTertiary }]}>{mastheadIssue}</Text>
      </View>

      {/* ── The page ────────────────────────────────────────────── */}
      <View
        style={[
          styles.paper,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        <LinearGradient
          colors={[colors.accent + "0E", colors.accent + "00"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.paperWash}
          pointerEvents="none"
        />

        {/* Binder spine — 3 teal rivets stitched to the left edge. */}
        <View pointerEvents="none" style={styles.spine}>
          <Svg width="100%" height="100%" viewBox="0 0 12 100" preserveAspectRatio="none">
            <Circle cx={6} cy={20} r={2.4} fill="#2C6E6B" opacity={0.7} />
            <Circle cx={6} cy={50} r={2.4} fill="#2C6E6B" opacity={0.7} />
            <Circle cx={6} cy={80} r={2.4} fill="#2C6E6B" opacity={0.7} />
          </Svg>
        </View>

        {/* Massive watermark monogram — quiet brand stamp behind text. */}
        <Text
          pointerEvents="none"
          style={[styles.watermark, { color: colors.accent }]}
          accessibilityElementsHidden
        >
          S
        </Text>

        {/* Editorial headline lives ON the page. */}
        <Text style={[styles.headline, { color: colors.textPrimary }]}>{headline}</Text>
        <View style={[styles.headRule, { backgroundColor: colors.border }]} />
        {subhead && (
          <Text style={[styles.subhead, { color: colors.textSecondary }]}>{subhead}</Text>
        )}

        <TextInput
          value={text}
          onChangeText={onChange}
          multiline
          textAlignVertical="top"
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Begin where it matters most…"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          accessibilityLabel="Note text"
        />

        {/* Marginalia word count, bottom-right — quiet, serif, italic. */}
        {wordCount > 0 && (
          <Text style={[styles.marginalia, { color: colors.textTertiary }]}>
            {numberToWord(wordCount)}{" "}
            <Text style={styles.marginaliaCount}>{wordCount}</Text>{" "}
            {wordCount === 1 ? "word" : "words"}
          </Text>
        )}
      </View>

      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.bgMuted, borderColor: colors.error }]}>
          <Text style={[styles.errorLabel, { color: colors.error }]}>Couldn't process that</Text>
          <Text style={[styles.errorBody, { color: colors.textPrimary }]}>{error}</Text>
        </View>
      )}

      <View style={styles.ctaArea}>
        <Button
          label={continueLabel}
          onPress={onProcess}
          haptic="medium"
          disabled={blocked || wordCount === 0}
        />
        {text.trim().length > 0 && (
          <View style={{ marginTop: spacing.s2 }}>
            <Button label="Start over" variant="secondary" haptic="light" onPress={onDiscard} />
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Tiny editorial flourish — render the spelled-out word for small
 * counts, fall through to the numeric for large ones. Magazines
 * often write out one through nine and digit the rest.
 */
function numberToWord(n: number): string {
  switch (n) {
    case 1:
      return "one";
    case 2:
      return "two";
    case 3:
      return "three";
    case 4:
      return "four";
    case 5:
      return "five";
    case 6:
      return "six";
    case 7:
      return "seven";
    case 8:
      return "eight";
    case 9:
      return "nine";
    default:
      return "";
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    paddingTop: spacing.s2,
  },
  // ── Masthead ───────────────────────────────────────────────────
  masthead: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingBottom: spacing.s4,
  },
  mastheadText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.6,
  },
  mastheadRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  // ── The paper page ─────────────────────────────────────────────
  paper: {
    flex: 1,
    paddingLeft: moderateScale(28),
    paddingRight: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(34),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    minHeight: verticalScale(280),
  },
  paperWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(110),
  },
  spine: {
    position: "absolute",
    top: moderateScale(10),
    bottom: moderateScale(10),
    left: 0,
    width: moderateScale(14),
  },
  watermark: {
    position: "absolute",
    right: -moderateScale(14),
    bottom: -moderateScale(50),
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: moderateScale(220),
    lineHeight: moderateScale(220),
    opacity: 0.07,
    letterSpacing: -8,
  },
  headline: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(34),
    lineHeight: fontScale(40),
    letterSpacing: -0.6,
  },
  headRule: {
    height: StyleSheet.hairlineWidth,
    marginTop: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  subhead: {
    fontFamily: "DMSans_400Regular",
    fontStyle: "italic",
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginBottom: moderateScale(6),
  },
  input: {
    flex: 1,
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(17),
    lineHeight: fontScale(26),
    letterSpacing: -0.05,
    padding: 0,
    margin: 0,
    marginTop: moderateScale(6),
    minHeight: verticalScale(140),
  },
  marginalia: {
    position: "absolute",
    right: moderateScale(20),
    bottom: moderateScale(12),
    fontFamily: "Fraunces_400Regular",
    fontStyle: "italic",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
  },
  marginaliaCount: {
    fontFamily: "Fraunces_500Medium",
  },
  // ── Error + CTA ────────────────────────────────────────────────
  errorBox: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
  },
  errorLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.0,
  },
  errorBody: {
    ...theme.typography.body,
    marginTop: 4,
  },
  ctaArea: {
    paddingTop: spacing.s4,
  },
}));
