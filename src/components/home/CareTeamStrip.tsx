import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { useCareTeam } from "@/stores/useProfileStore";
import { findSpecialty } from "@/constants/specialties";
import { hapticLight } from "@/services/haptics";

/**
 * Horizontal strip of the user's care team on home. Each pill carries
 * the clinician's specialty mascot (we already designed one per
 * specialty in onboarding) and their name. Tap → /clinician/[id].
 *
 * Anchors home with brand warmth — the mascots are the most
 * distinctive part of the design system, and this surface is where
 * they earn their keep on a recurring screen, not just onboarding.
 *
 * Trailing "+ Add" pill routes to /care-team for adding more.
 * Component renders nothing when the user hasn't added anyone yet —
 * the day-zero `ReadyStateCard` covers that empty state.
 */
export const CareTeamStrip: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const careTeam = useCareTeam();

  if (careTeam.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textTertiary }]}>YOUR CARE TEAM</Text>
        <Pressable
          onPress={() => {
            hapticLight();
            router.push("/care-team");
          }}
          hitSlop={6}
        >
          <Text style={[styles.manage, { color: colors.accent }]}>Manage</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {careTeam.map((c) => {
          const spec = findSpecialty(c.role);
          const Mascot = spec.Mascot;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                hapticLight();
                router.push(`/clinician/${c.id}`);
              }}
              style={({ pressed }) => [
                styles.pill,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open brief for ${c.name}`}
            >
              <View style={styles.mascotSlot}>
                <Mascot size={moderateScale(40)} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.name, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <Text
                  style={[styles.role, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {c.role}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            hapticLight();
            router.push("/care-team");
          }}
          style={[
            styles.addPill,
            { borderColor: colors.border, backgroundColor: colors.bgSurface },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add clinician"
        >
          <View style={[styles.addIcon, { backgroundColor: colors.accent + "1A" }]}>
            <Plus size={moderateScale(14)} color={colors.accent} strokeWidth={2.4} />
          </View>
          <Text style={[styles.addText, { color: colors.accent }]}>Add</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    marginTop: theme.spacing.s5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: theme.spacing.s2,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  manage: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
  row: {
    gap: moderateScale(10),
    paddingRight: moderateScale(8),
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    minWidth: moderateScale(170),
    maxWidth: moderateScale(220),
  },
  mascotSlot: {
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: -0.1,
  },
  role: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    marginTop: 1,
  },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    minHeight: moderateScale(56),
  },
  addIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
}));
