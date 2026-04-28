import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fontScale, makeStyles, moderateScale, scale, useTheme, verticalScale } from "@/theme";
import { Option, QUALIFIER_TIMINGS } from "@/constants/onboarding";

interface ChipProps {
  option: Option;
  index: number;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}

/**
 * Single qualifier chip — staggered entry on mount, press scale +
 * accent glow, optional bespoke tint per option. Used inside ChipTray
 * for both single-select (tap fires answer) and multi-select (tap
 * toggles a parent-owned set) modes.
 */
export const Chip: React.FC<ChipProps> = ({ option, index, disabled, selected, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const tint = option.tint ?? colors.accent;

  const entryOpacity = useSharedValue(0);
  const entryTy = useSharedValue(10);
  useEffect(() => {
    const delay = index * QUALIFIER_TIMINGS.chipStaggerMs;
    entryOpacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: QUALIFIER_TIMINGS.chipDurationMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
    entryTy.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 160 }));
  }, [index, entryOpacity, entryTy]);

  const press = useSharedValue(0);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryTy.value }, { scale: 1 - press.value * 0.04 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: selected ? 0.3 : press.value * 0.45,
  }));

  const { Icon } = option;

  return (
    <Animated.View style={[styles.outer, outerStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: tint }, glowStyle]}
      />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          press.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          press.value = withTiming(0, { duration: 220 });
        }}
        style={({ pressed }) => [
          styles.chip,
          {
            borderColor: selected || pressed ? tint : colors.border,
            borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
            backgroundColor: selected ? tint + "12" : colors.bgSurface,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
      >
        {Icon && (
          <View style={[styles.iconTile, { backgroundColor: tint + "22" }]}>
            <Icon size={moderateScale(12)} color={tint} strokeWidth={2.4} />
          </View>
        )}
        <Text style={styles.label}>{option.t}</Text>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  outer: {
    position: "relative",
  },
  glow: {
    position: "absolute",
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: theme.radius.full,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingLeft: scale(8),
    paddingRight: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    ...theme.shadows.card,
  },
  iconTile: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
  },
}));
