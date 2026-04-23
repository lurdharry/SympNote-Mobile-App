import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, useTheme } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface OnboardingProgressProps {
  /**
   * Fraction of progress through the setup phase, 0..1. Only the
   * answer-gathering screens (Questions, Focus, Care Team, First
   * Recording) render this. Summary and Paywall intentionally omit it
   * so the user doesn't read "100%" right before the commit moment.
   */
  value: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ value }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const fill = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, value));
    if (reduced) {
      fill.value = clamped;
      return;
    }
    fill.value = withDelay(
      120,
      withTiming(clamped, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
  }, [value, reduced, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: colors.accent }, fillStyle]}
      />
    </View>
  );
};

const useStyles = makeStyles(() => ({
  track: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
}));
