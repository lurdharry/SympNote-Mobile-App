import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Canvas, Path, Skia, useClock } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, spacing, typography } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * History empty state — a quiet, gently-rippling voiceprint line that
 * fades toward the right edge, suggesting the space where recordings
 * will eventually live.
 */
export function HistoryEmpty() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const clock = useClock();

  const width = 280;
  const height = 80;

  // Pulled into a derived path so it updates at display refresh off the
  // JS thread.
  const linePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const steps = 80;
    const t = reduced ? 0 : clock.value / 900;
    p.moveTo(0, height / 2);
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * width;
      // Amplitude envelope — tall near the left, tapering to nothing on
      // the right so the line feels like it's "trailing off."
      const envelope = Math.pow(1 - i / steps, 1.6);
      // Three phase-shifted sine waves for organic feel.
      const amp = height * 0.28 * envelope;
      const y =
        height / 2 +
        Math.sin(t + i * 0.18) * amp +
        Math.sin(t * 1.7 + i * 0.43) * amp * 0.35;
      p.lineTo(x, y);
    }
    return p;
  });

  // Fade-in on mount.
  const fadeIn = useSharedValue(0);
  useEffect(() => {
    fadeIn.value = withDelay(
      120,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })
    );
  }, [fadeIn]);
  const wrapStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <Canvas style={{ width, height }}>
        <Path
          path={linePath}
          color={colors.accent}
          style="stroke"
          strokeWidth={1.5}
          strokeCap="round"
          strokeJoin="round"
        />
      </Canvas>
      <Text
        style={[
          typography.serifHeadline,
          {
            color: colors.textPrimary,
            fontSize: 22,
            lineHeight: 28,
            marginTop: spacing.s5,
            textAlign: 'center',
          },
        ]}
      >
        Nothing yet.
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            marginTop: spacing.s2,
            textAlign: 'center',
            maxWidth: 280,
          },
        ]}
      >
        Every recording you make will show up here — in your own words,
        organized.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s12,
  },
});
