import React from "react";
import { Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, useTheme, verticalScale } from "@/theme";

/**
 * Teaching spotlight under the hold button on /onboarding/summary.
 * Shown until the user completes their first hold; auto-fades on the
 * way out so it doesn't compete with the recording overlay.
 */
export const TeachingTip: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Animated.View
      entering={FadeIn.duration(420).delay(180)}
      exiting={FadeOut.duration(180)}
      style={styles.wrap}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Press and hold the mic</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Release when you're done. Sympnote keeps it safe on your device.
      </Text>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    marginTop: verticalScale(28),
    alignItems: "center",
    paddingHorizontal: theme.spacing.s6,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: verticalScale(8),
  },
  hint: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
    textAlign: "center",
    marginTop: verticalScale(4),
    fontStyle: "italic",
    maxWidth: moderateScale(280),
  },
}));
