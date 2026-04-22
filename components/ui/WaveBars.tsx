import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Decorative wave bars used on the recording screen while "listening".
 * Each bar oscillates scaleY from 0.3→1 with a stagger so the row reads
 * like a live audio visualization even when we don't have real metering.
 *
 * For a data-driven waveform bound to the mic amplitude, use
 * `components/animated/WaveformCanvas`.
 */
type Props = {
  count?: number;
  width?: number;
  heights?: number[]; // optional predefined height pattern
  colors?: [string, string];
};

export function WaveBars({
  count = 28,
  width = 3,
  colors = ['#F5B873', '#C97A1E'],
}: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <Bar key={i} i={i} width={width} colors={colors} />
      ))}
    </View>
  );
}

function Bar({
  i,
  width,
  colors,
}: {
  i: number;
  width: number;
  colors: [string, string];
}) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0.3);
  useEffect(() => {
    if (reduced) return;
    const duration = 800 + (i % 3) * 150;
    t.value = withDelay(
      (i * 70) % 900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [i, reduced, t]);

  const h = 10 + (i * 7) % 28;
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: t.value }],
  }));

  return (
    <View style={[styles.barWrap, { height: h, width, marginHorizontal: 1 }]}>
      <Animated.View
        style={[
          styles.bar,
          { width, height: h, borderRadius: width / 2 },
          style,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
  },
  barWrap: {
    justifyContent: 'flex-end',
  },
  bar: {
    overflow: 'hidden',
  },
});
