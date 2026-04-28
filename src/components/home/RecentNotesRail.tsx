import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { sortBy } from "lodash";
import { Mic } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  useTheme,
  verticalScale,
} from "@/theme";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { hapticLight } from "@/services/haptics";

const RAIL_LIMIT = 5;
const SNIPPET_LEN = 90;

/**
 * Horizontal rail of the user's most recent notes on home. Each card
 * shows the date, a short transcript snippet, and the leading tag if
 * present. Tap → /recording/[id]. Renders nothing on day-zero — the
 * `ReadyStateCard` already prompts a first capture in that state.
 *
 * Always-on after the first note exists, which is the gap that made
 * home feel empty before. Five cards is enough to surface "your
 * recent voice" without dominating the page.
 */
export const RecentNotesRail: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const recordings = useRecordingsStore((s) => s.recordings);

  const recent = useMemo(() => {
    if (recordings.length === 0) return [];
    return sortBy(recordings, (r) => -parseISO(r.createdAt).getTime()).slice(0, RAIL_LIMIT);
  }, [recordings]);

  if (recent.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>RECENT NOTES</Text>
        <Pressable
          onPress={() => {
            hapticLight();
            router.push("/(tabs)/history");
          }}
          hitSlop={6}
        >
          <Text style={[styles.viewAll, { color: colors.accent }]}>View all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {recent.map((r) => {
          const date = parseISO(r.createdAt);
          const snippet = r.transcript.trim().slice(0, SNIPPET_LEN);
          const tag = r.tags[0];
          return (
            <Pressable
              key={r.id}
              onPress={() => {
                hapticLight();
                router.push(`/recording/${r.id}`);
              }}
              style={[
                styles.card,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
                shadows.card,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open note from ${format(date, "MMM d")}`}
            >
              <View style={styles.cardHead}>
                <Mic size={moderateScale(11)} color={colors.textTertiary} strokeWidth={2.2} />
                <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
                  {format(date, "MMM d · h:mm a").toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.cardBody, { color: colors.textPrimary }]}
                numberOfLines={3}
              >
                {snippet || "(empty note)"}
              </Text>
              {tag ? (
                <View style={styles.tagRow}>
                  <View style={[styles.tagDot, { backgroundColor: colors.accent }]} />
                  <Text
                    style={[styles.tagText, { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    {tag}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    marginTop: theme.spacing.s5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: theme.spacing.s2,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  viewAll: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  row: {
    gap: moderateScale(10),
    paddingRight: moderateScale(8),
  },
  card: {
    width: moderateScale(220),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  cardDate: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(9),
    letterSpacing: 1.2,
  },
  cardBody: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
    minHeight: fontScale(57),
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginTop: theme.spacing.s2,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tagText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
    flex: 1,
  },
}));
