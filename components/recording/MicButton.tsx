import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { useTheme } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  active: boolean; // true when recording
  onPress: () => void;
};

/**
 * Shared mic button for idle + recording states. Handles the pulsing idle
 * ring, the scale pop on press, and the gradient color shift when active.
 */
export function MicButton({ active, onPress }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active || reduced) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      false
    );
  }, [active, reduced, pulse]);

  useEffect(() => {
    scale.value = withSpring(active ? 1.2 : 1, { damping: 14, stiffness: 180 });
  }, [active, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.18 }],
    opacity: 0.35 * (1 - pulse.value),
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.hitbox}>
      {!reduced && !active && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.ring, pulseStyle]}
          pointerEvents="none"
        >
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 2,
              borderColor: colors.accent,
            }}
          />
        </Animated.View>
      )}
      <Animated.View style={coreStyle}>
        <Pressable onPress={onPress} hitSlop={16}>
          <Canvas style={{ width: 130, height: 130 }}>
            <Circle cx={65} cy={65} r={60}>
              <RadialGradient
                c={vec(65, 65)}
                r={65}
                colors={
                  active
                    ? ['#F2B36E', '#E08B3F', '#C4701F']
                    : [colors.accentLight, colors.accent, colors.accentDark]
                }
              />
              <BlurMask blur={10} style="solid" />
            </Circle>
          </Canvas>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitbox: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { alignItems: 'center', justifyContent: 'center' },
});
