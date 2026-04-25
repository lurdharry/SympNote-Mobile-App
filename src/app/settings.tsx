import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { LogOut } from "lucide-react-native";
import { BackButton } from "@/components/ui/BackButton";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { hapticLight, hapticSuccess } from "@/services/haptics";
import { resetAppState } from "@/utils/resetApp";
import { useSettingsSections } from "@/hooks/useSettingsSections";
import { SectionGroup } from "@/components/settings/SectionGroup";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { ConditionsEditor } from "@/components/settings/ConditionsEditor";

const ScreenSettings: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const sections = useSettingsSections();
  const profileSection = sections.find((s) => s.title === "Profile");
  const otherSections = sections.filter((s) => s.title !== "Profile");

  const close = () => {
    hapticLight();
    router.back();
  };

  const resetApp = () => {
    Alert.alert(
      "Reset app?",
      "This clears every recording, appointment, brief, and your setup answers. You will start onboarding from the beginning.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset app",
          style: "destructive",
          onPress: () => {
            resetAppState();
            hapticSuccess();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton onPress={close} />
          <Text style={[typography.h1, styles.title, { color: colors.textPrimary }]}>
            Settings
          </Text>
          <View style={styles.headerRightFiller} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.s10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile group: Age + Care team + Focus, with the inline
              expandable Conditions editor inserted into the same
              card. Visually it reads as one section. */}
          {profileSection && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                {profileSection.title.toUpperCase()}
              </Text>
              <View style={styles.profileStack}>
                <SectionGroupInline rows={profileSection.rows} />
                <ConditionsEditor />
              </View>
            </View>
          )}

          {/* Preferences — currently just the theme toggle. */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              PREFERENCES
            </Text>
            <View
              style={[
                styles.prefCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
                shadows.card,
              ]}
            >
              <Text style={[styles.prefLabel, { color: colors.textPrimary }]}>
                Appearance
              </Text>
              <Text style={[styles.prefHint, { color: colors.textTertiary }]}>
                Light, Dark, or follow your device.
              </Text>
              <View style={styles.prefControlSlot}>
                <ThemeToggle />
              </View>
            </View>
          </View>

          {otherSections.map((section) => (
            <SectionGroup key={section.title} title={section.title} rows={section.rows} />
          ))}

          <View style={styles.signOutSlot}>
            <Pressable
              onPress={resetApp}
              style={[
                styles.signOut,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <LogOut size={16} color={colors.coral} strokeWidth={2} />
              <Text
                style={[
                  typography.label,
                  { color: colors.coral, fontFamily: "DMSans_600SemiBold" },
                ]}
              >
                Reset app
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
};

// ── Inline rows — same SettingsRow contract, just no surrounding
//    title (the parent section provides the heading). Used for the
//    Profile group so it can sit alongside ConditionsEditor under
//    one shared title. ────────────────────────────────────────────

import type { SettingsRow } from "@/hooks/useSettingsSections";
import { SettingsRowItem } from "@/components/settings/SettingsRowItem";

const SectionGroupInline: React.FC<{ rows: SettingsRow[] }> = ({ rows }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.inlineGroup,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      {rows.map((row, i) => (
        <SettingsRowItem key={row.label} row={row} isLast={i === rows.length - 1} />
      ))}
    </View>
  );
};

export default ScreenSettings;

const useStyles = makeStyles((theme) => ({
  safe: { flex: 1 },
  header: {
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  headerRightFiller: {
    width: moderateScale(40),
  },
  headerSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s5,
  },
  section: {
    paddingHorizontal: spacing.s6,
    marginBottom: spacing.s5,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    paddingBottom: verticalScale(8),
    paddingHorizontal: 4,
  },
  profileStack: {
    gap: moderateScale(8),
  },
  inlineGroup: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  prefCard: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prefLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
  prefHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(12),
    marginTop: 2,
  },
  prefControlSlot: {
    marginTop: verticalScale(12),
  },
  signOutSlot: {
    paddingHorizontal: spacing.s6,
    marginTop: spacing.s3,
  },
  signOut: {
    height: verticalScale(48),
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
    borderWidth: StyleSheet.hairlineWidth,
  },
}));
