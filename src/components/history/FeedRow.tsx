import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Mic, Sparkles, Users } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import type { FeedItem } from "@/hooks/useHistoryData";

interface FeedRowProps {
  entry: FeedItem;
  isFirst: boolean;
}

/**
 * Unified history feed row. Two visual variants share the same row
 * skeleton (time + content + tap-to-detail) but read distinctly:
 *
 *   • Note row — Mic glyph, neutral colour. Lead is the transcript
 *     snippet. Taps route to /recording/[id].
 *   • Brief row — Sparkles glyph in accent, accent left-edge bar.
 *     Lead is the brief title in Fraunces italic + audience tag +
 *     source count. Taps route to /brief/[id].
 *
 * The rows alternate in a single chronological card so the user sees
 * the story of their tracking — not two parallel lists.
 */
export const FeedRow: React.FC<FeedRowProps> = ({ entry, isFirst }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);

  const onPress = () => {
    hapticLight();
    if (entry.kind === "note") {
      router.push(`/recording/${entry.id}`);
    } else {
      router.push(`/brief/${entry.id}`);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isFirst && {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        entry.kind === "brief" && { backgroundColor: colors.accent + "08" },
        pressed && { backgroundColor: colors.bgMuted },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        entry.kind === "note"
          ? `Note at ${entry.time}, ${entry.dur}`
          : `Brief at ${entry.time}, ${entry.title}`
      }
    >
      {/* Left edge accent bar — only on briefs, anchors the visual
          difference at a glance without needing colour everywhere. */}
      {entry.kind === "brief" && (
        <View style={[styles.briefBar, { backgroundColor: colors.accent }]} />
      )}

      {/* Top row — kind glyph + eyebrow + time */}
      <View style={styles.topRow}>
        <View style={styles.leadGroup}>
          {entry.kind === "note" ? (
            <Mic
              size={moderateScale(11)}
              color={colors.textTertiary}
              strokeWidth={2.2}
            />
          ) : (
            <Sparkles
              size={moderateScale(11)}
              color={colors.accent}
              strokeWidth={2.4}
            />
          )}
          <Text
            style={[
              styles.eyebrow,
              { color: entry.kind === "brief" ? colors.accent : colors.textTertiary },
            ]}
          >
            {entry.kind === "note" ? `NOTE · ${entry.dur}` : "BRIEF"}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.textTertiary }]}>
          {entry.time}
        </Text>
      </View>

      {/* Body — transcript for notes, title + summary for briefs */}
      {entry.kind === "note" ? (
        <Text
          style={[styles.noteBody, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {entry.text}
        </Text>
      ) : (
        <View style={{ gap: moderateScale(4) }}>
          <Text
            style={[styles.briefTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {entry.title}
          </Text>
          {entry.summarySnippet ? (
            <Text
              style={[styles.briefSummary, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {entry.summarySnippet}
            </Text>
          ) : null}
        </View>
      )}

      {/* Brief footer — audience + source count */}
      {entry.kind === "brief" && (
        <View style={styles.briefFoot}>
          <Users
            size={moderateScale(10)}
            color={colors.textTertiary}
            strokeWidth={2.2}
          />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {audienceLabel(entry.clinicianIds, careTeam)}
          </Text>
          <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {entry.sourceCount} {entry.sourceCount === 1 ? "note" : "notes"}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const audienceLabel = (
  clinicianIds: string[],
  careTeam: { id: string; name: string }[],
): string => {
  if (clinicianIds.length === 0) return "Everyone";
  const names = clinicianIds
    .map((id) => careTeam.find((c) => c.id === id)?.name)
    .filter((n): n is string => !!n);
  if (names.length === 0) return "Everyone";
  if (names.length === 1) return names[0]!;
  return `${names.length} clinicians`;
};

const useStyles = makeStyles((theme) => ({
  row: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    gap: moderateScale(8),
    position: "relative",
  },
  briefBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: moderateScale(3),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(8),
  },
  leadGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  time: {
    ...typography.label,
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  noteBody: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
  },
  briefTitle: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(17),
    letterSpacing: -0.2,
    lineHeight: fontScale(22),
  },
  briefSummary: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
  },
  briefFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(2),
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
}));
