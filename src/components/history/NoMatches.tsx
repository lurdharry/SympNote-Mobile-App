import React from "react";
import { Text, View } from "react-native";
import { makeStyles, spacing, typography, useTheme, verticalScale } from "@/theme";
import { NoMatchesMascot } from "./NoMatchesMascot";

export const NoMatches: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.mascot}>
        <NoMatchesMascot />
      </View>
      <Text
        style={[
          typography.serifHeadline,
          { color: colors.textPrimary, fontFamily: "DMSans_600SemiBold" },
        ]}
      >
        No matches
      </Text>
      <Text style={[typography.bodyLarge, { color: colors.textTertiary, marginTop: 2 }]}>
        Try a different tag or search term
      </Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s8,
    alignItems: "center",
  },
  mascot: {
    marginBottom: verticalScale(8),
  },
}));
