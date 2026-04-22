import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Confetti burst. Mount with `show=true` at the celebration moment;
 * each of N pieces flies outward on a randomized trajectory over
 * 1400ms, then settles. Shapes alternate circle / rounded square /
 * sharp square. Colors pull from the handoff palette.
 */

type Piece = {
  dx: number;
  dy: number;
  rot: number;
  size: number;
  delay: number;
  color: string;
  shape: 'circle' | 'rounded' | 'square';
};

type Props = {
  show: boolean;
  count?: number;
};

const COLORS = ['#2C6E6B', '#F6C06A', '#5A8F6E', '#A8C4C2', '#E07A5F'];

export function Confetti({ show, count = 32 }: Props) {
  const reduced = useReducedMotion();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 120;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          rot: Math.random() * 540 - 270,
          size: 6 + Math.random() * 8,
          delay: Math.random() * 120,
          color: COLORS[i % COLORS.length]!,
          shape: ['circle', 'rounded', 'square'][i % 3] as Piece['shape'],
        };
      }),
    [count]
  );

  if (!show || reduced) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p, i) => (
        <Piece key={i} piece={p} />
      ))}
    </View>
  );
}

function Piece({ piece }: { piece: Piece }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withTiming(1, {
        duration: 1400,
        easing: Easing.bezier(0.2, 0.7, 0.3, 1),
      })
    );
  }, [t, piece.delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.dx * t.value },
      { translateY: piece.dy * t.value },
      { rotate: `${piece.rot * t.value}deg` },
    ],
    opacity: t.value < 0.85 ? 1 : Math.max(0, 1 - (t.value - 0.85) * 6.6),
  }));

  const radius =
    piece.shape === 'circle'
      ? piece.size / 2
      : piece.shape === 'rounded'
      ? 2
      : 0;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -piece.size / 2,
          marginTop: -piece.size / 2,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          borderRadius: radius,
        },
        style,
      ]}
    />
  );
}
