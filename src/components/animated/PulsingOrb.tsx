import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type RingProps = {
  cx: number;
  cy: number;
  size: number;
  color: string;
  offset: number;
  reduced: boolean;
};

const Ring: React.FC<RingProps> = ({ cx, cy, size, color, offset, reduced }) => {
  const rp = useSharedValue(offset);
  useEffect(() => {
    if (reduced) return;
    rp.value = withRepeat(
      withTiming(offset + 1, {
        duration: 2400,
        easing: Easing.out(Easing.quad),
      }),
      -1,
      false
    );
  }, [offset, reduced, rp]);

  const r = useDerivedValue(() => {
    const phase = rp.value % 1;
    return size / 2.4 + phase * (size / 2);
  });
  const op = useDerivedValue(() => {
    const phase = rp.value % 1;
    return Math.max(0, 0.35 - phase * 0.35);
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      color={color}
      opacity={op}
      style="stroke"
      strokeWidth={2}
    />
  );
}

type Props = {
  size?: number;
  colors?: string[];
  ringCount?: number;
};

export const PulsingOrb: React.FC<Props> = ({
  size = 220,
  colors = ['#A8C4C2', '#3E8580', '#2C6E6B'],
  ringCount = 3,
}) => {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduced, t]);

  const core = useDerivedValue(() => size / 2.6 + t.value * 8);
  const cx = size / 2;
  const cy = size / 2;
  const ringColor = colors[colors.length - 1] ?? '#2C6E6B';

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {Array.from({ length: ringCount }).map((_, i) => (
            <Ring
              key={`ring-${i}`}
              cx={cx}
              cy={cy}
              size={size}
              color={ringColor}
              offset={i / ringCount}
              reduced={reduced}
            />
          ))}
          <Circle cx={cx} cy={cy} r={core}>
            <RadialGradient c={vec(cx, cy)} r={size / 2} colors={colors} />
            <BlurMask blur={12} style="solid" />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}
