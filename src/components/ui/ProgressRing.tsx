import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { moderateScale, useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Animated progress ring. Sized + stroked per design handoff defaults.
 * `value` is 0..100; transitions smoothly over 700ms cubic-out.
 */
type Props = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
};

export function ProgressRing({
  value,
  size = moderateScale(56),
  stroke = moderateScale(5),
  color,
  trackColor,
  children,
}: Props) {
  const { colors } = useTheme();
  const effectiveColor = color ?? colors.accent;
  const effectiveTrack = trackColor ?? colors.bgMuted;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, value)) / 100, {
      duration: 700,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }));

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, transform: [{ rotate: '-90deg' }] },
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={effectiveTrack}
          strokeWidth={stroke}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={effectiveColor}
          strokeWidth={stroke}
          strokeDasharray={c}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.inner,
          { transform: [{ rotate: '90deg' }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center', justifyContent: 'center' },
});
