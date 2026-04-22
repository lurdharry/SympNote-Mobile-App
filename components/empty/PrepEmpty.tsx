import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Canvas, Circle, Skia, Path } from '@shopify/react-native-skia';
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
 * Prep empty state — a minimal 5×4 calendar grid where one date gets
 * circled with a hand-drawn accent stroke animation, telling the user
 * "this is where a date will go once you add one."
 */
export function PrepEmpty() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const cols = 5;
  const rows = 4;
  const dotR = 3;
  const gap = 22;
  const width = cols * gap + gap;
  const height = rows * gap + gap;

  // Where the "circled" date sits — third row, third column.
  const targetCol = 2;
  const targetRow = 2;
  const targetX = gap + targetCol * gap;
  const targetY = gap + targetRow * gap;

  // Stroke-draw progress for the hand-drawn circle.
  const draw = useSharedValue(0);

  useEffect(() => {
    draw.value = withDelay(
      400,
      withTiming(1, {
        duration: reduced ? 320 : 900,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [draw, reduced]);

  const circlePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    // Slightly oval, off-axis "circle" — hand-drawn feel.
    const rx = dotR * 3.4;
    const ry = dotR * 3.0;
    const steps = 64;
    const startAngle = -Math.PI / 2 + 0.35; // start upper-right
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (i / steps) * Math.PI * 2;
      // Tiny radial jitter for pencil feel (deterministic via sin).
      const jitter = Math.sin(i * 1.9) * 0.6;
      const x = targetX + Math.cos(a) * (rx + jitter);
      const y = targetY + Math.sin(a) * (ry + jitter);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  });

  const end = useDerivedValue(() => draw.value);

  // Content fade-in.
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      120,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
  }, [opacity]);
  const wrapStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <Canvas style={{ width, height }}>
        {/* Grid of dots — the "empty calendar". */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => (
            <Circle
              key={`${r}-${c}`}
              cx={gap + c * gap}
              cy={gap + r * gap}
              r={dotR}
              color={colors.border}
            />
          ))
        )}
        {/* The hand-drawn accent circle animating in. */}
        <Path
          path={circlePath}
          color={colors.accent}
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          start={0}
          end={end}
        />
        {/* The circled day itself gets an accent dot. */}
        <Circle cx={targetX} cy={targetY} r={dotR} color={colors.accent} />
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
        No visits yet.
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
        Add a doctor's appointment below and I'll start building your summary
        as you log symptoms.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s10,
  },
});
