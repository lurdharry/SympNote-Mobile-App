import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Plus, X } from "lucide-react-native";
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
import { StaggeredList } from "@/components/animated/StaggeredList";
import { ClinicianCard } from "@/components/onboarding/care-team/ClinicianCard";
import type { Clinician } from "@/components/onboarding/care-team/ClinicianCard";
import { SPECIALTIES, Specialty } from "@/constants/specialties";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useProfileStore } from "@/stores/useProfileStore";
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

const ScreenCareTeam: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [members, setMembers] = useState<Clinician[]>([]);
  const [customDraft, setCustomDraft] = useState("");
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const activeSpec = QUICK_ADD_SHORTCUTS.find((s) => s.label === addingRole);
  const activeTint = activeSpec?.grad[1] ?? colors.accent;

  const pickSpecialty = (spec: Specialty) => {
    hapticLight();
    // Tap the currently-selected chip again to collapse. Otherwise
    // swap roles without clobbering a name the user has started
    // typing — they might have picked the wrong chip first.
    setAddingRole((prev) => (prev === spec.label ? null : spec.label));
  };

  const startCustom = () => {
    const role = customDraft.trim();
    if (!role) return;
    hapticLight();
    setAddingRole(role);
    setCustomDraft("");
  };

  const cancelAdd = () => {
    hapticLight();
    setAddingRole(null);
    setNameDraft("");
  };

  const commitClinician = (): boolean => {
    if (!addingRole) return false;
    const name = nameDraft.trim();
    if (!name) return false;
    hapticLight();
    setMembers((m) => [...m, { id: uuid(), name, role: addingRole }]);
    setAddingRole(null);
    setNameDraft("");
    return true;
  };

  const handleRemove = (id: string) => {
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  const onContinue = () => {
    // If the user typed a name but didn't tap the +, still commit it
    // so we don't silently drop the clinician and skip the appointment
    // step. No-op when nothing's pending.
    let team = members;
    if (addingRole && nameDraft.trim()) {
      const committed: Clinician = {
        id: uuid(),
        name: nameDraft.trim(),
        role: addingRole,
      };
      team = [...members, committed];
      setMembers(team);
      setAddingRole(null);
      setNameDraft("");
    }

    const careTeamPlain = team.map(({ name, role }) => ({ name, role }));
    setAnswer("careTeam", careTeamPlain);

    const answers = useProfileStore.getState().onboardingAnswers;
    const profile = buildPersonalizationProfile(answers, answers.focus, careTeamPlain);
    useProfileStore.getState().setPersonalization(profile);

    if (careTeamPlain.length === 0) {
      setAnswer("nextAppointment", "none");
      router.push("/onboarding/first-recording");
      return;
    }
    router.push("/onboarding/next-appointment");
  };

  const hasMembers = members.length > 0;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[activeTint + "1E", activeTint + "00"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

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
            <OnboardingProgress value={0.65} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Who takes care{"\n"}of{" "}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>you</Text>?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Tap a specialty to add. We'll organize your notes by clinician.
            </Text>

            {hasMembers && (
              <View style={styles.list}>
                <StaggeredList stagger={80}>
                  {members.map((m) => (
                    <ClinicianCard key={m.id} clinician={m} onRemove={handleRemove} />
                  ))}
                </StaggeredList>
              </View>
            )}

            {!hasMembers && (
              <Animated.View
                layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))}
                style={styles.addBlock}
              >
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
                          <Icon
                            size={moderateScale(12)}
                            color={s.grad[1]}
                            strokeWidth={2.2}
                          />
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

                {/* Custom specialty row — always visible so the grid
                    doesn't feel like a closed list. Typing here and
                    submitting treats the text as a custom role. */}
                <View
                  style={[
                    styles.customRow,
                    { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  ]}
                >
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
                          customDraft.trim().length === 0
                            ? colors.bgMuted
                            : colors.accent,
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

                {/* Name input — slides in below the chip grid when a
                    specialty is selected, without hiding the grid so
                    the user can swap specialty without losing their
                    place. */}
                {addingRole !== null && (
                  <Animated.View
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(160)}
                    style={[styles.nameCard, shadows.card]}
                  >
                    <LinearGradient
                      colors={[activeTint + "1A", activeTint + "00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.nameCardHeader}>
                      <Text style={[styles.nameCardRole, { color: activeTint }]}>
                        {addingRole.toUpperCase()}
                      </Text>
                      <Pressable
                        onPress={cancelAdd}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                      >
                        <X
                          size={moderateScale(14)}
                          color={colors.textTertiary}
                          strokeWidth={2.2}
                        />
                      </Pressable>
                    </View>
                    <View
                      style={[
                        styles.nameInputRow,
                        { borderColor: activeTint + "66" },
                      ]}
                    >
                      <TextInput
                        value={nameDraft}
                        onChangeText={setNameDraft}
                        placeholder="Clinician's name"
                        placeholderTextColor={colors.textTertiary}
                        onSubmitEditing={() => {
                          commitClinician();
                        }}
                        returnKeyType="done"
                        autoCapitalize="words"
                        autoFocus
                        style={[styles.nameInput, { color: colors.textPrimary }]}
                        accessibilityLabel="Clinician's name"
                      />
                      <Pressable
                        onPress={commitClinician}
                        disabled={nameDraft.trim().length === 0}
                        hitSlop={8}
                        style={[
                          styles.nameAddBtn,
                          {
                            backgroundColor:
                              nameDraft.trim().length === 0
                                ? colors.bgMuted
                                : activeTint,
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
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {hasMembers && (
              <Text
                style={[
                  typography.caption,
                  styles.addMoreHint,
                  { color: colors.textTertiary },
                ]}
              >
                You can add more clinicians later in Settings.
              </Text>
            )}

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
  aurora: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(320),
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
  list: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  addBlock: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(8),
    paddingRight: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
  },
  chipTile: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(14),
    paddingRight: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  customInput: {
    flex: 1,
    paddingVertical: verticalScale(8),
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
  },
  customAddBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  nameCard: {
    marginTop: moderateScale(4),
    padding: moderateScale(14),
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    gap: moderateScale(10),
  },
  nameCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(4),
  },
  nameCardRole: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(14),
    paddingRight: scale(4),
    paddingVertical: verticalScale(4),
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  nameInput: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
  },
  nameAddBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreHint: {
    marginTop: spacing.s4,
    fontStyle: "italic",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.full,
    marginTop: spacing.s6,
  },
  ctaSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(8),
  },
}));
