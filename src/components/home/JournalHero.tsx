import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { format, isSameDay, parseISO } from "date-fns";
import { sortBy } from "lodash";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  useTheme,
  verticalScale,
} from "@/theme";
import { SympnoteSprite } from "@/components/onboarding/SympnoteSprite";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { hapticLight } from "@/services/haptics";

const TRANSCRIPT_QUOTE_LEN = 100;
const DAY_MS = 86_400_000;

/**
 * The home tab's editorial cover. The hero is the user's own most
 * recent note — their words on the front page — with the Sympnote
 * sprite tucked in the top-right as a brand sigil and a binder spine
 * down the left edge that ties this surface to the /record Folio.
 *
 * Below the card, a thin magazine-credit strip carries the live
 * counts (notes / briefs / weeks) in tiny ALL-CAPS with em-dash
 * separators — present, not loud.
 *
 * Day-zero variant: same card structure, copy reframes the surface as
 * an invitation ("This is where your story begins."), stats strip
 * hidden so a fresh user doesn't see a row of zeroes.
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

  // Weeks since the very first note. Fresh user reads "1" on day one;
  // ticks up each calendar week thereafter.
  const weeksJournaling = useMemo(() => {
    if (!earliestRecording) return 0;
    const ms = Date.now() - parseISO(earliestRecording.createdAt).getTime();
    return Math.max(1, Math.ceil(ms / (7 * DAY_MS)));
  }, [earliestRecording]);

  const pullQuote = useMemo(() => {
    if (!latestRecording) return null;
    const text = latestRecording.transcript.trim();
    if (!text) return null;
    return text.length > TRANSCRIPT_QUOTE_LEN
      ? text.slice(0, TRANSCRIPT_QUOTE_LEN).trimEnd() + "…"
      : text;
  }, [latestRecording]);

  const eyebrowText = useMemo(() => {
    if (!latestRecording) return "YOUR JOURNAL";
    const created = parseISO(latestRecording.createdAt);
    const now = new Date();
    const yesterday = new Date(now.getTime() - DAY_MS);
    const day = isSameDay(created, now)
      ? "TODAY"
      : isSameDay(created, yesterday)
        ? "YESTERDAY"
        : format(created, "MMM d").toUpperCase();
    const time = format(created, "h:mm a").toLowerCase();
    return `${day} · ${time}`;
  }, [latestRecording]);

  const onTapCard = () => {
    if (!latestRecording) return;
    hapticLight();
    router.push(`/recording/${latestRecording.id}`);
  };

  return (
    <View style={styles.wrap}>
      {/* ── Hero card ───────────────────────────────────────────── */}
      <Pressable
        onPress={onTapCard}
        disabled={!latestRecording}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
          { opacity: pressed ? 0.94 : 1 },
        ]}
        accessibilityRole={latestRecording ? "button" : undefined}
        accessibilityLabel={latestRecording ? "Open most recent note" : undefined}
      >
        {/* Soft accent wash — tints from top, fades to clean surface */}
        <LinearGradient
          pointerEvents="none"
          colors={[colors.accent + "1C", colors.accent + "00"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.cardWash}
        />

        {/* Binder rivets on the left edge — ties to the /record Folio */}
        <View pointerEvents="none" style={styles.spine}>
          <Svg width="100%" height="100%" viewBox="0 0 12 100" preserveAspectRatio="none">
            <Circle cx={6} cy={20} r={2.4} fill={colors.accent} opacity={0.55} />
            <Circle cx={6} cy={50} r={2.4} fill={colors.accent} opacity={0.55} />
            <Circle cx={6} cy={80} r={2.4} fill={colors.accent} opacity={0.55} />
          </Svg>
        </View>

        {/* Sprite tucked top-right as a brand sigil */}
        <View style={styles.spriteSlot} pointerEvents="none">
          <SympnoteSprite pose="greeting" reduced={reduced} size={moderateScale(60)} />
        </View>

        {/* Eyebrow — date + time when there's a note, brand line otherwise */}
        <Text style={[styles.eyebrow, { color: colors.accent }]} numberOfLines={1}>
          {eyebrowText}
        </Text>

        {/* Hero copy — the user's own voice, or the welcome invitation */}
        {pullQuote ? (
          <Text style={[styles.quote, { color: colors.textPrimary }]} numberOfLines={4}>
            &ldquo;{pullQuote}&rdquo;
          </Text>
        ) : (
          <Text style={[styles.welcome, { color: colors.textPrimary }]}>
            This is where your{"\n"}story begins.
          </Text>
        )}

        {/* Footer — em-dash byline + arrow when tappable */}
        <View style={styles.cardFoot}>
          <View style={[styles.footRule, { backgroundColor: colors.accent }]} />
          <Text style={[styles.footText, { color: colors.accent }]}>
            {latestRecording ? "Open this note" : "Hold the mic below to begin"}
          </Text>
          {latestRecording && (
            <Text style={[styles.footArrow, { color: colors.accent }]}>›</Text>
          )}
        </View>
      </Pressable>

      {/* ── Magazine credit strip — only when there's data to count ─ */}
      {recordingsCount > 0 && (
        <View style={styles.credits}>
          <Text style={[styles.creditText, { color: colors.textTertiary }]}>
            {recordingsCount} {recordingsCount === 1 ? "NOTE" : "NOTES"}
          </Text>
          <Text style={[styles.creditSep, { color: colors.textTertiary }]}>—</Text>
          <Text style={[styles.creditText, { color: colors.textTertiary }]}>
            {briefsCount} {briefsCount === 1 ? "BRIEF" : "BRIEFS"}
          </Text>
          <Text style={[styles.creditSep, { color: colors.textTertiary }]}>—</Text>
          <Text style={[styles.creditText, { color: colors.textTertiary }]}>
            {weeksJournaling} {weeksJournaling === 1 ? "WEEK" : "WEEKS"}
          </Text>
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
  // ── Card
  card: {
    position: "relative",
    minHeight: verticalScale(210),
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: moderateScale(28),
    paddingRight: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(18),
    overflow: "hidden",
  },
  cardWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  spine: {
    position: "absolute",
    top: moderateScale(12),
    bottom: moderateScale(12),
    left: 0,
    width: moderateScale(14),
  },
  spriteSlot: {
    position: "absolute",
    top: moderateScale(10),
    right: moderateScale(10),
    width: moderateScale(64),
    height: moderateScale(64),
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Type
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.6,
    paddingRight: moderateScale(70), // leave room for sprite
  },
  quote: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(26),
    lineHeight: fontScale(34),
    letterSpacing: -0.5,
    marginTop: theme.spacing.s2,
    paddingRight: moderateScale(8),
  },
  welcome: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(28),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    marginTop: theme.spacing.s2,
    paddingRight: moderateScale(70),
  },
  // ── Card footer
  cardFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: theme.spacing.s4,
  },
  footRule: {
    width: scale(22),
    height: 1.4,
    opacity: 0.7,
  },
  footText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
  },
  footArrow: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(16),
    lineHeight: fontScale(16),
    marginLeft: -moderateScale(2),
  },
  // ── Magazine credit strip
  credits: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(10),
    marginTop: theme.spacing.s4,
  },
  creditText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  creditSep: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(12),
    opacity: 0.5,
  },
}));
