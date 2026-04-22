import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import {
  Accessibility,
  Award,
  Bell,
  ChevronRight,
  ClipboardCheck,
  Download,
  Edit as EditIcon,
  Flame,
  Heart,
  Info,
  Lock,
  LogOut,
  Mic,
  Sparkles,
  User as UserIcon,
  Users,
  X as XIcon,
} from "lucide-react-native";
import { useTheme, radius, spacing, typography, shadows } from "../theme";
import { StreakPill } from "../components/ui/StreakPill";
import { ProgressRing } from "../components/ui/ProgressRing";
import { hapticLight, hapticSuccess } from "../services/haptics";
import { useProfileStore } from "../stores/useProfileStore";
import { useRecordingsStore } from "../stores/useRecordingsStore";
import { useAppointmentsStore } from "../stores/useAppointmentsStore";
import { computeStreak } from "../utils/insights";

/**
 * Settings — modal overlay from Home avatar. Per design handoff.
 *
 *  - Profile card with avatar + name + email + streak pill
 *  - 4 sections (Profile, Preferences, Privacy & data, Subscription)
 *    with icon rows + chevron-right or toggle
 *  - Milestones card with ProgressRing + badges grid
 *  - Sign out button + version
 */

type IconRef = typeof UserIcon;

type SettingsRow = {
  Icon: IconRef;
  label: string;
  value?: string;
  badge?: string;
  toggleKey?: "voiceOnly";
  onPress?: () => void;
};

type SettingsSection = {
  title: string;
  rows: SettingsRow[];
};

