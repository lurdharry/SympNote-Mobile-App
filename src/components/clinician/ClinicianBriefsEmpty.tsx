import React from "react";
import { Text, View } from "react-native";
import { FileText } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";

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
      <View style={[styles.icon, { backgroundColor: colors.accent + "1A" }]}>
        <FileText size={moderateScale(28)} color={colors.accent} strokeWidth={2} />
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
  icon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s4,
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
