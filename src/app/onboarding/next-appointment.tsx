import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { addDays, format, setHours, setMinutes, setSeconds } from "date-fns";
import { Calendar, Clock, Lock } from "lucide-react-native";
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
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAppointmentsStore } from "@/stores/useAppointmentsStore";
import { hapticLight, hapticSuccess } from "@/services/haptics";
import { uuid } from "@/utils/uuid";

const DEFAULT_TIME = { hours: 9, minutes: 0 };
const defaultNextAppointment = (): Date => {
  const d = addDays(new Date(), 7);
  return setSeconds(setMinutes(setHours(d, DEFAULT_TIME.hours), DEFAULT_TIME.minutes), 0);
};

const PRESETS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
  { label: "Two weeks", days: 14 },
  { label: "A month", days: 30 },
];

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

interface LeadClinician {
  name?: string;
  role?: string;
}

const ScreenNextAppointment: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  // The care-team step persisted the lead clinician under
  // onboardingAnswers.careTeam. If missing (user skipped that step),
  // fall back to generic copy — the screen still works.
  const lead = useProfileStore((s): LeadClinician => {
    const answers = s.onboardingAnswers as Record<string, unknown>;
    const team = Array.isArray(answers.careTeam) ? (answers.careTeam as LeadClinician[]) : [];
    return team[0] ?? {};
  });
  const leadName = lead.name?.trim() || "your clinician";

  const [when, setWhen] = useState<Date>(defaultNextAppointment);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const iosDateDisplay: "inline" | "spinner" =
    pickerMode === "date" ? "inline" : "spinner";

  const applyPreset = (days: number) => {
    hapticLight();
    const target = addDays(new Date(), days);
    target.setHours(when.getHours(), when.getMinutes(), 0, 0);
    setWhen(target);
    setPickerMode(null);
  };

  const openPicker = (mode: "date" | "time") => {
    hapticLight();
    setPickerMode((prev) => (prev === mode ? null : mode));
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (event.type === "dismissed") return;
    if (selected) setWhen(selected);
  };

  const onSkip = () => {
    hapticLight();
    setAnswer("nextAppointment", "none");
    router.push("/onboarding/first-recording");
  };

  const onSave = () => {
    hapticSuccess();
    setAnswer("nextAppointment", when.toISOString());
    useAppointmentsStore.getState().add({
      id: uuid(),
      title: lead.name ? `Visit with ${lead.name}` : "Upcoming visit",
      doctorName: lead.name ?? "Your clinician",
      specialty: lead.role ?? "General",
      date: when.toISOString(),
      status: "upcoming",
      attendedAt: null,
      outcome: null,
      brief: null,
      briefGeneratedAt: null,
      briefSourceRecordingIds: [],
    });
    router.push("/onboarding/first-recording");
  };

  const activePresetDays = useMemo(() => {
    const hit = PRESETS.find((p) => isSameDay(addDays(new Date(), p.days), when));
    return hit?.days ?? null;
  }, [when]);

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Pressable onPress={onSkip} hitSlop={8}>
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
            <OnboardingProgress value={0.85} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.eyebrow, { color: colors.accent }]}>NEXT VISIT</Text>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              When do you see{"\n"}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>{leadName}</Text>
              ?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Add a date and we'll have a visit brief ready for you. Skip if
              nothing's scheduled yet.
            </Text>

            {/* Big date tile — updates live as the user picks */}
            <View style={[styles.datePreview, { backgroundColor: colors.bgSurface, borderColor: colors.border }, shadows.card]}>
              <Text style={[styles.previewMonth, { color: colors.accent }]}>
                {format(when, "MMM").toUpperCase()}
              </Text>
              <Text style={[styles.previewDay, { color: colors.textPrimary }]}>
                {format(when, "d")}
              </Text>
              <Text style={[styles.previewWeekday, { color: colors.textSecondary }]}>
                {format(when, "EEEE")}
              </Text>
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.previewTime, { color: colors.textPrimary }]}>
                {format(when, "h:mm a")}
              </Text>
            </View>

            {/* Preset chips */}
            <View style={styles.presetsRow}>
              {PRESETS.map((p) => {
                const active = activePresetDays === p.days;
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => applyPreset(p.days)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active
                          ? colors.accent + "14"
                          : "transparent",
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: active ? colors.accent : colors.textSecondary,
                          fontFamily: "DMSans_600SemiBold",
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date / Time tiles */}
            <View style={styles.tilesRow}>
              <Pressable
                onPress={() => openPicker("date")}
                style={[
                  styles.tile,
                  {
                    borderColor: pickerMode === "date" ? colors.accent : colors.border,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: colors.accent + "1A" }]}>
                  <Calendar size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    Date
                  </Text>
                  <Text
                    style={[styles.tileValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {format(when, "EEE, MMM d")}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => openPicker("time")}
                style={[
                  styles.tile,
                  {
                    borderColor: pickerMode === "time" ? colors.accent : colors.border,
                    backgroundColor: colors.bgSurface,
                  },
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: colors.accent + "1A" }]}>
                  <Clock size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    Time
                  </Text>
                  <Text
                    style={[styles.tileValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {format(when, "h:mm a")}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Inline picker (iOS) / native dialog (Android) */}
            {pickerMode && Platform.OS === "android" && (
              <DateTimePicker
                value={when}
                mode={pickerMode}
                display="default"
                minimumDate={pickerMode === "date" ? new Date() : undefined}
                onChange={onPickerChange}
              />
            )}

            {pickerMode && Platform.OS === "ios" && (
              <View style={[styles.inlinePicker, { borderTopColor: colors.border }]}>
                <DateTimePicker
                  value={when}
                  mode={pickerMode}
                  display={iosDateDisplay}
                  minimumDate={pickerMode === "date" ? new Date() : undefined}
                  onChange={onPickerChange}
                  accentColor={colors.accent}
                />
                <Pressable onPress={() => setPickerMode(null)} style={styles.doneRow}>
                  <Text
                    style={[
                      typography.label,
                      { color: colors.accent, fontFamily: "DMSans_700Bold" },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
              <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
              <Text
                style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}
              >
                Private to you.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.ctaSlot}>
            <PrimaryButton label="Save appointment" onPress={onSave} />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenNextAppointment;

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
  datePreview: {
    marginTop: spacing.s6,
    alignItems: "center",
    paddingVertical: spacing.s5,
    paddingHorizontal: spacing.s5,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewMonth: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: 2,
  },
  previewDay: {
    fontFamily: "Fraunces_300Light",
    fontSize: fontScale(72),
    lineHeight: fontScale(78),
    letterSpacing: -2,
    marginTop: moderateScale(-4),
  },
  previewWeekday: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
    marginTop: moderateScale(-2),
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: spacing.s3,
  },
  previewTime: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(20),
    letterSpacing: -0.3,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: spacing.s5,
  },
  presetChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tilesRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginTop: spacing.s4,
  },
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
  },
  tileIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    ...theme.typography.body,
    fontFamily: "DMSans_600SemiBold",
    marginTop: 1,
  },
  inlinePicker: {
    marginTop: spacing.s3,
    paddingTop: spacing.s2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneRow: {
    alignItems: "flex-end",
    paddingVertical: verticalScale(8),
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
