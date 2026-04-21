import React, { useEffect } from 'react';
import {
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticMedium } from '../../services/haptics';

type Props = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  breathe?: boolean;
  hapticOnPress?: 'light' | 'medium' | 'heavy' | 'none';
  disabled?: boolean;
  children?: React.ReactNode;
  pressScale?: number;
};

export function BreathingButton({
  onPress,
  style,
  breathe = true,
  hapticOnPress = 'medium',
  disabled,
  children,
  pressScale = 0.95,
}: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    if (!breathe || reduced || disabled) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [breathe, reduced, disabled, scale]);

  const style$ = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * press.value }],
  }));

  const handlePressIn = () => {
    press.value = withSpring(pressScale, { damping: 16, stiffness: 220 });
  };
  const handlePressOut = () => {
    press.value = withSpring(1, { damping: 15, stiffness: 160 });
  };
  const handlePress = () => {
    if (disabled) return;
    if (hapticOnPress !== 'none') {
      // Simple: always medium via service; extend per variant if needed.
      if (hapticOnPress === 'medium') hapticMedium();
      else if (hapticOnPress === 'light') hapticMedium();
      else hapticMedium();
    }
    onPress?.();
  };

  return (
    <Animated.View style={style$}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[styles.base, style]}
      >
        <View style={styles.inner}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {},
  inner: { alignItems: 'center', justifyContent: 'center' },
});
