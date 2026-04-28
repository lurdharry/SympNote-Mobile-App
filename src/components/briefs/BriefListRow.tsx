import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { Users } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from "@/theme";
import type { Brief, Clinician } from "@/stores/types";

interface BriefListRowProps {
  brief: Brief;
  careTeam: Pick<Clinician, "id" | "name">[];
  onPress: () => void;
}

/**
 * Single brief row in the Briefs tab list. Shows title (or fallback
 * date range), audience tag, source-note count, window, and a 2-line
 * summary snippet when available.
 */
export const BriefListRow: React.FC<BriefListRowProps> = ({ brief, careTeam, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const tagged = brief.clinicianIds
    .map((id) => careTeam.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const audience =
    tagged.length === 0
      ? "Everyone"
      : tagged.length === 1
        ? tagged[0]!.name
        : `${tagged.length} clinicians`;

  const start = parseISO(brief.windowStart);
  const end = parseISO(brief.windowEnd);
  const sameDay = start.toDateString() === end.toDateString();
  const range = sameDay
    ? format(start, "MMM d")
    : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open brief: ${brief.title ?? range}`}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {brief.title ?? range}
        </Text>
      </View>
      <View style={styles.meta}>
        <View style={styles.metaChip}>
          <Users size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2.2} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>{audience}</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          {brief.sourceRecordingIds.length}{" "}
          {brief.sourceRecordingIds.length === 1 ? "note" : "notes"}
        </Text>
        <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>{range}</Text>
      </View>
      {brief.content.summary ? (
        <Text style={[styles.snippet, { color: colors.textSecondary }]} numberOfLines={2}>
          {brief.content.summary}
        </Text>
      ) : null}
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(18),
    letterSpacing: -0.3,
    flex: 1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(10),
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  snippet: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
}));
