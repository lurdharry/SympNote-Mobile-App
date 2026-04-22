import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  width: number;
  height: number;
  count?: number;
  color?: string;
  direction?: 'up' | 'down' | 'inward';
  speed?: number; // ms per full drift
};

type Particle = {
  baseX: number;
  baseY: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
  swayAmp: number;
};

export const ParticleField: React.FC<Props> = ({
  width,
  height,
  count = 20,
  color = '#A8C4C2',
  direction = 'up',
  speed = 9000,
}) => {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, () => ({
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        radius: 1 + Math.random() * 2.2,
        opacity: 0.2 + Math.random() * 0.5,
        phase: Math.random(),
        speed: 0.7 + Math.random() * 0.6,
        swayAmp: 8 + Math.random() * 18,
      })),
    [count, width, height]
  );

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [reduced, speed, t]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Group>
        {particles.map((p, i) => (
          <Particle
            key={i}
            p={p}
            t={t}
            width={width}
            height={height}
            color={color}
            direction={direction}
          />
        ))}
      </Group>
    </Canvas>
  );
}

type PProps = {
  p: Particle;
  t: ReturnType<typeof useSharedValue<number>>;
  width: number;
  height: number;
  color: string;
  direction: 'up' | 'down' | 'inward';
};

const Particle: React.FC<PProps> = ({ p, t, width, height, color, direction }) => {
  const cx = useDerivedValue(() => {
    if (direction === 'inward') {
      const progress = (t.value * p.speed + p.phase) % 1;
      return p.baseX + (width / 2 - p.baseX) * progress;
    }
    const sway = Math.sin((t.value + p.phase) * Math.PI * 2) * p.swayAmp;
    return p.baseX + sway;
  });
  const cy = useDerivedValue(() => {
    const progress = (t.value * p.speed + p.phase) % 1;
    if (direction === 'inward') {
      return p.baseY + (height / 2 - p.baseY) * progress;
    }
    const drift = direction === 'up' ? -progress : progress;
    return (p.baseY + drift * height + height) % height;
  });

  return <Circle cx={cx} cy={cy} r={p.radius} color={color} opacity={p.opacity} />;
}
