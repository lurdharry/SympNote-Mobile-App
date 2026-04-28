import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import type { Brief } from "@/stores/types";

interface ClinicianBriefRowProps {
  brief: Brief;
  onPress: () => void;
}

/**
 * Single brief row in the per-clinician brief list. Shows title (or
 * date range), source-note count, window, and an "Everyone" tag when
 * the brief isn't clinician-scoped — that's why it surfaces here.
 */
export const ClinicianBriefRow: React.FC<ClinicianBriefRowProps> = ({ brief, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const start = parseISO(brief.windowStart);
  const end = parseISO(brief.windowEnd);
  const sameDay = start.toDateString() === end.toDateString();
  const range = sameDay
    ? format(start, "MMM d")
    : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
  const isEveryone = brief.clinicianIds.length === 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Open brief: ${brief.title ?? range}`}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {brief.title ?? range}
      </Text>
      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          {brief.sourceRecordingIds.length}{" "}
          {brief.sourceRecordingIds.length === 1 ? "note" : "notes"}
        </Text>
        <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>{range}</Text>
        {isEveryone && (
          <>
            <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>Everyone</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(16),
    letterSpacing: -0.2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: 4,
    flexWrap: "wrap",
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
}));
