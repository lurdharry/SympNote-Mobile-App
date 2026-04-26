import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import { Plus, Sparkles, Users } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { hapticLight } from "@/services/haptics";
import type { Brief } from "@/stores/types";

/**
 * Briefs tab — chronological list of every brief the user has
 * generated. Each row carries the brief's window, audience tag, and
 * source-note count. Tap → detail screen.
 *
 * The header `+` is the primary "Generate" CTA. It runs the
 * "since my last brief" default flow so the user gets a brief in
 * one tap.
 */
const TabBriefs: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const briefs = useBriefsStore((s) => s.briefs);
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const recordings = useRecordingsStore((s) => s.recordings);
  const unbriefed = unbriefedRecordings(recordings, briefs);

  const onGenerate = () => {
    if (recordings.length === 0) {
      Alert.alert(
        "Nothing to brief yet",
        "Record a note first — once you have something to synthesise, tap + to pick which notes go in.",
      );
      return;
    }
    hapticLight();
    router.push("/brief/new");
  };

  const isEmpty = briefs.length === 0;

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h1, { color: colors.textPrimary }]}>Briefs</Text>
              <Text
                style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}
              >
                Synthesised snapshots of your notes.
              </Text>
            </View>
            <Pressable
              onPress={onGenerate}
              hitSlop={10}
              style={[styles.headerAdd, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel="New brief"
            >
              <Plus size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Status pill — un-briefed note count, prominent when there's pending work */}
            {unbriefed.length > 0 && (
              <Pressable
                onPress={onGenerate}
                style={[
                  styles.statusPill,
                  { backgroundColor: colors.accent + "12", borderColor: colors.accent + "55" },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Generate brief from new notes"
              >
                <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  {unbriefed.length} {unbriefed.length === 1 ? "note" : "notes"} not yet
                  briefed
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={[styles.statusCta, { color: colors.accent }]}>
                  Pick & generate ›
                </Text>
              </Pressable>
            )}

            {isEmpty ? (
              <EmptyState colors={colors} styles={styles} />
            ) : (
              briefs.map((b) => (
                <BriefRow
                  key={b.id}
                  brief={b}
                  careTeam={careTeam}
                  onPress={() => {
                    hapticLight();
                    router.push(`/brief/${b.id}`);
                  }}
                  styles={styles}
                  colors={colors}
                />
              ))
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: spacing.s4,
                  paddingHorizontal: spacing.s6,
                },
              ]}
            >
              Briefs are organisational tools · not medical advice
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

interface BriefRowProps {
  brief: Brief;
  careTeam: { id: string; name: string }[];
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}

const BriefRow: React.FC<BriefRowProps> = ({ brief, careTeam, onPress, colors, styles }) => {
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
      <View style={styles.rowHead}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {brief.title ?? range}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <View style={styles.metaChip}>
          <Users size={moderateScale(10)} color={colors.textTertiary} strokeWidth={2.2} />
          <Text style={[styles.metaChipText, { color: colors.textTertiary }]}>{audience}</Text>
        </View>
        <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.metaChipText, { color: colors.textTertiary }]}>
          {brief.sourceRecordingIds.length}{" "}
          {brief.sourceRecordingIds.length === 1 ? "note" : "notes"}
        </Text>
        <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.metaChipText, { color: colors.textTertiary }]}>{range}</Text>
      </View>
      {brief.content.summary ? (
        <Text
          style={[styles.rowSnippet, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {brief.content.summary}
        </Text>
      ) : null}
    </Pressable>
  );
};

const EmptyState: React.FC<{
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ colors, styles }) => (
  <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.accent + "1A" }]}>
      <Sparkles size={moderateScale(28)} color={colors.accent} strokeWidth={2} />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No briefs yet</Text>
    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
      Synthesise your notes into something doctor-ready. Tap the + above to generate from your
      latest notes.
    </Text>
  </View>
);

export default TabBriefs;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
  },
  headerAdd: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.accentGlow,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: verticalScale(120),
    gap: theme.spacing.s3,
  },
  // Status pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  statusCta: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
  // Brief row
  row: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(18),
    letterSpacing: -0.3,
    flex: 1,
  },
  rowMeta: {
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
  metaChipText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(10),
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  rowSnippet: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  // Empty
  empty: {
    alignItems: "center",
    paddingTop: theme.spacing.s8,
    paddingHorizontal: theme.spacing.s6,
  },
  emptyIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s4,
  },
  emptyTitle: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
  },
  emptySub: {
    ...theme.typography.body,
    textAlign: "center",
    marginTop: theme.spacing.s2,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    maxWidth: moderateScale(320),
  },
}));
