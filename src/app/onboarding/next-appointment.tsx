import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const specialty = findSpecialty(lead.role);
  const heroTint = specialty.grad[1];

  const [when, setWhen] = useState<Date>(defaultNextAppointment);
  /** Which picker modal is open, if any. */
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  /** Draft value for the open picker. Kept separate from `when` so
   *  Cancel can discard a pending change. */
  const [draft, setDraft] = useState<Date>(when);

  const applyPreset = (days: number) => {
    hapticLight();
    const target = addDays(new Date(), days);
    target.setHours(when.getHours(), when.getMinutes(), 0, 0);
    setWhen(target);
  };

  const openPicker = (mode: "date" | "time") => {
    hapticLight();
    setDraft(when);
    setPickerMode(mode);
  };

  const cancelPicker = () => {
    hapticLight();
    setPickerMode(null);
  };

  const confirmPicker = () => {
    hapticLight();
    setWhen(draft);
    setPickerMode(null);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android's native dialog fires its own OK/Cancel and then calls
    // this with event.type set accordingly. Our modal only wraps the
    // iOS spinner/inline variants, so on Android we just bridge the
    // native buttons directly to our commit/cancel flow.
    if (Platform.OS === "android") {
      if (event.type === "set" && selected) {
        setWhen(selected);
      }
      setPickerMode(null);
      return;
    }
    if (selected) setDraft(selected);
  };

  const onSkip = () => {
    hapticLight();
    setAnswer("nextAppointment", "none");
    router.push("/onboarding/summary");
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
    router.push("/onboarding/summary");
  };

  const activePresetDays = useMemo(() => {
    const hit = PRESETS.find((p) => isSameDay(addDays(new Date(), p.days), when));
    return hit?.days ?? null;
  }, [when]);

  const iosDisplay: "inline" | "spinner" = pickerMode === "date" ? "inline" : "spinner";

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[heroTint + "22", heroTint + "00"]}
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
              <Text style={{ fontStyle: "italic", color: heroTint }}>{leadName}</Text>?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Set a date and we'll have a visit brief ready. Skip if nothing's on the calendar yet.
            </Text>

            <View style={[styles.hero, shadows.card]}>
              <LinearGradient
                colors={specialty.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.heroText}>
                {format(when, "MMM d").toUpperCase()} · {format(when, "h:mm a")}
              </Text>
              {lead.name && <Text style={styles.heroSub}>with {lead.name}</Text>}
            </View>

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
                        backgroundColor: active ? heroTint + "14" : colors.bgSurface,
                        borderColor: active ? heroTint : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: active ? heroTint : colors.textPrimary,
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
              <TilePressable
                label="Date"
                value={format(when, "EEE, MMM d")}
                Icon={Calendar}
                tint={heroTint}
                onPress={() => openPicker("date")}
              />
              <TilePressable
                label="Time"
                value={format(when, "h:mm a")}
                Icon={Clock}
                tint={heroTint}
                onPress={() => openPicker("time")}
              />
            </View>

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

        {/* Picker modal. Android uses its own native dialog and skips
            the modal wrapper; iOS gets a sheet with Cancel / Done. */}
        {Platform.OS === "android" && pickerMode && (
          <DateTimePicker
            value={draft}
            mode={pickerMode}
            display="default"
            minimumDate={pickerMode === "date" ? new Date() : undefined}
            onChange={onPickerChange}
          />
        )}

        {Platform.OS === "ios" && (
          <Modal
            visible={pickerMode !== null}
            transparent
            animationType="fade"
            onRequestClose={cancelPicker}
          >
            <Pressable style={styles.backdrop} onPress={cancelPicker} />
            <View style={[styles.sheet, { backgroundColor: colors.bgSurface }]}>
              <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                <Pressable onPress={cancelPicker} hitSlop={8}>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.textSecondary, fontFamily: "DMSans_500Medium" },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Text
                  style={[
                    typography.label,
                    {
                      color: colors.textPrimary,
                      fontFamily: "DMSans_600SemiBold",
                      fontSize: fontScale(13),
                    },
                  ]}
                >
                  {pickerMode === "date" ? "Pick a date" : "Pick a time"}
                </Text>
                <Pressable onPress={confirmPicker} hitSlop={8}>
                  <Text
                    style={[
                      typography.body,
                      { color: heroTint, fontFamily: "DMSans_700Bold" },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
              <View style={styles.sheetBody}>
                {pickerMode && (
                  <DateTimePicker
                    value={draft}
                    mode={pickerMode}
                    display={iosDisplay}
                    minimumDate={pickerMode === "date" ? new Date() : undefined}
                    onChange={onPickerChange}
                    accentColor={heroTint}
                  />
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SceneTransition>
  );
};

interface TilePressableProps {
  label: string;
  value: string;
  Icon: typeof Calendar;
  tint: string;
  onPress: () => void;
}

const TilePressable: React.FC<TilePressableProps> = ({ label, value, Icon, tint, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: tint + "1A" }]}>
        <Icon size={moderateScale(14)} color={tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.tileValue, { color: colors.textPrimary }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Pressable>
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
    height: verticalScale(300),
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
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(8),
    lineHeight: fontScale(22),
    maxWidth: moderateScale(320),
  },
  hero: {
    marginTop: spacing.s5,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  heroText: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(22),
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  heroSub: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
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
    borderWidth: StyleSheet.hairlineWidth,
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
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: verticalScale(28),
    paddingTop: verticalScale(6),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetBody: {
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(4),
    alignItems: "center",
  },
}));
