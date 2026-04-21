import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme, radius } from '../../theme';

type Props = {
  total: number;
  current: number; // 0..total
  height?: number;
};

export function ProgressBar({ total, current, height = 4 }: Props) {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    const target = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;
    progress.value = reduced
      ? withTiming(target, { duration: 200 })
      : withSpring(target, { damping: 18, stiffness: 120 });
  }, [current, total, progress, reduced]);

  useEffect(() => {
    if (reduced) return;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [reduced, shimmer]);

  const fill = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: -120 + shimmer.value * 240 }],
    opacity: 0.55,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: colors.bgMuted, borderRadius: height / 2 },
      ]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: colors.accent, borderRadius: height / 2 }, fill]}>
        {!reduced && (
          <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
});
