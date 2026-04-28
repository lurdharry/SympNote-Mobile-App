import React from "react";
import { Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
} from "@/theme";

interface CustomChipStackProps {
  /** "custom:" prefixed values stored in the picker state. */
  values: string[];
  onRemove: (value: string) => void;
}

const stripPrefix = (value: string): string =>
  value.startsWith("custom:") ? value.slice("custom:".length) : value;

/**
 * Wrap-row of removable chips for user-added conditions. Each chip
 * shows the user's typed label plus a coral X to drop it. Renders
 * nothing when the user hasn't added any customs.
 */
export const CustomChipStack: React.FC<CustomChipStackProps> = ({ values, onRemove }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (values.length === 0) return null;

  return (
    <View style={styles.stack}>
      {values.map((value) => (
        <Pressable
          key={value}
          onPress={() => onRemove(value)}
          style={[
            styles.chip,
            { backgroundColor: colors.accent + "12", borderColor: colors.accent },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${stripPrefix(value)}`}
        >
          <Text style={[styles.chipText, { color: colors.accent }]} numberOfLines={1}>
            {stripPrefix(value)}
          </Text>
          <View style={[styles.remove, { backgroundColor: colors.accent }]}>
            <X size={moderateScale(11)} color="#FFFFFF" strokeWidth={3} />
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  stack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    marginTop: theme.spacing.s4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(12),
    paddingRight: moderateScale(6),
    paddingVertical: moderateScale(6),
    borderRadius: theme.radius.full,
    borderWidth: 1.2,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
    maxWidth: scale(160),
  },
  remove: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
}));
