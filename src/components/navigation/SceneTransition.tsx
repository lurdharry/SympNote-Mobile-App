import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme';

export type SceneMode =
  | 'scale-fade' // onboarding
  | 'crossfade-parallax-up'
  | 'crossfade-parallax-down'
  | 'crossfade-parallax-left'
  | 'crossfade-parallax-right'
  | 'sheet-up';

type Props = {
  children: React.ReactNode;
  mode?: SceneMode;
  style?: StyleProp<ViewStyle>;
  enterDelay?: number;
};

/**
 * Wraps screen content and animates it in on mount. Every onboarding and
 * main-app screen should wrap its content in this so transitions feel
 * continuous instead of stock Expo Router slides.
 */
export const SceneTransition: React.FC<Props> = ({
  children,
  mode = 'scale-fade',
  style,
  enterDelay = 0,
}) => {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(mode === 'scale-fade' ? 0.95 : 1);
  const translateY = useSharedValue(
    mode === 'crossfade-parallax-up'
      ? 20
      : mode === 'crossfade-parallax-down'
      ? -20
      : mode === 'sheet-up'
      ? 60
      : 0
  );
  const translateX = useSharedValue(
    mode === 'crossfade-parallax-left'
      ? 20
      : mode === 'crossfade-parallax-right'
      ? -20
      : 0
  );

  useEffect(() => {
    const dur = reduced ? 200 : 350;
    const run = () => {
      opacity.value = withTiming(1, {
        duration: dur,
        easing: Easing.out(Easing.cubic),
      });
      if (reduced) {
        scale.value = 1;
        translateY.value = 0;
        translateX.value = 0;
        return;
      }
      if (mode === 'sheet-up') {
        translateY.value = withSpring(0, { damping: 18, stiffness: 100 });
      } else {
        scale.value = withSpring(1, { damping: 18, stiffness: 110 });
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        translateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    };
    const id = setTimeout(run, enterDelay);
    // JS-side failsafe: if the worklet never runs (rare, but it has
    // been observed on some tab-switch paths leaving the screen
    // fully transparent), force final values after a generous delay.
    const safety = setTimeout(() => {
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
      translateX.value = 0;
    }, enterDelay + 1200);
    return () => {
      clearTimeout(id);
      clearTimeout(safety);
    };
  }, [reduced, mode, enterDelay, opacity, scale, translateY, translateX]);

  const style$ = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Two-layer wrapper: outer solid-color View (never fades) so nothing
  // white shows through the screen when the inner animated layer is at
  // opacity 0 during entry/exit. The inner Animated.View is what actually
  // fades + slides.
  return (
    <View style={[styles.fill, { backgroundColor: colors.bgPrimary }]}>
      <Animated.View style={[styles.fill, style$, style]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