export default function ScreenSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const recordings = useRecordingsStore((s) => s.recordings);
  const appointments = useAppointmentsStore((s) => s.appointments);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const hapticsEnabled = useProfileStore((s) => s.hapticsEnabled);
  const setHaptics = useProfileStore((s) => s.setHapticsEnabled);

  const [voiceOnly, setVoiceOnly] = React.useState(false);

  // Real gamification derived from store state. XP is the only place
  // we assign point values:
  //   10 XP per recording    (the core action the app rewards)
  //   50 XP per summary      (generating a visit brief is the payoff)
  // Level goes up every 100 XP. Badges unlock when their criterion is
  // met. Streak = consecutive days with at least one recording.
  const streak = React.useMemo(() => computeStreak(recordings), [recordings]);
  const summariesCount = React.useMemo(
    () => appointments.filter((a) => !!a.summary).length,
    [appointments]
  );
  const xp = recordings.length * 10 + summariesCount * 50;
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const xpForNextLevel = 100 * level;
  const levelProgress = (xpIntoLevel / 100) * 100;
  const badges: Array<{ key: BadgeKey; label: string; unlocked: boolean }> = [
    { key: 'first',  label: 'First note', unlocked: recordings.length >= 1 },
    { key: 'streak', label: '5-day',      unlocked: streak >= 5 },
    { key: 'prep',   label: 'Prep pro',   unlocked: summariesCount >= 1 },
    { key: 'thirty', label: '30 notes',   unlocked: recordings.length >= 30 },
  ];

  const close = () => {
    hapticLight();
    router.back();
  };

  const exportData = async () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: 1,
        recordings,
        appointments,
      };
      const file = new File(Paths.cache, "sympnote-export.json");
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(payload, null, 2));
      const ok = await Sharing.isAvailableAsync();
      if (!ok) {
        Alert.alert("Sharing unavailable", "File saved to cache.");
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Export Sympnote data",
      });
    } catch (e) {
      Alert.alert("Export failed", String(e));
    }
  };

  const signOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          useProfileStore.getState().resetOnboarding();
          useRecordingsStore.setState({ recordings: [] });
          useAppointmentsStore.setState({ appointments: [] });
          hapticSuccess();
          router.replace("/onboarding");
        },
      },
    ]);
  };

  const sections: SettingsSection[] = [
    {
      title: "Profile",
      rows: [
        {
          Icon: UserIcon,
          label: "Personal info",
          value: "You",
          onPress: () => Alert.alert("Personal info", "Profile editing coming soon."),
        },
        {
          Icon: Users,
          label: "Care team",
          value: `${
            ((useProfileStore.getState().onboardingAnswers.careTeam as Array<unknown>) ?? []).length
          } clinicians`,
          onPress: () => router.push("/onboarding/care-team"),
        },
        {
          Icon: Heart,
          label: "Focus area",
          value:
            typeof useProfileStore.getState().onboardingAnswers.focus === "string"
              ? (useProfileStore.getState().onboardingAnswers.focus as string)
              : "Not set",
          onPress: () => router.push("/onboarding/focus"),
        },
      ],
    },
    {
      title: "Preferences",
      rows: [
        {
          Icon: Bell,
          label: "Notifications",
          value: "On · Morning 9am",
          onPress: () =>
            Linking.openSettings?.() ??
            Alert.alert("Notifications", "Configure in device Settings."),
        },
        {
          Icon: Accessibility,
          label: "Accessibility",
          value: "Default",
          onPress: () => Alert.alert("Accessibility", "Coming soon."),
        },
        {
          Icon: Mic,
          label: "Voice-only mode",
          toggleKey: "voiceOnly",
        },
      ],
    },
    {
      title: "Privacy & data",
      rows: [
        {
          Icon: Lock,
          label: "Privacy settings",
          value: "On-device only",
          onPress: () =>
            Alert.alert(
              "Privacy",
              "Voice is transcribed on-device. Only text you approve is sent to AI.",
            ),
        },
        {
          Icon: Download,
          label: `Export all data · ${recordings.length}`,
          value: "JSON",
          onPress: exportData,
        },
        {
          Icon: Info,
          label: "Medical disclaimer",
          onPress: () =>
            Alert.alert(
              "Not medical advice",
              "Sympnote is an organizational tool. Always consult your doctor for medical decisions.",
            ),
        },
      ],
    },
    {
      title: "Subscription",
      rows: [
        {
          Icon: Sparkles,
          label: "Sympnote Plus",
          value:
            subscriptionStatus === "trial"
              ? "Trial"
              : subscriptionStatus === "active"
                ? "Active"
                : "Not subscribed",
          badge:
            subscriptionStatus === "trial" || subscriptionStatus === "active" ? "PLUS" : undefined,
          onPress: () => Alert.alert("Manage subscription", "Opens the store."),
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Settings</Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeBtn, { backgroundColor: colors.bgMuted }]}
          >
            <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.s10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <View style={{ paddingHorizontal: spacing.s6, paddingBottom: spacing.s4 }}>
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                },
                shadows.card,
              ]}
            >
              <View style={styles.avatar}>
                <LinearGradient
                  colors={["#2C6E6B", "#1F504E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Inter_700Bold",
                    fontSize: 22,
                  }}
                >
                  Y
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
                  You
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {recordings.length === 0
                    ? 'No entries yet'
                    : `${recordings.length} ${
                        recordings.length === 1 ? 'entry' : 'entries'
                      } logged`}
                </Text>
                <View style={styles.streakRow}>
                  {streak > 0 ? (
                    <>
                      <StreakPill days={streak} />
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {streak === 1 ? '1-day streak' : `${streak}-day streak`}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textTertiary },
                      ]}
                    >
                      Log an entry to start a streak
                    </Text>
                  )}
                </View>
              </View>
              <Pressable hitSlop={8} onPress={() => hapticLight()}>
                <EditIcon size={16} color={colors.textTertiary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* Sections */}
          {sections.map((section) => (
            <SectionGroup
              key={section.title}
              title={section.title}
              rows={section.rows}
              voiceOnly={voiceOnly}
              setVoiceOnly={setVoiceOnly}
              hapticsEnabled={hapticsEnabled}
              setHaptics={setHaptics}
            />
          ))}

          {/* Milestones */}
          <View style={{ paddingHorizontal: spacing.s6, marginBottom: spacing.s5 }}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Milestones</Text>
            <View
              style={[
                styles.milestoneCard,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                },
                shadows.card,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <ProgressRing value={levelProgress} size={48} stroke={4}>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.accent,
                        fontFamily: "Inter_700Bold",
                      },
                    ]}
                  >
                    LV {level}
                  </Text>
                </ProgressRing>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.textPrimary, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    {levelTitle(level)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {xp} / {xpForNextLevel} XP to Level {level + 1}
                  </Text>
                </View>
              </View>
              <View style={styles.badgeGrid}>
                {badges.map((b) => {
                  const { Icon, tint } = BADGE_STYLES[b.key](colors);
                  return (
                    <View key={b.key} style={styles.badgeCell}>
                      <View
                        style={[
                          styles.badgeIcon,
                          {
                            backgroundColor: tint + (b.unlocked ? '22' : '11'),
                            opacity: b.unlocked ? 1 : 0.35,
                          },
                        ]}
                      >
                        <Icon
                          size={20}
                          color={b.unlocked ? tint : colors.textTertiary}
                          strokeWidth={2}
                        />
                      </View>
                      <Text
                        style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}
                        numberOfLines={1}
                      >
                        {b.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Sign out */}
          <View style={{ paddingHorizontal: spacing.s6 }}>
            <Pressable
              onPress={signOut}
              style={[
                styles.signOut,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                },
              ]}
            >
              <LogOut size={16} color={colors.coral} strokeWidth={2} />
              <Text
                style={[typography.label, { color: colors.coral, fontFamily: "Inter_600SemiBold" }]}
              >
                Sign out
              </Text>
            </Pressable>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: spacing.s3,
                },
              ]}
            >
              Sympnote v{Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/**
 * Honest, flavor-only title tied to the user's level. The app never
 * promises anything based on this — it's just a friendlier header than
 * "Level 3". Titles scale gently so early users don't feel patronized.
 */
function levelTitle(level: number): string {
  if (level <= 1) return 'Getting started';
  if (level <= 3) return 'Health Historian';
  if (level <= 6) return 'Pattern Finder';
  if (level <= 10) return 'Visit-Ready';
  return 'Prep Master';
}

/**
 * Per-badge Icon + tint. Declared as a record of factories so each
 * badge gets the themed color without Settings having to pass tints
 * through the badge data.
 */
type BadgeKey = 'first' | 'streak' | 'prep' | 'thirty';
type BadgeStyle = { Icon: typeof Mic; tint: string };
const BADGE_STYLES: Record<
  BadgeKey,
  (c: ReturnType<typeof useTheme>['colors']) => BadgeStyle
> = {
  first:  (c) => ({ Icon: Mic,            tint: c.accent }),
  streak: (c) => ({ Icon: Flame,          tint: c.coral }),
  prep:   (c) => ({ Icon: ClipboardCheck, tint: c.gold }),
  thirty: (c) => ({ Icon: Award,          tint: c.accent }),
};

function SectionGroup({
  title,
  rows,
  voiceOnly,
  setVoiceOnly,
  hapticsEnabled,
  setHaptics,
}: {
  title: string;
  rows: SettingsRow[];
  voiceOnly: boolean;
  setVoiceOnly: (v: boolean) => void;
  hapticsEnabled: boolean;
  setHaptics: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.s6, marginBottom: spacing.s5 }}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View
        style={[
          styles.group,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        {rows.map((row, i) => (
          <SettingsRowItem
            key={row.label}
            row={row}
            isLast={i === rows.length - 1}
            voiceOnly={voiceOnly}
            setVoiceOnly={setVoiceOnly}
            hapticsEnabled={hapticsEnabled}
            setHaptics={setHaptics}
          />
        ))}
      </View>
    </View>
  );
}

function SettingsRowItem({
  row,
  isLast,
  voiceOnly,
  setVoiceOnly,
}: {
  row: SettingsRow;
  isLast: boolean;
  voiceOnly: boolean;
  setVoiceOnly: (v: boolean) => void;
  hapticsEnabled: boolean;
  setHaptics: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  const isToggle = !!row.toggleKey;
  const toggleVal = row.toggleKey === "voiceOnly" ? voiceOnly : false;
  const onToggle = (v: boolean) => {
    if (row.toggleKey === "voiceOnly") setVoiceOnly(v);
    if (v) hapticLight();
  };
  const content = (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.accent + "1A" }]}>
        <row.Icon size={18} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowLabelRow}>
          <Text
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                fontFamily: "Inter_500Medium",
              },
            ]}
          >
            {row.label}
          </Text>
          {row.badge && (
            <View style={styles.plusBadge}>
              <LinearGradient
                colors={["#E07A5F", "#F6C06A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: "#FFFFFF",
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              >
                {row.badge}
              </Text>
            </View>
          )}
        </View>
        {row.value && (
          <Text style={[typography.caption, { color: colors.textTertiary }]} numberOfLines={1}>
            {row.value}
          </Text>
        )}
      </View>
      {isToggle ? (
        <Switch
          value={toggleVal}
          onValueChange={onToggle}
          trackColor={{ false: colors.bgMuted, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
      )}
    </View>
  );
  if (row.onPress) {
    return (
      <Pressable
        onPress={() => {
          hapticLight();
          row.onPress?.();
        }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
    paddingHorizontal: spacing.s6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  streakRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    paddingBottom: 8,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  milestoneCard: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeGrid: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  badgeCell: {
    flex: 1,
    alignItems: "center",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signOut: {
    height: 48,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
