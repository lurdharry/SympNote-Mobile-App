import React, { useMemo, useState } from "react";
import { Text, View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { Lock } from "lucide-react-native";
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
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StaggeredList } from "@/components/animated/StaggeredList";
import { AddClinicianSheet } from "@/components/onboarding/care-team/AddClinicianSheet";
import { AppointmentBlock } from "@/components/onboarding/care-team/AppointmentBlock";
import { SelectableClinicianRow } from "@/components/appointment-new/SelectableClinicianRow";
import { AddClinicianRow } from "@/components/appointment-new/AddClinicianRow";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { useCareTeam, useProfileStore } from "@/stores/useProfileStore";
import { hapticLight, hapticSuccess } from "@/services/haptics";
import { uuid } from "@/utils/uuid";
import type { Clinician as StoreClinician } from "@/stores/types";

const DEFAULT_TIME = { hours: 9, minutes: 0 };

const defaultDate = (): Date => {
  const d = addDays(new Date(), 1);
  return setSeconds(setMinutes(setHours(d, DEFAULT_TIME.hours), DEFAULT_TIME.minutes), 0);
};

const AppointmentNew: React.FC = () => {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colors } = useTheme();
  const styles = useStyles();

  const careTeam = useCareTeam();
  const addClinicianToStore = useProfileStore((s) => s.addClinician);

  const existing = useAppointmentsStore((s) => (editId ? s.getById(editId) : undefined));
  const isEdit = !!existing;

  const initial = useMemo(() => {
    if (existing) {
      return {
        doctor: existing.doctorName,
        specialty: existing.specialty,
        when: new Date(existing.date),
      };
    }
    return { doctor: "", specialty: "", when: defaultDate() };
  }, [existing]);

  const [doctorName, setDoctorName] = useState(initial.doctor);
  const [specialty, setSpecialty] = useState(initial.specialty);
  const [when, setWhen] = useState<Date>(initial.when);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appointmentEnabled, setAppointmentEnabled] = useState(true);
  // Track which clinician is selected by id so the appointment links
  // to a real care-team member instead of a loose name string. New
  // additions via the sheet supply a fresh id below.
  const [clinicianId, setClinicianId] = useState<string | undefined>(existing?.clinicianId);

  const canSave = doctorName.trim().length > 0 && appointmentEnabled;
  const selectedName = doctorName.trim().toLowerCase();

  const pickClinician = (c: StoreClinician) => {
    hapticLight();
    setClinicianId(c.id);
    setDoctorName(c.name);
    setSpecialty(c.role);
  };

  const handleSheetAdd = (value: { name: string; role: string }) => {
    const created = addClinicianToStore(value);
    setClinicianId(created.id);
    setDoctorName(value.name);
    setSpecialty(value.role);
  };

  const save = () => {
    if (!canSave) return;
    const trimmedDoc = doctorName.trim();
    const trimmedSpec = specialty.trim() || "General";
    const title = `${trimmedSpec} with ${trimmedDoc}`;
    if (isEdit && existing) {
      useAppointmentsStore.getState().update(existing.id, {
        title,
        clinicianId,
        doctorName: trimmedDoc,
        specialty: trimmedSpec,
        date: when.toISOString(),
      });
    } else {
      useAppointmentsStore.getState().add({
        id: uuid(),
        title,
        clinicianId,
        doctorName: trimmedDoc,
        specialty: trimmedSpec,
        date: when.toISOString(),
        status: "upcoming",
        attendedAt: null,
        outcome: null,
        brief: null,
        briefGeneratedAt: null,
        briefSourceRecordingIds: [],
      });
    }
    hapticSuccess();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          <View style={{ width: moderateScale(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {isEdit ? "EDIT VISIT" : "UPCOMING VISIT"}
          </Text>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            {isEdit ? `Edit your visit details` : `Who are you seeing?`}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {isEdit
              ? "Update the clinician or reschedule."
              : "Pick from your care team or add someone new. Sympnote will prep a tailored brief for this visit."}
          </Text>

          <View style={styles.body}>
            <StaggeredList stagger={60}>
              {careTeam.map((c) => (
                <SelectableClinicianRow
                  key={`${c.name}-${c.role}`}
                  clinician={c}
                  selected={c.name.trim().toLowerCase() === selectedName}
                  onPress={() => pickClinician(c)}
                />
              ))}
              <AddClinicianRow onPress={() => setSheetOpen(true)} />
            </StaggeredList>
          </View>

          <View style={styles.appointmentSlot}>
            <AppointmentBlock
              enabled={appointmentEnabled}
              onToggle={(v) => {
                setAppointmentEnabled(v);
                if (!v) setPickerMode(null);
              }}
              when={when}
              onChange={setWhen}
              pickerMode={pickerMode}
              onOpenPicker={setPickerMode}
              onClosePicker={() => setPickerMode(null)}
            />
          </View>

          <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
            <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
            <Text style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}>
              Private to you. Sympnote never contacts your clinicians.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.ctaSlot}>
          {!canSave && (
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginBottom: spacing.s2,
                },
              ]}
            >
              {!doctorName.trim()
                ? "Pick a clinician to continue"
                : "Turn on the appointment to continue"}
            </Text>
          )}
          <PrimaryButton
            label={isEdit ? "Save changes" : "Add appointment"}
            onPress={save}
            disabled={!canSave}
          />
        </View>
      </SafeAreaView>

      <AddClinicianSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleSheetAdd}
      />
    </View>
  );
};

export default AppointmentNew;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    ...theme.typography.label,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1.2,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.6,
    marginTop: moderateScale(4),
    lineHeight: fontScale(36),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(8),
    lineHeight: fontScale(22),
  },
  body: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  appointmentSlot: {
    marginTop: spacing.s6,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.full,
    marginTop: spacing.s5,
  },
  ctaSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(8),
    paddingBottom: spacing.s4,
  },
}));
