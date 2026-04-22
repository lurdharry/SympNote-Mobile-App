import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  delay?: number;
  playing?: boolean;
};

export function AnimatedCheckmark({
  size = 28,
  color = '#2C6E6B',
  strokeWidth = 3,
  delay = 0,
  playing = true,
}: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!playing) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reduced ? 180 : 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [playing, reduced, progress]);

  // Delay-aware end value so the component reacts on mount.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      progress.value = withTiming(1, {
        duration: reduced ? 180 : 450,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(id);
  }, [delay, playing, reduced, progress]);

  const end = useDerivedValue(() => progress.value);

  const path = Skia.Path.Make();
  path.moveTo(size * 0.22, size * 0.52);
  path.lineTo(size * 0.44, size * 0.74);
  path.lineTo(size * 0.8, size * 0.28);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeJoin="round"
          strokeCap="round"
          start={0}
          end={end}
        />
      </Canvas>
    </View>
  );
}
