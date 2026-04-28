import React from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";

interface ClinicianGenerateCTAProps {
  clinicianName: string;
  unbriefedCount: number;
  onPress: () => void;
}

/**
 * Accent-tinted "Compose a brief" card under the masthead. Subtitle
 * surfaces the unbriefed-note count so the user has a concrete signal
 * for whether there's anything new to synthesise.
 */
export const ClinicianGenerateCTA: React.FC<ClinicianGenerateCTAProps> = ({
  clinicianName,
  unbriefedCount,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.accent + "12", borderColor: colors.accent + "55" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Compose a brief for ${clinicianName}`}
    >
      <Sparkles size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.accent }]}>Compose a brief</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {unbriefedCount > 0
            ? `${unbriefedCount} ${unbriefedCount === 1 ? "note" : "notes"} not yet briefed — pick which go in.`
            : `Pick the notes to synthesise.`}
        </Text>
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
  sub: {
    ...theme.typography.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 2,
  },
}));
