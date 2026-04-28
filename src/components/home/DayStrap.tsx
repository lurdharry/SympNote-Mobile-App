import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { format } from "date-fns";
import { fontScale, makeStyles, useTheme } from "@/theme";

/**
 * Tiny editorial strap that anchors every visit to home: weekday +
 * date in tiny ALL CAPS, a hairline rule below. Sets the brand voice
 * before the user reads anything else. No functional cost.
 */
export const DayStrap: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const now = new Date();
  const left = format(now, "EEEE · MMM d").toUpperCase();
  const right = format(now, "h:mm a").toLowerCase();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.text, { color: colors.textTertiary }]}>{left}</Text>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <Text style={[styles.text, { color: colors.textTertiary }]}>{right}</Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s3,
  },
  text: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.6,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
}));
