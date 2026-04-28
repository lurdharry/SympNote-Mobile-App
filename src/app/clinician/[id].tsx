import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseISO } from "date-fns";
import { Edit3 } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, spacing, typography, useTheme } from "@/theme";
import { useCareTeam, useProfileStore } from "@/stores/useProfileStore";
import { useRecordingsStore } from "@/stores/useRecordingsStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useBriefsStore } from "@/stores/useBriefsStore";
import { unbriefedRecordings } from "@/utils/briefSource";
import { hapticLight } from "@/services/haptics";
import { showInfo } from "@/components/ui/Toast";
import { BackButton } from "@/components/ui/BackButton";
import { AddClinicianSheet } from "@/components/onboarding/care-team/AddClinicianSheet";
import { ClinicianMasthead } from "@/components/clinician/ClinicianMasthead";
import { ClinicianGenerateCTA } from "@/components/clinician/ClinicianGenerateCTA";
import { ClinicianBriefRow } from "@/components/clinician/ClinicianBriefRow";
import { ClinicianBriefsEmpty } from "@/components/clinician/ClinicianBriefsEmpty";
import type { Brief } from "@/stores/types";

/**
 * Per-clinician brief screen — the answer to "what should I tell Dr. X?"
 * The page is a thin orchestrator: lookup, derive briefs that surface
 * here, edit-name flow. Layout is composed from focused children:
 *
 *   ClinicianMasthead     — specialty tile + name + role + meta
 *   ClinicianGenerateCTA  — "Compose a brief" card
 *   ClinicianBriefRow     — single row in the brief list
 *   ClinicianBriefsEmpty  — recovery card when nothing surfaces yet
 */
const ClinicianDetail: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const clinician = useProfileStore((s) =>
    s.personalization?.careTeam.find((c) => c.id === id),
  );
  const careTeam = useCareTeam();
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
            <BackButton onPress={() => router.back()} type="contained" />
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

  const onGenerate = () => {
    if (recordings.length === 0) {
      showInfo("Nothing to brief yet", {
        body: "Record a note first — once you have something to synthesise, you'll be able to pick which notes go into a brief.",
      });
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
  const latestBrief = briefsForClinician[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} type="contained" />
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

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ClinicianMasthead
            clinician={clinician}
            briefCount={briefsForClinician.length}
            upcomingDate={upcomingHere?.date}
          />

          <ClinicianGenerateCTA
            clinicianName={clinician.name}
            unbriefedCount={unbriefedCount}
            onPress={onGenerate}
          />

          {noBriefsYet ? (
            <ClinicianBriefsEmpty />
          ) : (
            <View style={styles.briefsBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>BRIEFS</Text>
              {briefsForClinician.map((b) => (
                <ClinicianBriefRow
                  key={b.id}
                  brief={b}
                  onPress={() => {
                    hapticLight();
                    router.push(`/brief/${b.id}`);
                  }}
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

export default ClinicianDetail;

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
  briefsBlock: {
    marginTop: spacing.s4,
    gap: spacing.s2,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },
  note: {
    ...theme.typography.caption,
    fontStyle: "italic",
    fontSize: fontScale(11),
    marginTop: theme.spacing.s2,
  },
}));
