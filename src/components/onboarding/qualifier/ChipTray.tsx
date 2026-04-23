import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { Option, QUALIFIER_TIMINGS } from "@/constants/onboarding";
import { hapticLight } from "@/services/haptics";

interface ChipTrayProps {
  options: Option[];
  disabled: boolean;
  /**
   * Single-select mode: tapping a chip fires `onAnswer` immediately.
   * Multi-select mode: tapping a chip toggles selection and a primary
   * "Done" button commits the full set.
   */
  multi?: boolean;
  /**
   * For multi-select: called with the full Option[] when the user
   * taps Done. For single-select: called with the Option the user
   * tapped. The screen's UserBubble + flow handles both shapes.
   */
  onAnswer: (answer: Option | Option[]) => void;
  /**
   * When provided, renders a "Skip" link below the chips. Advances
   * the flow without persisting an answer — the profile builder
   * falls back to a sensible default. Works in both modes.
   */
  onSkip?: () => void;
}

interface ChipProps {
  option: Option;
  index: number;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}

export const ChipTray: React.FC<ChipTrayProps> = ({
  options,
  onAnswer,
  disabled,
  multi = false,
  onSkip,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset when the question changes (options array identity flips).
  useEffect(() => {
    setSelected(new Set());
  }, [options]);

  const toggle = (opt: Option) => {
    hapticLight();
    if (!multi) {
      onAnswer(opt);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt.v)) next.delete(opt.v);
      else next.add(opt.v);
      return next;
    });
  };

  const submitMulti = () => {
    hapticLight();
    if (selected.size === 0) {
      // Multi with no picks → treat as skip.
      if (onSkip) onSkip();
      else onAnswer([]);
      return;
    }
    onAnswer(options.filter((o) => selected.has(o.v)));
  };

  const handleSkip = () => {
    hapticLight();
    onSkip?.();
  };

  return (
    <View style={{ gap: moderateScale(10) }}>
      <View style={styles.wrap}>
        {options.map((opt, i) => (
          <Chip
            key={opt.v}
            option={opt}
            index={i}
            disabled={disabled}
            selected={multi && selected.has(opt.v)}
            onPress={() => toggle(opt)}
          />
        ))}
      </View>

      {multi && (
        <View style={styles.multiActions}>
          <Pressable
            onPress={submitMulti}
            disabled={disabled}
            style={[
              styles.doneBtn,
              { backgroundColor: colors.accent, opacity: disabled ? 0.4 : 1 },
            ]}
          >
            <Text style={styles.doneLabel}>
              {selected.size === 0
                ? 'Skip'
                : selected.size === 1
                  ? 'Continue · 1 selected'
                  : `Continue · ${selected.size} selected`}
            </Text>
          </Pressable>
        </View>
      )}

      {!multi && onSkip && (
        <View style={styles.skipWrap}>
          <Pressable onPress={handleSkip} hitSlop={8} disabled={disabled}>
            <Text style={[styles.skipLink, { color: colors.textTertiary }]}>
              Skip
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const Chip: React.FC<ChipProps> = ({ option, index, disabled, selected, onPress }) => {
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
            backgroundColor: selected ? tint + '12' : colors.bgSurface,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={option.t}
        accessibilityState={{ selected }}
      >
        {Icon && (
          <View style={[styles.iconTile, { backgroundColor: tint + "22" }]}>
            {selected ? (
              <Check size={moderateScale(14)} color={tint} strokeWidth={2.6} />
            ) : (
              <Icon size={moderateScale(14)} color={tint} strokeWidth={2.4} />
            )}
          </View>
        )}
        <Text style={styles.label}>{option.t}</Text>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
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
    paddingLeft: scale(10),
    paddingRight: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.full,
    ...theme.shadows.card,
  },
  iconTile: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
  },
  multiActions: {
    paddingTop: moderateScale(6),
    alignItems: "center",
  },
  doneBtn: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
  },
  doneLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(14),
    letterSpacing: -0.1,
  },
  skipWrap: {
    alignItems: "center",
    paddingTop: moderateScale(4),
  },
  skipLink: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    textDecorationLine: "underline",
  },
}));
