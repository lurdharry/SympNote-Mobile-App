import React from "react";
import { Text, View } from "react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import { BriefMascot } from "../briefs/BriefMascot";

/**
 * Recovery state on /clinician/[id] when no briefs feed this clinician
 * yet — neither tagged nor "Everyone." Encourages the user toward the
 * Compose CTA above without duplicating its action.
 */
export const ClinicianBriefsEmpty: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.empty}>
      <View style={styles.mascotSlot}>
        <BriefMascot size={moderateScale(120)} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>No briefs yet</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Tap "Compose a brief" above to synthesise your latest notes tagged for this
        clinician — or generate without tagging from the Briefs tab.
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  empty: {
    alignItems: "center",
    paddingTop: theme.spacing.s8,
    paddingHorizontal: theme.spacing.s6,
  },
  mascotSlot: {
    width: moderateScale(120),
    height: moderateScale(120),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s3,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
  },
  sub: {
    ...theme.typography.body,
    textAlign: "center",
    marginTop: theme.spacing.s2,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    maxWidth: moderateScale(320),
  },
}));
