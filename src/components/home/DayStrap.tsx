import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { format } from "date-fns";
import { fontScale, makeStyles, useTheme } from "@/theme";

/**
 * Tiny editorial strap that anchors every visit to home: weekday +
 * date in tiny ALL CAPS with a hairline rule extending to the right.
 * Sets the brand voice before the user reads anything else. Time
 * intentionally omitted — the device's status bar already shows it,
 * so duplicating it on every screen would just be noise.
 */
export const DayStrap: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const now = new Date();
  const dateLabel = format(now, "EEEE · MMM d").toUpperCase();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.text, { color: colors.textTertiary }]}>{dateLabel}</Text>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
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
    fontSize: fontScale(12),
    letterSpacing: 1.6,
  },
  rule: {
    flex: 1,
    height: 1,
  },
}));
