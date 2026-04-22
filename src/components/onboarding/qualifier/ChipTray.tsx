import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, useTheme } from '../../../theme';
import { Option, QUALIFIER_TIMINGS } from '../../../constants/onboarding';

type Props = {
  options: Option[];
  onAnswer: (o: Option) => void;
  disabled: boolean;
};

/**
 * Row of answer chips with a tinted icon tile, staggered entrance,
 * and a spring-scale press state. Each chip feels like a small card
 * rather than a flat pill.
 */
export function ChipTray({ options, onAnswer, disabled }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {options.map((opt, i) => (
        <Chip
          key={opt.v}
          option={opt}
          index={i}
          disabled={disabled}
          onPress={() => onAnswer(opt)}
        />
      ))}
    </View>
  );
}

function Chip({
  option,
  index,
  disabled,
  onPress,
}: {
  option: Option;
  index: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  const tint = option.tint ?? colors.accent;

  // Entrance animation.
  const entryOpacity = useSharedValue(0);
  const entryTy = useSharedValue(10);
  useEffect(() => {
    const delay = index * QUALIFIER_TIMINGS.chipStaggerMs;
    entryOpacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: QUALIFIER_TIMINGS.chipDurationMs,
        easing: Easing.out(Easing.cubic),
      })
    );
    entryTy.value = withDelay(
      delay,
      withSpring(0, { damping: 18, stiffness: 160 })
    );
  }, [index, entryOpacity, entryTy]);

  // Press animation — scale + glow that persists briefly on release.
  const press = useSharedValue(0);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [
      { translateY: entryTy.value },
      { scale: 1 - press.value * 0.04 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: press.value * 0.45,
  }));

  const { Icon } = option;

  return (
    <Animated.View style={[styles.outer, outerStyle]}>
      {/* Soft accent glow under the chip — fades in on press. */}
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
            borderColor: pressed ? tint : colors.border,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={option.t}
      >
        {Icon && (
          <View
            style={[
              styles.iconTile,
              { backgroundColor: tint + '22' },
            ]}
          >
            <Icon size={14} color={tint} strokeWidth={2.4} />
          </View>
        )}
        <Text style={styles.label}>{option.t}</Text>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outer: {
    // Host for the press glow and the chip together.
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: theme.radius.full,
    // Soft blurred halo simulated with a slightly larger tinted rect.
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    // Subtle resting shadow so chips read as cards, not labels.
    ...theme.shadows.card,
  },
  iconTile: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
}));
