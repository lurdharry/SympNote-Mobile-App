import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  word: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay?: number;
  duration?: number;
  color: string;
  fontSize?: number;
  onLand?: () => void;
  textStyle?: TextStyle;
};

/**
 * Detaches a word and arcs it to a target position using a parabolic path.
 * Scale and rotation animate during flight; onLand fires when settled.
 */
export function FlyingWord({
  word,
  from,
  to,
  delay = 0,
  duration = 900,
  color,
  fontSize = 15,
  onLand,
  textStyle,
}: Props) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withTiming(
        1,
        { duration: reduced ? 220 : duration, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (finished && onLand) runOnJS(onLand)();
        }
      )
    );
  }, [t, delay, duration, reduced, onLand]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    const x = from.x + (to.x - from.x) * p;
    const y = from.y + (to.y - from.y) * p;
    // Parabolic arc: lift the midpoint above the straight line by 60px.
    const arcLift = reduced ? 0 : -60 * Math.sin(Math.PI * p);
    const rot = reduced ? 0 : (p - 0.5) * 24;
    const scale = reduced
      ? 0.95 + p * 0.05
      : 1 + 0.3 * Math.sin(Math.PI * p);
    const opacity = p < 0.9 ? 1 : Math.max(0, 1 - (p - 0.9) * 10);
    return {
      transform: [
        { translateX: x },
        { translateY: y + arcLift },
        { rotateZ: `${rot}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.abs, style]} pointerEvents="none">
      <Text
        style={[
          {
            color,
            fontFamily: 'DMSans_600SemiBold',
            fontSize,
          },
          textStyle,
        ]}
      >
        {word}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
});
