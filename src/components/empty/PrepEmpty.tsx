import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Canvas, Circle, Skia, Path } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fontScale, makeStyles, moderateScale, scale, useTheme } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Prep empty state — a minimal 5×4 calendar grid where one date gets
 * circled with a hand-drawn accent stroke animation.
 */
export function PrepEmpty() {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const cols = 5;
  const rows = 4;
  const dotR = moderateScale(3);
  const gap = moderateScale(22);
  const width = cols * gap + gap;
  const height = rows * gap + gap;

  const targetCol = 2;
  const targetRow = 2;
  const targetX = gap + targetCol * gap;
  const targetY = gap + targetRow * gap;

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
    const rx = dotR * 3.4;
    const ry = dotR * 3.0;
    const steps = 64;
    const startAngle = -Math.PI / 2 + 0.35;
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (i / steps) * Math.PI * 2;
      const jitter = Math.sin(i * 1.9) * 0.6;
      const x = targetX + Math.cos(a) * (rx + jitter);
      const y = targetY + Math.sin(a) * (ry + jitter);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  });

  const end = useDerivedValue(() => draw.value);

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
        <Path
          path={circlePath}
          color={colors.accent}
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          start={0}
          end={end}
        />
        <Circle cx={targetX} cy={targetY} r={dotR} color={colors.accent} />
      </Canvas>

      <Text style={styles.headline}>No visits yet.</Text>
      <Text style={styles.caption}>
        Add a doctor's appointment below and I'll start building your summary
        as you log symptoms.
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s10,
  },
  headline: {
    ...theme.typography.serifHeadline,
    color: theme.colors.textPrimary,
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
    marginTop: theme.spacing.s5,
    textAlign: 'center',
  },
  caption: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.s2,
    textAlign: 'center',
    maxWidth: scale(280),
  },
}));
