import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import {
  SharedValue,
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  /**
   * Current meter level 0..1. Accepts either a plain number (will cause a
   * parent re-render on every change) or a SharedValue<number> (preferred —
   * updates stay off the JS thread, so recording doesn't re-render the
   * screen 16x/sec).
   */
  level: number | SharedValue<number>;
  width: number;
  height: number;
  barCount?: number;
  colors?: [string, string];
  active?: boolean;
};

function isSharedValue(v: unknown): v is SharedValue<number> {
  return typeof v === 'object' && v !== null && 'value' in (v as object);
}

/**
 * Real-time amplitude bars. Keeps a rolling history that's read off a
 * shared value when provided, so the parent doesn't re-render on every
 * meter update.
 */
export const WaveformCanvas: React.FC<Props> = ({
  level,
  width,
  height,
  barCount = 26,
  colors = ['#E08B3F', 'rgba(224,139,63,0)'],
  active = true,
}) => {
  const reduced = useReducedMotion();
  const history = useRef<number[]>(new Array(barCount).fill(0.05)).current;
  const version = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const current = isSharedValue(level) ? level.value : level;
      history.shift();
      const jitter = reduced ? 0 : (Math.random() - 0.5) * 0.08;
      history.push(Math.max(0.05, Math.min(1, current + jitter)));
      version.value = version.value + 1;
    }, 60);
    return () => clearInterval(id);
    // `level` object identity is stable for SharedValues; plain numbers
    // refresh the closure on change, which is fine.
  }, [level, active, reduced, history, version]);

  const barWidth = (width - (barCount - 1) * 4) / barCount;
  const centerY = height / 2;

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={colors}
          />
          {history.map((_, i) => (
            <Bar
              key={i}
              index={i}
              barWidth={barWidth}
              centerY={centerY}
              height={height}
              history={history}
              version={version}
              reduced={reduced}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

type BarProps = {
  index: number;
  barWidth: number;
  centerY: number;
  height: number;
  history: number[];
  version: SharedValue<number>;
  reduced: boolean;
};

const Bar: React.FC<BarProps> = ({ index, barWidth, centerY, height, history, version, reduced }) => {
  const target = useSharedValue(0.05);

  // Read `version` so reactively we retrigger when the history is updated.
  useDerivedValue(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    version.value;
    return 0;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const v = history[index] ?? 0.05;
      if (reduced) {
        target.value = v;
      } else {
        target.value = withTiming(v, { duration: 90, easing: Easing.out(Easing.quad) });
      }
    }, 60);
    return () => clearInterval(id);
  }, [index, history, reduced, target]);

  const h = useDerivedValue(() => Math.max(4, target.value * (height - 8)));
  const y = useDerivedValue(() => centerY - h.value / 2);
  const x = index * (barWidth + 4);

  return (
    <RoundedRect
      x={x}
      y={y}
      width={barWidth}
      height={h}
      r={barWidth / 2}
    />
  );
}
