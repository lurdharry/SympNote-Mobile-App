import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format, parseISO } from "date-fns";
import { Calendar, StickyNote } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import { findSpecialty } from "@/constants/specialties";
import type { Clinician } from "@/stores/types";

interface ClinicianMastheadProps {
  clinician: Clinician;
  briefCount: number;
  /** ISO date of the next upcoming visit with this clinician, if any. */
  upcomingDate?: string;
}

/**
 * Top of /clinician/[id] — specialty tile, eyebrow, name, role, and a
 * meta row with brief count and (optionally) the next scheduled visit.
 */
export const ClinicianMasthead: React.FC<ClinicianMastheadProps> = ({
  clinician,
  briefCount,
  upcomingDate,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const spec = findSpecialty(clinician.role);
  const Icon = spec.Icon;

  return (
    <View style={styles.masthead}>
      <View style={styles.specTile}>
        <LinearGradient
          colors={spec.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        <View style={styles.specIconWrap}>
          <Icon size={moderateScale(28)} color={spec.fg} strokeWidth={2} />
        </View>
      </View>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR CLINICIAN</Text>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{clinician.name}</Text>
      <Text style={[styles.role, { color: colors.textSecondary }]}>{clinician.role}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <StickyNote size={moderateScale(11)} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {briefCount} {briefCount === 1 ? "brief" : "briefs"}
          </Text>
        </View>
        {upcomingDate && (
          <View style={styles.metaItem}>
            <Calendar size={moderateScale(11)} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              Visit · {format(parseISO(upcomingDate), "MMM d")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  masthead: {
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s5,
  },
  specTile: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    overflow: "hidden",
    marginBottom: theme.spacing.s4,
    ...theme.shadows.card,
  },
  specIconWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  name: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(30),
    lineHeight: fontScale(36),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  role: {
    ...theme.typography.body,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(14),
    marginTop: theme.spacing.s4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
}));
