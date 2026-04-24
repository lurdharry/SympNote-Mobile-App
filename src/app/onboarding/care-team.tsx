import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
import { Lock, Plus, X } from "lucide-react-native";
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
  "orthopedics",
  "ophthalmology",
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
  const [customDraft, setCustomDraft] = useState("");
  /** Role the user is currently adding a clinician under. Null when
   *  no add is in progress. Setting this reveals the inline name
   *  input below the specialty grid and highlights the matching chip
   *  (if the role matches a preset). */
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const [hasAppointment, setHasAppointment] = useState(false);
  const [nextWhen, setNextWhen] = useState<Date>(defaultNextAppointment);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const pickSpecialty = (spec: Specialty) => {
    hapticLight();
    setAddingRole((prev) => (prev === spec.label ? null : spec.label));
    setNameDraft("");
    setCustomDraft("");
  };

  const startCustom = () => {
    const role = customDraft.trim();
    if (!role) return;
    hapticLight();
    setAddingRole(role);
    setNameDraft("");
    setCustomDraft("");
  };

  const cancelAdd = () => {
    hapticLight();
    setAddingRole(null);
    setNameDraft("");
  };

  const commitClinician = () => {
    if (!addingRole) return;
    const name = nameDraft.trim();
    if (!name) return;
    hapticLight();
    setMembers((m) => [...m, { id: uuid(), name, role: addingRole }]);
    setAddingRole(null);
    setNameDraft("");
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

            {/* Inline add flow — all on this screen, no modal.
                Tap a chip to pick its specialty, or type a custom one.
                A name input slides in below as soon as a specialty is
                chosen; submit adds the clinician and returns to idle. */}
            <View style={styles.quickAddBlock}>
              <Text style={[styles.quickAddLabel, { color: colors.textTertiary }]}>
                {hasMembers ? "Add another" : "Tap a specialty to add"}
              </Text>
              <View style={styles.chipsWrap}>
                {QUICK_ADD_SHORTCUTS.map((s) => {
                  const Icon = s.Icon;
                  const active = addingRole === s.label;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => pickSpecialty(s)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: active
                            ? s.grad[1] + "14"
                            : colors.bgSurface,
                          borderColor:
                            active || pressed ? s.grad[1] : colors.border,
                          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${s.label}`}
                      accessibilityState={{ selected: active }}
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
                            color: active ? s.grad[1] : colors.textPrimary,
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
              </View>

              {addingRole === null && (
                <View style={[styles.customRow, { borderColor: colors.border }]}>
                  <TextInput
                    value={customDraft}
                    onChangeText={setCustomDraft}
                    placeholder="Or type a specialty…"
                    placeholderTextColor={colors.textTertiary}
                    onSubmitEditing={startCustom}
                    returnKeyType="next"
                    autoCapitalize="words"
                    style={[styles.customInput, { color: colors.textPrimary }]}
                    accessibilityLabel="Type a specialty"
                  />
                  <Pressable
                    onPress={startCustom}
                    disabled={customDraft.trim().length === 0}
                    hitSlop={8}
                    style={[
                      styles.customAddBtn,
                      {
                        backgroundColor:
                          customDraft.trim().length === 0 ? colors.bgMuted : colors.accent,
                        opacity: customDraft.trim().length === 0 ? 0.7 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with this specialty"
                  >
                    <Plus
                      size={moderateScale(16)}
                      color={
                        customDraft.trim().length === 0
                          ? colors.textTertiary
                          : "#FFFFFF"
                      }
                      strokeWidth={2.6}
                    />
                  </Pressable>
                </View>
              )}

              {addingRole !== null && (
                <View style={styles.addCard}>
                  <View style={styles.addCardHeader}>
                    <Text style={[styles.addCardRole, { color: colors.accent }]}>
                      {addingRole.toUpperCase()}
                    </Text>
                    <Pressable
                      onPress={cancelAdd}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel"
                    >
                      <X size={moderateScale(14)} color={colors.textTertiary} strokeWidth={2.2} />
                    </Pressable>
                  </View>
                  <View style={[styles.customRow, { borderColor: colors.accent }]}>
                    <TextInput
                      value={nameDraft}
                      onChangeText={setNameDraft}
                      placeholder="Clinician's name"
                      placeholderTextColor={colors.textTertiary}
                      onSubmitEditing={commitClinician}
                      returnKeyType="done"
                      autoCapitalize="words"
                      autoFocus
                      style={[styles.customInput, { color: colors.textPrimary }]}
                      accessibilityLabel="Clinician's name"
                    />
                    <Pressable
                      onPress={commitClinician}
                      disabled={nameDraft.trim().length === 0}
                      hitSlop={8}
                      style={[
                        styles.customAddBtn,
                        {
                          backgroundColor:
                            nameDraft.trim().length === 0
                              ? colors.bgMuted
                              : colors.accent,
                          opacity: nameDraft.trim().length === 0 ? 0.7 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Add clinician"
                    >
                      <Plus
                        size={moderateScale(16)}
                        color={
                          nameDraft.trim().length === 0
                            ? colors.textTertiary
                            : "#FFFFFF"
                        }
                        strokeWidth={2.6}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: moderateScale(8),
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  customInput: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
  },
  customAddBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  addCard: {
    marginTop: moderateScale(8),
    gap: moderateScale(6),
  },
  addCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(4),
  },
  addCardRole: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
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
