import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Canvas, Path, Skia, useClock } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fontScale, makeStyles, scale, useTheme, verticalScale } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * History empty state — a quiet, gently-rippling voiceprint line that
 * fades toward the right edge, suggesting the space where recordings
 * will eventually live.
 */
export const HistoryEmpty: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const clock = useClock();

  const width = scale(280);
  const height = verticalScale(80);

  const linePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const steps = 80;
    const t = reduced ? 0 : clock.value / 900;
    p.moveTo(0, height / 2);
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * width;
      const envelope = Math.pow(1 - i / steps, 1.6);
      const amp = height * 0.28 * envelope;
      const y =
        height / 2 +
        Math.sin(t + i * 0.18) * amp +
        Math.sin(t * 1.7 + i * 0.43) * amp * 0.35;
      p.lineTo(x, y);
    }
    return p;
  });

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
      <Text style={styles.headline}>Nothing yet.</Text>
      <Text style={styles.caption}>
        Every recording you make will show up here — in your own words,
        organized.
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s12,
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
