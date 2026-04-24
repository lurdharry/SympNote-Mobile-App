import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
import { findSpecialty } from "@/constants/specialties";
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

  const lead = useProfileStore((s): LeadClinician => {
    const answers = s.onboardingAnswers as Record<string, unknown>;
    const team = Array.isArray(answers.careTeam) ? (answers.careTeam as LeadClinician[]) : [];
    return team[0] ?? {};
  });
  const leadName = lead.name?.trim() || "your clinician";
  // The hero date card's gradient shifts to the specialty of the lead
  // clinician — subtle continuity from the previous screen. Defaults
  // to the teal accent pair when no specialty is known.
  const specialty = findSpecialty(lead.role);
  const heroGrad = specialty.grad;

  const [when, setWhen] = useState<Date>(defaultNextAppointment);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const iosDateDisplay: "inline" | "spinner" = pickerMode === "date" ? "inline" : "spinner";

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
        {/* Ambient aurora — tinted by the clinician's specialty. */}
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[heroGrad[1] + "22", heroGrad[1] + "00"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              When do you see{"\n"}
              <Text style={{ fontStyle: "italic", color: heroGrad[1] }}>{leadName}</Text>?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Set a date and we'll have a visit brief ready. Skip if nothing's on the calendar yet.
            </Text>

            {/* Hero date card — gradient-filled, edge-to-edge. The
                selected date is the answer, so it owns the screen. */}
            <View style={[styles.heroCard, shadows.elevated]}>
              <LinearGradient
                colors={heroGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={styles.heroBlob} />
              <Text style={styles.heroMonth}>
                {format(when, "MMM").toUpperCase()}
              </Text>
              <Text style={styles.heroDay}>{format(when, "d")}</Text>
              <Text style={styles.heroWeekday}>{format(when, "EEEE")}</Text>
              <View style={styles.heroTimeRow}>
                <Clock size={moderateScale(12)} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
                <Text style={styles.heroTime}>{format(when, "h:mm a")}</Text>
              </View>
              {lead.name && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>with {lead.name}</Text>
                </View>
              )}
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
                        backgroundColor: active ? heroGrad[1] + "14" : colors.bgSurface,
                        borderColor: active ? heroGrad[1] : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: active ? heroGrad[1] : colors.textPrimary,
                          fontFamily: "DMSans_600SemiBold",
                          fontSize: fontScale(12),
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.tilesRow}>
              <Pressable
                onPress={() => openPicker("date")}
                style={[
                  styles.tile,
                  {
                    borderColor: pickerMode === "date" ? heroGrad[1] : colors.border,
                    backgroundColor: colors.bgSurface,
                  },
                  shadows.card,
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: heroGrad[1] + "1A" }]}>
                  <Calendar size={moderateScale(14)} color={heroGrad[1]} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>Date</Text>
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
                    borderColor: pickerMode === "time" ? heroGrad[1] : colors.border,
                    backgroundColor: colors.bgSurface,
                  },
                  shadows.card,
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: heroGrad[1] + "1A" }]}>
                  <Clock size={moderateScale(14)} color={heroGrad[1]} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>Time</Text>
                  <Text
                    style={[styles.tileValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {format(when, "h:mm a")}
                  </Text>
                </View>
              </Pressable>
            </View>

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
                  accentColor={heroGrad[1]}
                />
                <Pressable onPress={() => setPickerMode(null)} style={styles.doneRow}>
                  <Text
                    style={[
                      typography.label,
                      { color: heroGrad[1], fontFamily: "DMSans_700Bold" },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
              <Lock size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
              <Text style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}>
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
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(420),
    overflow: "hidden",
  },
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
    letterSpacing: -0.8,
    fontSize: fontScale(34),
    lineHeight: fontScale(40),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(10),
    lineHeight: fontScale(22),
    maxWidth: moderateScale(320),
  },
  heroCard: {
    marginTop: spacing.s6,
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s6,
    borderRadius: moderateScale(28),
    overflow: "hidden",
    alignItems: "flex-start",
  },
  heroBlob: {
    position: "absolute",
    right: -scale(40),
    top: -verticalScale(40),
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroMonth: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.85)",
  },
  heroDay: {
    fontFamily: "Fraunces_300Light",
    fontSize: fontScale(104),
    lineHeight: fontScale(108),
    letterSpacing: -4,
    color: "#FFFFFF",
    marginTop: moderateScale(-6),
  },
  heroWeekday: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(16),
    color: "rgba(255,255,255,0.9)",
    marginTop: moderateScale(-4),
  },
  heroTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    marginTop: moderateScale(12),
  },
  heroTime: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(18),
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  heroBadge: {
    position: "absolute",
    top: spacing.s5,
    right: spacing.s5,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  heroBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: spacing.s5,
  },
  presetChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
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
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
  },
  tileIcon: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(10),
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
