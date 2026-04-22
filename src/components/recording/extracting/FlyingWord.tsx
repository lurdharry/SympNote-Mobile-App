import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fontScale, scale, useTheme, verticalScale } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Flight } from '@/hooks/useExtractLayout';

interface FlyingWordProps {
  flight: Flight;
  onLand: () => void;
}

const DURATION_MS = 850;
const REDUCED_DURATION_MS = 260;

export const FlyingWord: React.FC<FlyingWordProps> = ({ flight, onLand }) => {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    const duration = reduced ? REDUCED_DURATION_MS : DURATION_MS;
    t.value = withDelay(
      flight.delay,
      withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) }),
    );
    const timeout = setTimeout(onLand, flight.delay + duration - 30);
    return () => clearTimeout(timeout);
  }, [flight, onLand, reduced, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    const x = flight.fromX + (flight.toX - flight.fromX) * p;
    const y = flight.fromY + (flight.toY - flight.fromY) * p;
    const arc = reduced ? 0 : -80 * Math.sin(Math.PI * p);
    const scaleVal = reduced ? 0.95 + p * 0.05 : 1 + 0.22 * Math.sin(Math.PI * p);
    const rot = reduced ? 0 : (p - 0.5) * 18;
    const opacity =
      p < 0.08 ? p / 0.08 : p > 0.94 ? Math.max(0, 1 - (p - 0.94) * 16) : 1;
    return {
      transform: [
        { translateX: x },
        { translateY: y + arc },
        { rotateZ: `${rot}deg` },
        { scale: scaleVal },
      ],
      opacity,
    };
  });

  const toneColor = flight.tone === 'warn' ? colors.error : colors.accent;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: toneColor + '22',
          borderColor: toneColor + '55',
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: scale(10),
          paddingVertical: verticalScale(4),
          borderRadius: 999,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: toneColor,
          fontFamily: 'DMSans_600SemiBold',
          fontSize: fontScale(13),
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {flight.label}
      </Text>
    </Animated.View>
  );
};
