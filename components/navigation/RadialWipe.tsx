import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useTransition } from './TransitionContext';
import { hapticHeavy } from '../../services/haptics';

/**
 * Full-screen radial wipe mask. Rendered at the app root and toggled
 * via TransitionContext. Expands a Skia circle from a given point
 * and fires a haptic at midpoint.
 */
export function RadialWipe() {
  const { colors } = useTheme();
  const { wipeActive, _wipeCenter } = useTransition();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const maxR = Math.hypot(width, height);

  useEffect(() => {
    if (!wipeActive) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 600, easing: Easing.inOut(Easing.cubic) },
      () => {
        runOnJS(hapticHeavy)();
      }
    );
    // Midpoint haptic
    const mid = setTimeout(hapticHeavy, 280);
    return () => clearTimeout(mid);
  }, [wipeActive, progress]);

  const r = useDerivedValue(() => progress.value * maxR);
  const op = useDerivedValue(() =>
    progress.value < 0.5 ? progress.value * 2 : 1 - (progress.value - 0.5) * 2
  );

  if (!wipeActive) return null;

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Group opacity={op}>
        <Circle cx={_wipeCenter.x || width / 2} cy={_wipeCenter.y || height / 2} r={r} color={colors.accent} />
      </Group>
    </Canvas>
  );
}
