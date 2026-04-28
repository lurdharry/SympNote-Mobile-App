import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { format, formatDistanceToNowStrict, isSameDay, parseISO } from "date-fns";
import { sortBy } from "lodash";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SympnoteSprite } from "@/components/onboarding/SympnoteSprite";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { hapticLight } from "@/services/haptics";
import { timeGreeting } from "@/utils/date";

const TRANSCRIPT_QUOTE_LEN = 140;
const DAY_MS = 86_400_000;

/**
 * Always-on masthead at the top of the home tab. Anchors the page in
 * the user's own story so home reads as "yours" instead of an empty
 * dashboard on quiet days.
 *
 * Composition (top → bottom):
 *   1. Date eyebrow + Fraunces italic greeting + Sympnote sprite
 *   2. Stats strip (notes · briefs · weeks journaling) — hidden on
 *      day-zero so a fresh user doesn't open the app to a row of
 *      zeroes
 *   3. Pull-quote card with the latest note's transcript snippet,
 *      tappable to open that note. Falls back to a welcome line
 *      when the user has no recordings yet.
 *
 * The whole component is self-contained — reads stores directly, no
 * props — so the home orchestrator just renders <JournalHero />.
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

  // Weeks since the very first note. Fresh user reads "1 week" on
  // their first day; ticks up each calendar week thereafter.
  const weeksJournaling = useMemo(() => {
    if (!earliestRecording) return 0;
    const ms = Date.now() - parseISO(earliestRecording.createdAt).getTime();
    return Math.max(1, Math.ceil(ms / (7 * DAY_MS)));
  }, [earliestRecording]);

  const dateEyebrow = format(new Date(), "EEEE · MMM d").toUpperCase();
  const greetingLine = timeGreeting();

  const pullQuote = useMemo(() => {
    if (!latestRecording) return null;
    const text = latestRecording.transcript.trim();
    if (!text) return null;
    return text.length > TRANSCRIPT_QUOTE_LEN
      ? text.slice(0, TRANSCRIPT_QUOTE_LEN).trimEnd() + "…"
      : text;
  }, [latestRecording]);

  const pullQuoteEyebrow = useMemo(() => {
    if (!latestRecording) return null;
    const created = parseISO(latestRecording.createdAt);
    const now = new Date();
    if (isSameDay(created, now)) return "FROM TODAY";
    const yesterday = new Date(now.getTime() - DAY_MS);
    if (isSameDay(created, yesterday)) return "FROM YESTERDAY";
    const dist = formatDistanceToNowStrict(created);
    return `${dist.toUpperCase()} AGO`;
  }, [latestRecording]);

  const onTapQuote = () => {
    if (!latestRecording) return;
    hapticLight();
    router.push(`/recording/${latestRecording.id}`);
  };

  const showStats = recordingsCount > 0;

  return (
    <View style={styles.wrap}>
      {/* ── Date + greeting + sprite ────────────────────────────── */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>{dateEyebrow}</Text>
          <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={2}>
            {greetingLine}
          </Text>
        </View>
        <View style={styles.spriteSlot}>
          <SympnoteSprite pose="greeting" reduced={reduced} size={moderateScale(64)} />
        </View>
      </View>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      {showStats && (
        <View style={[styles.stats, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Stat
            value={recordingsCount.toString()}
            label={recordingsCount === 1 ? "note" : "notes"}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat
            value={briefsCount.toString()}
            label={briefsCount === 1 ? "brief" : "briefs"}
          />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat
            value={`${weeksJournaling}w`}
            label={weeksJournaling === 1 ? "week" : "weeks"}
          />
        </View>
      )}

      {/* ── Pull-quote ──────────────────────────────────────────── */}
      {pullQuote && pullQuoteEyebrow ? (
        <Pressable
          onPress={onTapQuote}
          style={[
            styles.quote,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
            shadows.card,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open most recent note"
        >
          <Text style={[styles.quoteEyebrow, { color: colors.accent }]}>{pullQuoteEyebrow}</Text>
          <Text style={[styles.quoteBody, { color: colors.textPrimary }]} numberOfLines={3}>
            &ldquo;{pullQuote}&rdquo;
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.quote,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
            shadows.card,
          ]}
        >
          <Text style={[styles.quoteEyebrow, { color: colors.accent }]}>WELCOME</Text>
          <Text style={[styles.quoteBody, { color: colors.textSecondary }]}>
            Your journal is just beginning. Hold the mic below to record your first note.
          </Text>
        </View>
      )}
    </View>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    paddingTop: theme.spacing.s2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  greeting: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(30),
    lineHeight: fontScale(38),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  spriteSlot: {
    width: moderateScale(72),
    height: moderateScale(72),
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Stats
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(14),
    marginTop: theme.spacing.s4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    lineHeight: fontScale(26),
    letterSpacing: -0.4,
  },
  statLabel: {
    ...typography.caption,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: moderateScale(28),
    opacity: 0.6,
  },
  // ── Pull-quote
  quote: {
    marginTop: theme.spacing.s4,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  quoteEyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  quoteBody: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
    letterSpacing: -0.1,
  },
}));
