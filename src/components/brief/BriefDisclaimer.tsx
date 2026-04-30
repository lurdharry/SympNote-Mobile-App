import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";

/**
 * Inline disclaimer rendered at the bottom of every brief. Required
 * by App Review for medical-adjacent surfaces — App Store reviewers
 * specifically check that AI-organized health content carries a
 * visible "not medical advice" reminder, not buried in a Settings
 * page or Terms link.
 *
 * Tone is intentionally quiet — a hairline divider above and a
 * single muted line below. Loud enough to be reviewer-spotted, calm
 * enough not to undercut the brief's clinical-confident voice.
 */
export const BriefDisclaimer: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.body, { color: colors.textTertiary }]}>
        Not medical advice. Sympnote organizes your notes; confirm any decisions with your doctor.
      </Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    marginTop: moderateScale(20),
    paddingTop: moderateScale(16),
    alignItems: "center",
  },
  divider: {
    width: moderateScale(40),
    height: StyleSheet.hairlineWidth,
    marginBottom: moderateScale(12),
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(11),
    lineHeight: fontScale(16),
    textAlign: "center",
    paddingHorizontal: moderateScale(8),
    fontStyle: "italic",
  },
}));
