import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { format, isSameDay, parseISO } from "date-fns";
import { sortBy } from "lodash";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { SympnoteSprite } from "@/components/onboarding/SympnoteSprite";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { hapticLight } from "@/services/haptics";
import { timeGreeting } from "@/utils/date";

const TRANSCRIPT_QUOTE_LEN = 110;
const DAY_MS = 86_400_000;

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

/** Spell out small numbers, fall through to digits for editorial flow. */
const numberWord = (n: number): string =>
  n >= 0 && n <= 12 ? NUMBER_WORDS[n]! : n.toString();

/**
 * Always-on editorial masthead at the top of the home tab. Reads as
 * the cover of a daily journal: tiny SYMPNOTE / Issue / date strap
 * across the top, an oversized Fraunces italic greeting, the user's
 * progress woven into a single sentence (numbers as the editorial
 * weight — not stat chips), and the latest note as an inline pull
 * quote with a date attribution.
 *
 * No card borders. The hero is the page, not a widget.
 *
 * Self-contained — reads stores directly, no props.
 */
export const JournalHero: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const recordings = useRecordingsStore((s) => s.recordings);
  const briefsCount = useBriefsStore((s) => s.briefs.length);

  const recordingsCount = recordings.length;

  const latestRecording = useMemo(() => {
    if (recordings.length === 0) return null;
    return sortBy(recordings, (r) => -parseISO(r.createdAt).getTime())[0]!;
  }, [recordings]);

  const earliestRecording = useMemo(() => {
    if (recordings.length === 0) return null;
    return sortBy(recordings, (r) => parseISO(r.createdAt).getTime())[0]!;
  }, [recordings]);

  // Weeks since the very first note. Fresh user reads "1" on
  // their first day; ticks up each calendar week thereafter.
  const weeksJournaling = useMemo(() => {
    if (!earliestRecording) return 0;
    const ms = Date.now() - parseISO(earliestRecording.createdAt).getTime();
    return Math.max(1, Math.ceil(ms / (7 * DAY_MS)));
  }, [earliestRecording]);

  const issueLabel = recordingsCount > 0
    ? `No. ${String(recordingsCount).padStart(3, "0")}`
    : "Premiere Issue";
  const dateLabel = format(new Date(), "MMM d").toUpperCase();
  const greetingLine = timeGreeting();

  const pullQuote = useMemo(() => {
    if (!latestRecording) return null;
    const text = latestRecording.transcript.trim();
    if (!text) return null;
    return text.length > TRANSCRIPT_QUOTE_LEN
      ? text.slice(0, TRANSCRIPT_QUOTE_LEN).trimEnd() + "…"
      : text;
  }, [latestRecording]);

  const pullQuoteAttribution = useMemo(() => {
    if (!latestRecording) return null;
    const created = parseISO(latestRecording.createdAt);
    const now = new Date();
    if (isSameDay(created, now)) return "today";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (isSameDay(created, yesterday)) return "yesterday";
    return format(created, "MMM d").toLowerCase();
  }, [latestRecording]);

  const onTapQuote = () => {
    if (!latestRecording) return;
    hapticLight();
    router.push(`/recording/${latestRecording.id}`);
  };

  const showNarrative = recordingsCount > 0;

  return (
    <View style={styles.wrap}>
      {/* Soft accent aurora wash behind the masthead */}
      <LinearGradient
        pointerEvents="none"
        colors={[colors.accent + "1A", colors.accent + "00"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.aurora}
      />

      {/* ── Masthead strap ──────────────────────────────────────── */}
      <View style={styles.masthead}>
        <Text style={[styles.wordmark, { color: colors.textPrimary }]}>SYMPNOTE</Text>
        <View style={[styles.strapDot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.strapMeta, { color: colors.textTertiary }]}>{issueLabel}</Text>
        <View style={[styles.strapDot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.strapMeta, { color: colors.textTertiary }]}>{dateLabel}</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.spriteSigil}>
          <SympnoteSprite pose="greeting" reduced={reduced} size={moderateScale(40)} />
        </View>
      </View>
      <View style={[styles.rule, { backgroundColor: colors.accent + "55" }]} />

      {/* ── Hero greeting ───────────────────────────────────────── */}
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>
        {greetingLine}
      </Text>

      {/* ── Narrative — stats woven into prose ──────────────────── */}
      {showNarrative ? (
        <Text style={[styles.narrative, { color: colors.textSecondary }]}>
          You've kept{" "}
          <Text style={[styles.statWord, { color: colors.accent }]}>
            {numberWord(recordingsCount)} {recordingsCount === 1 ? "note" : "notes"}
          </Text>
          {briefsCount > 0 ? ", shaped " : " and journaled "}
          {briefsCount > 0 && (
            <>
              <Text style={[styles.statWord, { color: colors.accent }]}>
                {numberWord(briefsCount)} {briefsCount === 1 ? "brief" : "briefs"}
              </Text>
              , and journaled{" "}
            </>
          )}
          <Text style={[styles.statWord, { color: colors.accent }]}>
            {numberWord(weeksJournaling)} {weeksJournaling === 1 ? "week" : "weeks"}
          </Text>{" "}
          in.
        </Text>
      ) : (
        <Text style={[styles.narrative, { color: colors.textSecondary }]}>
          A blank page. Hold the mic below to begin your first entry.
        </Text>
      )}

      {/* ── Pull-quote — borderless inline ──────────────────────── */}
      {pullQuote && pullQuoteAttribution ? (
        <Pressable
          onPress={onTapQuote}
          style={({ pressed }) => [styles.quoteBlock, { opacity: pressed ? 0.65 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Open most recent note"
        >
          <Text
            style={[styles.quoteBody, { color: colors.textPrimary }]}
            numberOfLines={3}
          >
            &ldquo;{pullQuote}&rdquo;
          </Text>
          <View style={styles.quoteAttribution}>
            <View style={[styles.attrLine, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.attrText, { color: colors.textTertiary }]}>
              {pullQuoteAttribution}
            </Text>
            <Text style={[styles.attrArrow, { color: colors.accent }]}>›</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
  aurora: {
    position: "absolute",
    top: -theme.spacing.s8,
    left: -theme.spacing.s8,
    right: -theme.spacing.s8,
    height: verticalScale(220),
  },
  // ── Masthead strap
  masthead: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  wordmark: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 2,
  },
  strapMeta: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  strapDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  spriteSigil: {
    width: moderateScale(44),
    height: moderateScale(44),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: -moderateScale(6),
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.s2,
    opacity: 0.7,
  },
  // ── Hero greeting
  greeting: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(40),
    lineHeight: fontScale(46),
    letterSpacing: -1,
    marginTop: theme.spacing.s5,
  },
  // ── Narrative
  narrative: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(15),
    lineHeight: fontScale(23),
    letterSpacing: -0.05,
    marginTop: theme.spacing.s4,
  },
  statWord: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(16),
    letterSpacing: -0.1,
  },
  // ── Pull-quote
  quoteBlock: {
    marginTop: theme.spacing.s5,
  },
  quoteBody: {
    fontFamily: "Fraunces_400Regular",
    fontStyle: "italic",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    letterSpacing: -0.2,
  },
  quoteAttribution: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: theme.spacing.s2,
  },
  attrLine: {
    width: scale(20),
    height: 1,
    opacity: 0.6,
  },
  attrText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  attrArrow: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(16),
    marginLeft: moderateScale(2),
  },
}));
