import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Edit3,
  FileText,
  Sparkles,
  StickyNote,
} from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { findSpecialty } from "@/constants/specialties";
import { hapticLight } from "@/services/haptics";
import { Button } from "@/components/ui/Button";
import { AddClinicianSheet } from "@/components/onboarding/care-team/AddClinicianSheet";
import type { Brief } from "@/stores/types";

/**
 * Per-clinician brief screen — the answer to "what should I tell Dr. X?"
 * No appointment required. Reachable from any care team card and from
 * the prep tab. Built from notes routed to this clinician (or general
 * notes that feed every brief), windowed since the last attended visit.
 *
 * Three states the body can be in:
 *   • empty   — no source recordings yet; encourage adding one
 *   • loading — first generation in flight
 *   • ready   — brief sections rendered, regenerate available
 */
const ClinicianDetail: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const clinician = useProfileStore((s) =>
    s.personalization?.careTeam.find((c) => c.id === id),
  );
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const updateClinicianStore = useProfileStore((s) => s.updateClinician);
  const recordings = useRecordingsStore((s) => s.recordings);
  const appointments = useAppointmentsStore((s) => s.appointments);
  const allBriefs = useBriefsStore((s) => s.briefs);

  // Briefs visible for this clinician — those tagged with their id,
  // plus "Everyone" briefs (empty clinicianIds) which feed every
  // clinician's filtered view.
  const briefsForClinician = useMemo<Brief[]>(
    () =>
      clinician
        ? allBriefs.filter(
            (b) => b.clinicianIds.length === 0 || b.clinicianIds.includes(clinician.id),
          )
        : [],
    [clinician, allBriefs],
  );
  const latestBrief = briefsForClinician[0];

  const unbriefedCount = useMemo(
    () => unbriefedRecordings(recordings, allBriefs).length,
    [recordings, allBriefs],
  );

  const upcomingHere = useMemo(
    () =>
      clinician
        ? appointments
            .filter((a) => a.clinicianId === clinician.id && a.status === "upcoming")
            .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0]
        : undefined,
    [clinician, appointments],
  );

  const [editOpen, setEditOpen] = useState(false);

  if (!clinician) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackBtn onPress={() => router.back()} />
            <View style={{ flex: 1 }} />
          </View>
          <View style={styles.gone}>
            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: "center" }]}>
              Clinician not found
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const spec = findSpecialty(clinician.role);
  const Icon = spec.Icon;

  const onGenerate = () => {
    if (recordings.length === 0) {
      Alert.alert(
        "Nothing to brief yet",
        "Record a note first — once you have something to synthesise, you'll be able to pick which notes go into a brief tagged for this clinician.",
      );
      return;
    }
    hapticLight();
    router.push("/brief/new");
  };

  const onEditSave = (value: { name: string; role: string }) => {
    const idx = careTeam.findIndex((c) => c.id === clinician.id);
    if (idx >= 0) {
      updateClinicianStore(idx, value);
      // Cached doctorName fields on appointments stay current with the
      // rename — the canonical name lives on the clinician, but
      // denormalized copies need a propagation pass for now.
      const linked = useAppointmentsStore
        .getState()
        .appointments.filter((a) => a.clinicianId === clinician.id);
      for (const a of linked) {
        useAppointmentsStore.getState().update(a.id, { doctorName: value.name });
      }
    }
    setEditOpen(false);
  };

  const noBriefsYet = briefsForClinician.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <BackBtn onPress={() => router.back()} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              hapticLight();
              setEditOpen(true);
            }}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Edit clinician"
          >
            <Edit3 size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Masthead ─────────────────────────────────────────── */}
          <View style={styles.masthead}>
            <View style={styles.specTile}>
              <LinearGradient
                colors={spec.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
              <View style={styles.specIconWrap}>
                <Icon size={moderateScale(28)} color={spec.fg} strokeWidth={2} />
              </View>
            </View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR CLINICIAN</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{clinician.name}</Text>
            <Text style={[styles.role, { color: colors.textSecondary }]}>{clinician.role}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <StickyNote
                  size={moderateScale(11)}
                  color={colors.textTertiary}
                  strokeWidth={2}
                />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {briefsForClinician.length}{" "}
                  {briefsForClinician.length === 1 ? "brief" : "briefs"}
                </Text>
              </View>
              {upcomingHere && (
                <View style={styles.metaItem}>
                  <Calendar
                    size={moderateScale(11)}
                    color={colors.textTertiary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    Visit · {format(parseISO(upcomingHere.date), "MMM d")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Generate CTA ─────────────────────────────────────── */}
          <Pressable
            onPress={onGenerate}
            style={[
              styles.generateCard,
              { backgroundColor: colors.accent + "12", borderColor: colors.accent + "55" },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Compose a brief for ${clinician.name}`}
          >
            <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.generateLabel, { color: colors.accent }]}>
                Compose a brief
              </Text>
              <Text style={[styles.generateSub, { color: colors.textSecondary }]}>
                {unbriefedCount > 0
                  ? `${unbriefedCount} ${unbriefedCount === 1 ? "note" : "notes"} not yet briefed — pick which go in.`
                  : `Pick the notes to synthesise.`}
              </Text>
            </View>
          </Pressable>

          {/* ── Briefs list ──────────────────────────────────────── */}
          {noBriefsYet ? (
            <EmptyBriefsState colors={colors} styles={styles} />
          ) : (
            <View style={{ marginTop: spacing.s4, gap: spacing.s2 }}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>BRIEFS</Text>
              {briefsForClinician.map((b) => (
                <ClinicianBriefRow
                  key={b.id}
                  brief={b}
                  onPress={() => {
                    hapticLight();
                    router.push(`/brief/${b.id}`);
                  }}
                  colors={colors}
                  styles={styles}
                />
              ))}
              {latestBrief && latestBrief.clinicianIds.length === 0 && (
                <Text style={[styles.note, { color: colors.textTertiary }]}>
                  Briefs without a clinician tag (Everyone) also surface here.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddClinicianSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onAdd={onEditSave}
        initialValue={{ name: clinician.name, role: clinician.role }}
      />
    </View>
  );
};

// ─── Pieces ────────────────────────────────────────────────────────────

const BackBtn: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[styles.iconBtn, { backgroundColor: colors.bgMuted }]}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <ArrowLeft size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
    </Pressable>
  );
};

interface ClinicianBriefRowProps {
  brief: Brief;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}

const ClinicianBriefRow: React.FC<ClinicianBriefRowProps> = ({
  brief,
  onPress,
  colors,
  styles,
}) => {
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
      style={[
        styles.briefRow,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open brief: ${brief.title ?? range}`}
    >
      <Text style={[styles.briefRowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {brief.title ?? range}
      </Text>
      <View style={styles.briefRowMeta}>
        <Text style={[styles.briefRowMetaText, { color: colors.textTertiary }]}>
          {brief.sourceRecordingIds.length}{" "}
          {brief.sourceRecordingIds.length === 1 ? "note" : "notes"}
        </Text>
        <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
        <Text style={[styles.briefRowMetaText, { color: colors.textTertiary }]}>{range}</Text>
        {isEveryone && (
          <>
            <View style={[styles.metaDot, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.briefRowMetaText, { color: colors.textTertiary }]}>
              Everyone
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const EmptyBriefsState: React.FC<{
  colors: ReturnType<typeof useTheme>["colors"];
  styles: ReturnType<typeof useStyles>;
}> = ({ colors, styles }) => (
  <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.accent + "1A" }]}>
      <FileText size={moderateScale(28)} color={colors.accent} strokeWidth={2} />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No briefs yet</Text>
    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
      Tap "Generate a brief" above to synthesise your latest notes tagged for this clinician —
      or generate without tagging from the Briefs tab.
    </Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s2,
    gap: moderateScale(10),
  },
  iconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s8,
  },
  gone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.s6,
  },
  // ── Masthead
  masthead: {
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s5,
  },
  specTile: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    overflow: "hidden",
    marginBottom: theme.spacing.s4,
    ...theme.shadows.card,
  },
  specIconWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  role: {
    ...theme.typography.body,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(14),
    marginTop: theme.spacing.s4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  // ── Generate CTA
  generateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  generateLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
  generateSub: {
    ...theme.typography.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 2,
  },
  // ── Brief rows
  briefRow: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  briefRowTitle: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(16),
    letterSpacing: -0.2,
  },
  briefRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: 4,
    flexWrap: "wrap",
  },
  briefRowMetaText: {
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
  note: {
    ...theme.typography.caption,
    fontStyle: "italic",
    fontSize: fontScale(11),
    marginTop: theme.spacing.s2,
  },
  // ── Section label (kept for "BRIEFS" header)
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },
  summary: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    letterSpacing: -0.1,
  },
  // Concerns
  concernRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(8),
  },
  concernNum: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  concernNumText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
  },
  concernLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    lineHeight: fontScale(20),
  },
  concernDetail: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    marginTop: 2,
    lineHeight: fontScale(19),
  },
  // Timeline
  timelineRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(6),
  },
  timelineDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(7),
  },
  timelineDate: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(10),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  timelineLine: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    marginTop: 2,
    lineHeight: fontScale(19),
  },
  // Bullets
  bulletLine: {
    ...theme.typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(22),
    paddingVertical: verticalScale(2),
  },
  // Flags
  flagRow: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: verticalScale(3),
  },
  flagText: {
    ...theme.typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
  },
  // Stale banner
  staleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: 1,
    marginTop: theme.spacing.s2,
  },
  staleText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.1,
  },
  regenSlot: {
    marginTop: theme.spacing.s6,
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
  // Loading
  loading: {
    alignItems: "center",
    paddingTop: theme.spacing.s8,
    gap: theme.spacing.s3,
  },
  loadingText: {
    ...theme.typography.body,
    fontSize: fontScale(13),
  },
  // Error
  errorBox: {
    marginTop: theme.spacing.s5,
    padding: theme.spacing.s4,
    borderWidth: 1,
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
    fontSize: fontScale(13),
  },
  retryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
}));

export default ClinicianDetail;
