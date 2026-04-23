import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { Lock, Plus } from "lucide-react-native";
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
import { CareTeamEmpty } from "@/components/onboarding/care-team/CareTeamEmpty";
import { AppointmentBlock } from "@/components/onboarding/care-team/AppointmentBlock";
import { Specialty } from "@/constants/specialties";
import { useProfileStore } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";
import { uuid } from "@/utils/uuid";

const defaultNextAppointment = (): Date => {
  const d = addDays(new Date(), 7);
  return setSeconds(setMinutes(setHours(d, 9), 0), 0);
};

const continueLabel = (clinicianCount: number, hasAppointment: boolean): string => {
  if (clinicianCount === 0 && !hasAppointment) return "Skip for now";
  const parts: string[] = [];
  if (clinicianCount > 0) {
    parts.push(
      `${clinicianCount} ${clinicianCount === 1 ? "clinician" : "clinicians"}`,
    );
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
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  const onContinue = () => {
    setAnswer(
      "careTeam",
      members.map(({ name, role }) => ({ name, role })),
    );
    setAnswer(
      "nextAppointment",
      hasAppointment ? nextWhen.toISOString() : "none",
    );
    router.push("/onboarding/analyzing");
  };

  const hasMembers = members.length > 0;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <View style={[styles.stagePill, { backgroundColor: colors.bgMuted }]}>
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                7 of 9
              </Text>
            </View>
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

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <Text style={[styles.eyebrow, { color: colors.accent }]}>
              YOUR CARE TEAM
            </Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Who takes care{"\n"}of you?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Add the doctors and specialists you see. Sympnote organizes your
              entries by clinician so each visit prep stays relevant.
            </Text>

            {/* Body */}
            <View style={styles.body}>
              {hasMembers ? (
                <>
                  <StaggeredList stagger={80}>
                    {members.map((m) => (
                      <ClinicianCard
                        key={m.id}
                        clinician={m}
                        onRemove={handleRemove}
                      />
                    ))}
                  </StaggeredList>
                  <Pressable
                    onPress={() => openSheet()}
                    style={styles.addAnother}
                    accessibilityRole="button"
                    accessibilityLabel="Add another clinician"
                  >
                    <View
                      style={[
                        styles.addAnotherIcon,
                        { backgroundColor: colors.accent + "1A" },
                      ]}
                    >
                      <Plus
                        size={moderateScale(14)}
                        color={colors.accent}
                        strokeWidth={2.2}
                      />
                    </View>
                    <Text
                      style={[
                        typography.label,
                        {
                          color: colors.accent,
                          fontFamily: "DMSans_600SemiBold",
                        },
                      ]}
                    >
                      Add another
                    </Text>
                  </Pressable>
                </>
              ) : (
                <CareTeamEmpty onPickSpecialty={openSheet} />
              )}
            </View>

            {/* Appointment module — visually secondary */}
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

            {/* Privacy footer */}
            <View
              style={[
                styles.privacyRow,
                { backgroundColor: colors.bgMuted },
              ]}
            >
              <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, flex: 1 },
                ]}
              >
                Private to you. Sympnote never contacts your clinicians.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.ctaSlot}>
            <PrimaryButton
              label={continueLabel(members.length, hasAppointment)}
              onPress={onContinue}
            />
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
  stagePill: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
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
  addAnother: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginTop: moderateScale(4),
  },
  addAnotherIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
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
