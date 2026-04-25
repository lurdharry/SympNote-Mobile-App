import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Monitor, Moon, Sun } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  useTheme,
  verticalScale,
} from "@/theme";
import { useProfileStore, type ThemePreference } from "@/stores/useProfileStore";
import { hapticLight } from "@/services/haptics";

/**
 * Segmented theme switcher: Auto · Light · Dark. The pill highlight
 * slides under the active segment with a 220ms timing so the change
 * feels physical rather than discrete.
 */

const SEGMENTS: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "auto", label: "Auto", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export const ThemeToggle: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const pref = useProfileStore((s) => s.themePreference);
  const setPref = useProfileStore((s) => s.setThemePreference);

  const activeIndex = SEGMENTS.findIndex((s) => s.value === pref);
  const safeIndex = activeIndex < 0 ? 0 : activeIndex;

  const indicatorPos = useSharedValue(safeIndex);
  useEffect(() => {
    indicatorPos.value = withTiming(safeIndex, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [safeIndex, indicatorPos]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${indicatorPos.value * 100}%` }],
  }));

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.bgMuted, borderColor: colors.border },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            width: `${100 / SEGMENTS.length}%`,
            backgroundColor: colors.bgSurface,
            ...shadows.card,
          },
          indicatorStyle,
        ]}
      />
      {SEGMENTS.map((seg) => {
        const active = seg.value === pref;
        return (
          <Pressable
            key={seg.value}
            onPress={() => {
              if (active) return;
              hapticLight();
              setPref(seg.value);
            }}
            style={styles.segment}
            accessibilityRole="button"
            accessibilityLabel={`${seg.label} theme`}
            accessibilityState={{ selected: active }}
          >
            <seg.Icon
              size={moderateScale(14)}
              color={active ? colors.accent : colors.textTertiary}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.label,
                { color: active ? colors.textPrimary : colors.textTertiary },
              ]}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    flexDirection: "row",
    height: verticalScale(40),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    position: "relative",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 999,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    zIndex: 1,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: 0.1,
  },
}));
