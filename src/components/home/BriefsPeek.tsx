import React from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";

interface BriefsPeekProps {
  /** Number of recordings that haven't been included in any brief yet. */
  unbriefedCount: number;
  onPress: () => void;
}

/**
 * Inline status pill on the home tab — surfaces "N notes ready to
 * brief" when there's pending un-briefed work and routes to the
 * Briefs tab on tap. Hidden when the count is zero.
 */
export const BriefsPeek: React.FC<BriefsPeekProps> = ({ unbriefedCount, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (unbriefedCount <= 0) return null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: colors.accent + "12", borderColor: colors.accent + "55" },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Generate brief from new notes"
    >
      <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
      <Text style={[styles.text, { color: colors.accent }]}>
        {unbriefedCount} {unbriefedCount === 1 ? "note" : "notes"} ready to brief
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.cta, { color: colors.accent }]}>Open Briefs ›</Text>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(11),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: theme.spacing.s4,
  },
  text: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
  cta: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
}));
