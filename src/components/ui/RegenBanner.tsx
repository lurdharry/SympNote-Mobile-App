import React from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, useTheme, verticalScale } from "@/theme";

interface RegenBannerProps {
  /** Render only when true. Mount/unmount drives the slide-in / out. */
  visible: boolean;
  /** Status copy. Defaults to "Regenerating…" — pages should pass
   *  what they're actually doing ("Re-extracting…", "Generating…"). */
  label?: string;
  /** Color tier. Default `accent`; `coral` for failure-recovery
   *  surfaces if you need to distinguish them. */
  tone?: "accent" | "coral";
}

/**
 * Inline status banner used while an async regenerate / refresh is
 * in flight. Renders flush below the top bar so the user sees
 * ongoing work without losing existing content underneath.
 */
export const RegenBanner: React.FC<RegenBannerProps> = ({
  visible,
  label = "Regenerating…",
  tone = "accent",
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (!visible) return null;
  const tint = tone === "coral" ? colors.coral : colors.accent;
  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      style={[
        styles.banner,
        { backgroundColor: tint + "14", borderBottomColor: tint + "33" },
      ]}
    >
      <ActivityIndicator size="small" color={tint} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: verticalScale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.1,
  },
}));
