import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
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
} from "../../theme";
import { SceneTransition } from "../../components/navigation/SceneTransition";
import { BackButton } from "../../components/ui/BackButton";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { StaggeredList } from "../../components/animated/StaggeredList";
import { useProfileStore } from "../../stores/useProfileStore";
import { hapticLight, hapticSuccess } from "../../services/haptics";
import { uuid } from "../../utils/uuid";
import { CARE_TEAM_PALETTE } from "../../constants/onboarding";

type Member = {
  id: string;
  name: string;
  role: string;
  color: string;
};

const PALETTE = CARE_TEAM_PALETTE;

const ScreenCareTeam: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const setAnswer = useProfileStore((s) => s.setOnboardingAnswer);

  const [members, setMembers] = useState<Member[]>([
    { id: uuid(), name: "Dr. Chen", role: "Rheumatology", color: "#2C6E6B" },
  ]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    hapticSuccess();
    setMembers((m) => [
      ...m,
      {
        id: uuid(),
        name: trimmed,
        role: role.trim() || "Clinician",
        color: PALETTE[m.length % PALETTE.length]!,
      },
    ]);
    setName("");
    setRole("");
    setAdding(false);
  };

  const remove = (id: string) => {
    hapticLight();
    setMembers((m) => m.filter((x) => x.id !== id));
  };

  const onContinue = () => {
    setAnswer(
      "careTeam",
      members.map(({ name, role }) => ({ name, role })),
    );
    router.push("/onboarding/analyzing");
  };

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={[typography.label, { color: colors.textTertiary }]}>7 of 9</Text>
            <Pressable onPress={onContinue} hitSlop={8}>
              <Text
                style={[
                  typography.label,
                  {
                    color: colors.accent,
                    fontFamily: "DMSans_600SemiBold",
                  },
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
            <Text style={[typography.h1, { color: colors.textPrimary }]}>
              Who's on your care team?
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>
              Optional. Adding clinicians lets us tag entries and build summaries by doctor.
            </Text>

            <View style={{ marginTop: spacing.s5, gap: 8 }}>
              <StaggeredList stagger={80}>
                {members.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                      },
                      shadows.card,
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: m.color }]}>
                      <Text style={styles.avatarLetter}>
                        {m.name.replace(/^Dr\.?\s*/, "")[0] ?? "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.h3, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {m.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textTertiary }]}>
                        {m.role}
                      </Text>
                    </View>
                    <Pressable onPress={() => remove(m.id)} hitSlop={8}>
                      <Text
                        style={[
                          typography.label,
                          {
                            color: colors.textTertiary,
                            fontFamily: "DMSans_600SemiBold",
                          },
                        ]}
                      >
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </StaggeredList>

              {adding ? (
                <View
                  style={[
                    styles.addingCard,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.accent,
                    },
                    shadows.card,
                  ]}
                >
                  <InputField
                    value={name}
                    onChangeText={setName}
                    placeholder="Doctor name (e.g. Dr. Patel)"
                  />
                  <InputField
                    value={role}
                    onChangeText={setRole}
                    placeholder="Specialty (e.g. Primary care)"
                  />
                  <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
                    <Pressable
                      onPress={() => {
                        setAdding(false);
                        setName("");
                        setRole("");
                      }}
                      style={[styles.smallBtn, { backgroundColor: colors.bgMuted }]}
                    >
                      <Text
                        style={[
                          typography.label,
                          {
                            color: colors.textPrimary,
                            fontFamily: "DMSans_600SemiBold",
                          },
                        ]}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={add}
                      disabled={!name.trim()}
                      style={[
                        styles.smallBtn,
                        {
                          backgroundColor: colors.accent,
                          opacity: name.trim() ? 1 : 0.4,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.label,
                          {
                            color: "#FFFFFF",
                            fontFamily: "DMSans_600SemiBold",
                          },
                        ]}
                      >
                        Add
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setAdding(true);
                  }}
                  style={[styles.addDashed, { borderColor: colors.border }]}
                >
                  <Plus size={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      typography.body,
                      {
                        color: colors.textSecondary,
                        fontFamily: "DMSans_600SemiBold",
                      },
                    ]}
                  >
                    Add clinician
                  </Text>
                </Pressable>
              )}
            </View>

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: spacing.s4,
                },
              ]}
            >
              We never contact your clinicians. This is just for your records.
            </Text>
          </ScrollView>

          <View style={{ paddingHorizontal: spacing.s6, paddingTop: 8 }}>
            <PrimaryButton
              label={members.length > 0 ? "Continue" : "Skip for now"}
              onPress={onContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

interface InputFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}

const InputField: React.FC<InputFieldProps> = ({ value,
  onChangeText,
  placeholder }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      style={[
        typography.body,
        styles.input,
        {
          color: colors.textPrimary,
          backgroundColor: colors.bgPrimary,
          borderColor: colors.border,
        },
      ]}
    />
  );
}

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
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: fontScale(15),
    fontFamily: "DMSans_700Bold",
  },
  addingCard: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    gap: moderateScale(8),
  },
  input: {
    height: verticalScale(44),
    paddingHorizontal: scale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtn: {
    flex: 1,
    height: verticalScale(40),
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  addDashed: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: theme.radius.lg,
    paddingVertical: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: moderateScale(6),
  },
}));
