import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
  /** Role the user is currently adding a clinician under. Null when
   *  no add is in progress. Setting this reveals the inline name
   *  input below the specialty grid and highlights the matching chip
   *  (if the role matches a preset). */
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

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
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  const onContinue = () => {
    const careTeamPlain = members.map(({ name, role }) => ({ name, role }));
    setAnswer("careTeam", careTeamPlain);

    // Build personalization now so downstream screens (including
    // next-appointment) can read the lead clinician from the profile.
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
  // Active specialty for the aurora tint. When the user picks a chip
  // the background gradient subtly shifts to that specialty's palette
  // — a live, colored signal that the screen is responding to them.
  const activeSpec = QUICK_ADD_SHORTCUTS.find((s) => s.label === addingRole);
  const auroraColor = activeSpec?.grad[1] ?? colors.accent;

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        {/* Ambient aurora — soft color wash at the top of the screen
            that shifts with the selected specialty. Non-interactive. */}
        <View pointerEvents="none" style={styles.aurora}>
          <LinearGradient
            colors={[auroraColor + "33", auroraColor + "00"]}
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
            {/* Editorial hero — "you" italicized in accent */}
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              Who takes care{"\n"}of{" "}
              <Text style={{ fontStyle: "italic", color: colors.accent }}>you</Text>?
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Add who you see. We'll organize your notes by clinician.
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
              <View style={styles.quickAddBlock}>
                <Text style={[styles.quickAddLabel, { color: colors.textTertiary }]}>
                  Tap a specialty to add
                </Text>
                <View style={styles.chipsWrap}>
                  {QUICK_ADD_SHORTCUTS.map((s) => {
                    const Icon = s.Icon;
                    const active = addingRole === s.label;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => pickSpecialty(s)}
                        style={[
                          styles.chip,
                          active && styles.chipActive,
                          !active && {
                            backgroundColor: colors.bgSurface,
                            borderColor: colors.border,
                          },
                          shadows.card,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${s.label}`}
                        accessibilityState={{ selected: active }}
                      >
                        {/* Gradient fill when active — the chip becomes
                            a colored pill. Otherwise a small gradient
                            tile on the left adds color variety. */}
                        {active && (
                          <LinearGradient
                            colors={s.grad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        {!active && (
                          <View style={styles.chipTile}>
                            <LinearGradient
                              colors={s.grad}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <Icon
                              size={moderateScale(12)}
                              color={s.fg}
                              strokeWidth={2.2}
                            />
                          </View>
                        )}
                        <Text
                          style={[
                            typography.label,
                            {
                              color: active ? "#FFFFFF" : colors.textPrimary,
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
                  <View
                    style={[
                      styles.customRow,
                      { backgroundColor: colors.bgSurface },
                      shadows.card,
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
                )}

                {addingRole !== null && (
                  <View
                    style={[
                      styles.addCard,
                      { backgroundColor: colors.bgSurface },
                      shadows.elevated,
                    ]}
                  >
                    <LinearGradient
                      colors={[auroraColor + "1A", auroraColor + "00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.addCardHeader}>
                      <Text style={[styles.addCardRole, { color: auroraColor }]}>
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
                        styles.addCardInputRow,
                        { borderColor: auroraColor + "55" },
                      ]}
                    >
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
                                : auroraColor,
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
    fontSize: fontScale(34),
    lineHeight: fontScale(40),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(10),
    lineHeight: fontScale(22),
    maxWidth: moderateScale(320),
  },
  list: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  quickAddBlock: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: moderateScale(6),
    paddingRight: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  chipActive: {
    borderColor: "transparent",
  },
  chipTile: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginTop: moderateScale(4),
    paddingLeft: scale(16),
    paddingRight: scale(6),
    paddingVertical: verticalScale(5),
    borderRadius: 9999,
  },
  customInput: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(14),
  },
  customAddBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
  },
  addCard: {
    marginTop: moderateScale(4),
    padding: moderateScale(14),
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    gap: moderateScale(10),
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
    letterSpacing: 1.4,
  },
  addCardInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(14),
    paddingRight: scale(4),
    paddingVertical: verticalScale(4),
    borderRadius: 9999,
    borderWidth: 1.5,
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
