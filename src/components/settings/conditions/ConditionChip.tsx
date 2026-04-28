import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Check, X } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";

interface ConditionChipProps {
  label: string;
  active: boolean;
  /** True when the chip backs a `custom:`-prefixed value — adds an
   *  inline X button so the user can drop their own additions. */
  custom: boolean;
  onPress: () => void;
}

/**
 * Single toggle chip in the inline conditions editor on Settings.
 * Active state shows a leading check + accent fill; custom-added
 * conditions also surface a small X to remove them on press.
 */
export const ConditionChip: React.FC<ConditionChipProps> = ({ label, active, custom, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent + "16" : colors.bgMuted,
          borderColor: active ? colors.accent : colors.border,
          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {active && <Check size={moderateScale(12)} color={colors.accent} strokeWidth={2.6} />}
      <Text
        style={[styles.label, { color: active ? colors.accent : colors.textPrimary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {active && custom && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onPress();
          }}
          hitSlop={6}
          style={[styles.removeBtn, { backgroundColor: colors.accent + "22" }]}
        >
          <X size={moderateScale(10)} color={colors.accent} strokeWidth={2.4} />
        </Pressable>
      )}
    </Pressable>
  );
};

const useStyles = makeStyles(() => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderRadius: 999,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
    maxWidth: moderateScale(170),
  },
  removeBtn: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(2),
  },
}));
