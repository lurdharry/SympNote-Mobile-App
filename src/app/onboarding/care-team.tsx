import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Plus, Search, Sparkles, X } from "lucide-react-native";
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

// Specialties to surface in the suggestion list. We exclude the
// generic catch-all entries so the list shows real options; the
// user can always use the "Use as custom" row for anything else.
const SUGGEST_IDS = [
  "primary-care",
  "cardiology",
  "neurology",
  "psychiatry",
  "dermatology",
  "ob-gyn",
  "orthopedics",
  "ophthalmology",
];
const SUGGEST_SPECIALTIES: Specialty[] = SUGGEST_IDS.map(
  (id) => SPECIALTIES.find((s) => s.id === id)!,
);

const ScreenCareTeam: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [members, setMembers] = useState<Clinician[]>([]);
  const [query, setQuery] = useState("");
  /** Role the user is currently adding a clinician under. Null when
   *  no add is in progress. */
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const trimmed = query.trim();
  const suggestions = useMemo(() => {
    if (!trimmed) return SUGGEST_SPECIALTIES;
    const q = trimmed.toLowerCase();
    return SUGGEST_SPECIALTIES.filter((s) => s.label.toLowerCase().includes(q));
  }, [trimmed]);
  const exactHit = useMemo(
    () =>
      !!trimmed &&
      SUGGEST_SPECIALTIES.some((s) => s.label.toLowerCase() === trimmed.toLowerCase()),
    [trimmed],
  );
  const activeSpec = SUGGEST_SPECIALTIES.find((s) => s.label === addingRole);
  const auroraColor = activeSpec?.grad[1] ?? colors.accent;

  const pickSpecialty = (spec: Specialty) => {
    hapticLight();
    setAddingRole(spec.label);
    setNameDraft("");
    setQuery("");
  };

  const useAsCustom = () => {
    const role = trimmed;
    if (!role) return;
    hapticLight();
    setAddingRole(role);
    setNameDraft("");
    setQuery("");
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
            colors={[auroraColor + "22", auroraColor + "00"]}
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

            {!hasMembers && addingRole === null && (
              <>
                {/* Command-bar style search input */}
                <View
                  style={[
                    styles.searchRow,
                    { backgroundColor: colors.bgSurface },
                    shadows.card,
                  ]}
                >
                  <Search size={moderateScale(16)} color={colors.textTertiary} strokeWidth={2.2} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Primary care, Cardiology, or a name…"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      if (suggestions.length === 1) pickSpecialty(suggestions[0]!);
                      else if (!exactHit && trimmed) useAsCustom();
                    }}
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    accessibilityLabel="Search specialty"
                  />
                  {query.length > 0 && (
                    <Pressable
                      onPress={() => setQuery("")}
                      hitSlop={8}
                      style={[styles.clearBtn, { backgroundColor: colors.bgMuted }]}
                      accessibilityRole="button"
                      accessibilityLabel="Clear"
                    >
                      <X
                        size={moderateScale(12)}
                        color={colors.textTertiary}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Suggestions — filtered preset specialties */}
                <View style={styles.suggestions}>
                  {suggestions.map((s) => {
                    const Icon = s.Icon;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => pickSpecialty(s)}
                        style={({ pressed }) => [
                          styles.suggestRow,
                          {
                            backgroundColor: colors.bgSurface,
                            borderColor: pressed ? s.grad[1] : colors.border,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${s.label}`}
                      >
                        <View style={styles.suggestTile}>
                          <LinearGradient
                            colors={s.grad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                          <Icon
                            size={moderateScale(14)}
                            color={s.fg}
                            strokeWidth={2.2}
                          />
                        </View>
                        <Text
                          style={[
                            typography.body,
                            {
                              color: colors.textPrimary,
                              fontFamily: "DMSans_600SemiBold",
                              flex: 1,
                            },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {/* Custom specialty escape hatch when the query doesn't
                      match anything exactly. Always visible when the user
                      has typed something, so they know free text works. */}
                  {trimmed.length > 0 && !exactHit && (
                    <Pressable
                      onPress={useAsCustom}
                      style={[
                        styles.customRow,
                        { backgroundColor: colors.accent + "10", borderColor: colors.accent },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Use "${trimmed}" as custom specialty`}
                    >
                      <View
                        style={[
                          styles.suggestTile,
                          { backgroundColor: colors.accent + "22" },
                        ]}
                      >
                        <Sparkles
                          size={moderateScale(14)}
                          color={colors.accent}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            typography.body,
                            {
                              color: colors.textPrimary,
                              fontFamily: "DMSans_600SemiBold",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          Use "{trimmed}"
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textTertiary },
                          ]}
                        >
                          as a custom specialty
                        </Text>
                      </View>
                      <Plus
                        size={moderateScale(14)}
                        color={colors.accent}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  )}
                </View>
              </>
            )}

            {/* Name-entry card, appears once a specialty has been
                chosen (either from the suggestion list or custom). */}
            {!hasMembers && addingRole !== null && (
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
                    style={[styles.addCardInput, { color: colors.textPrimary }]}
                    accessibilityLabel="Clinician's name"
                  />
                  <Pressable
                    onPress={commitClinician}
                    disabled={nameDraft.trim().length === 0}
                    hitSlop={8}
                    style={[
                      styles.addCardBtn,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginTop: spacing.s5,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
    borderRadius: 9999,
  },
  searchInput: {
    flex: 1,
    paddingVertical: verticalScale(10),
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(15),
  },
  clearBtn: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: {
    marginTop: spacing.s4,
    gap: moderateScale(8),
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestTile: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(11),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addCard: {
    marginTop: spacing.s5,
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
  addCardInput: {
    flex: 1,
    paddingVertical: verticalScale(6),
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(14),
  },
  addCardBtn: {
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
