import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StaggeredList } from "@/components/animated/StaggeredList";
import { ClinicianCard } from "@/components/onboarding/care-team/ClinicianCard";
import type { Clinician } from "@/components/onboarding/care-team/ClinicianCard";
import { AddClinicianSheet } from "@/components/onboarding/care-team/AddClinicianSheet";
import { AppointmentBlock } from "@/components/onboarding/care-team/AppointmentBlock";
import { SPECIALTIES, Specialty } from "@/constants/specialties";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { buildPersonalizationProfile } from "@/utils/personalization";
import { hapticLight } from "@/services/haptics";
import { uuid } from "@/utils/uuid";

const QUICK_ADD_IDS = [
  "primary-care",
  "cardiology",
  "neurology",
  "psychiatry",
  "dermatology",
  "ob-gyn",
  "other",
];

const QUICK_ADD_SHORTCUTS: Specialty[] = QUICK_ADD_IDS.map(
  (id) => SPECIALTIES.find((s) => s.id === id)!,
);

const defaultNextAppointment = (): Date => {
  const d = addDays(new Date(), 7);
  return setSeconds(setMinutes(setHours(d, 9), 0), 0);
};

const continueLabel = (clinicianCount: number, hasAppointment: boolean): string => {
  if (clinicianCount === 0 && !hasAppointment) return "Skip for now";
  const parts: string[] = [];
  if (clinicianCount > 0) {
    parts.push(`${clinicianCount} ${clinicianCount === 1 ? "clinician" : "clinicians"}`);
  }
  if (hasAppointment) parts.push("1 appointment");
  return `Continue · ${parts.join(" and ")}`;
};

const ScreenCareTeam: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [members, setMembers] = useState<Clinician[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSeed, setSheetSeed] = useState<Specialty | null>(null);

  const [hasAppointment, setHasAppointment] = useState(false);
  const [nextWhen, setNextWhen] = useState<Date>(defaultNextAppointment);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const openSheet = (preset?: Specialty) => {
    hapticLight();
    setSheetSeed(preset ?? null);
    setSheetOpen(true);
  };

  const handleAdd = (value: { name: string; role: string }) => {
    setMembers((m) => [...m, { id: uuid(), ...value }]);
  };

  const handleRemove = (id: string) => {
    setMembers((m) => {
      const next = m.filter((x) => x.id !== id);
      // If the last clinician is gone, an appointment no longer has
      // anyone to be "with" — auto-reset so the two stay in sync.
      if (next.length === 0) {
        setHasAppointment(false);
        setPickerMode(null);
      }
      return next;
    });
  };

  const onContinue = () => {
    const careTeamPlain = members.map(({ name, role }) => ({ name, role }));
    setAnswer("careTeam", careTeamPlain);
    setAnswer("nextAppointment", hasAppointment ? nextWhen.toISOString() : "none");

    // The old analyzing screen was Noom-style theater sitting between
    // setup and capture — it didn't build tension toward commerce, so
    // we skip it and run its (trivial) real work inline here.
    const answers = useProfileStore.getState().onboardingAnswers;
    const profile = buildPersonalizationProfile(answers, answers.focus, careTeamPlain);
    useProfileStore.getState().setPersonalization(profile);

    if (hasAppointment) {
      const lead = careTeamPlain[0];
      useAppointmentsStore.getState().add({
        id: uuid(),
        title: lead ? `Visit with ${lead.name}` : "Upcoming visit",
        doctorName: lead?.name ?? "Your clinician",
        specialty: lead?.role ?? "General",
        date: nextWhen.toISOString(),
        status: 'upcoming',
        attendedAt: null,
        outcome: null,
        brief: null,
        briefGeneratedAt: null,
        briefSourceRecordingIds: [],
      });
    }

    router.push("/onboarding/first-recording");
  };

  const hasMembers = members.length > 0;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Pressable onPress={onContinue} hitSlop={8}>
              <Text
                style={[
                  typography.label,
                  { color: colors.textTertiary, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Skip
              </Text>
            </Pressable>
          </View>
          <View style={styles.progressSlot}>
            <OnboardingProgress value={0.75} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero — single headline + single sub, no eyebrow. */}
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Who takes care{"\n"}of you?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Add who you see. We'll organize your notes by clinician.
            </Text>

            {/* Clinician list — only when something's been added. */}
            {hasMembers && (
              <View style={styles.list}>
                <StaggeredList stagger={80}>
                  {members.map((m) => (
                    <ClinicianCard key={m.id} clinician={m} onRemove={handleRemove} />
                  ))}
                </StaggeredList>
              </View>
            )}

            {/* Quick-add specialty strip — always visible. Label flips
                contextually so the empty state feels inviting and the
                populated state reads as "add another". */}
            <View style={styles.quickAddBlock}>
              <Text style={[styles.quickAddLabel, { color: colors.textTertiary }]}>
                {hasMembers ? "Add another" : "Tap a specialty to add"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {QUICK_ADD_SHORTCUTS.map((s) => {
                  const Icon = s.Icon;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => openSheet(s)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: colors.bgSurface,
                          borderColor: pressed ? s.grad[1] : colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${s.label}`}
                    >
                      <View
                        style={[styles.chipTile, { backgroundColor: s.grad[1] + "1F" }]}
                      >
                        <Icon size={moderateScale(12)} color={s.grad[1]} strokeWidth={2.2} />
                      </View>
                      <Text
                        style={[
                          typography.label,
                          {
                            color: colors.textPrimary,
                            fontFamily: "DMSans_600SemiBold",
                            fontSize: fontScale(12),
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Appointment module — only meaningful once there's a clinician. */}
            {hasMembers && (
              <View style={styles.appointmentSlot}>
                <AppointmentBlock
                  enabled={hasAppointment}
                  onToggle={(v) => {
                    setHasAppointment(v);
                    if (!v) setPickerMode(null);
                  }}
                  when={nextWhen}
                  onChange={setNextWhen}
                  pickerMode={pickerMode}
                  onOpenPicker={setPickerMode}
                  onClosePicker={() => setPickerMode(null)}
                />
              </View>
            )}

            {/* Privacy footer */}
            <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
              <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
              <Text style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}>
                Private to you.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.ctaSlot}>
            <PrimaryButton label={"Continue"} onPress={onContinue} />
          </View>
        </SafeAreaView>

        <AddClinicianSheet
          visible={sheetOpen}
          initialSpecialty={sheetSeed}
          onClose={() => setSheetOpen(false)}
          onAdd={handleAdd}
        />
      </View>
    </SceneTransition>
  );
};

export default ScreenCareTeam;

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
  progressSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s6,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: "Fraunces_500Medium",
    letterSpacing: -0.6,
    lineHeight: fontScale(36),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(8),
    lineHeight: fontScale(22),
  },
  list: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  quickAddBlock: {
    marginTop: spacing.s6,
    gap: moderateScale(8),
  },
  quickAddLabel: {
    ...theme.typography.label,
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  chipsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    paddingRight: scale(4),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipTile: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
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
  },
}));
