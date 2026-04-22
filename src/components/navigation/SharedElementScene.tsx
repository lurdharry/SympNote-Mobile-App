import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTransition } from './TransitionContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Destination screen wrapper for the shared-element card transition.
 * Starts at the captured origin frame, then expands to fill the screen
 * with a spring. Children fade in with a delay. On unmount the detail
 * screen can call `closeScene()` (from TransitionContext) to play the
 * reverse animation — the card contracts back into its list row before
 * router.back() fires.
 */
export const SharedElementScene: React.FC<Props> = ({ children, style }) => {
  const { origin, registerSceneCloser } = useTransition();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const t = useSharedValue(origin ? 0 : 1);
  const childOp = useSharedValue(origin ? 0 : 1);

  useEffect(() => {
    if (reduced) {
      t.value = withTiming(1, { duration: 200 });
      childOp.value = withTiming(1, { duration: 200 });
      return;
    }
    t.value = withSpring(1, { damping: 18, stiffness: 100, mass: 0.9 });
    childOp.value = withDelay(
      150,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
    );
  }, [t, childOp, reduced]);

  useEffect(() => {
    const closer = () =>
      new Promise<void>((resolve) => {
        if (!origin) {
          // No captured origin — just fade out.
          childOp.value = withTiming(0, { duration: 160 }, (done) => {
            if (done) runOnJS(resolve)();
          });
          return;
        }
        // Children fade first (they'd look distorted scaled down),
        // then the container contracts back to the origin frame.
        childOp.value = withTiming(0, { duration: 120 });
        t.value = withTiming(
          0,
          { duration: reduced ? 180 : 320, easing: Easing.in(Easing.cubic) },
          (done) => {
            if (done) runOnJS(resolve)();
          }
        );
      });
    registerSceneCloser(closer);
    return () => registerSceneCloser(null);
  }, [origin, reduced, t, childOp, registerSceneCloser]);

  const container = useAnimatedStyle(() => {
    if (!origin) {
      return {
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
      };
    }
    const x = origin.x + (0 - origin.x) * t.value;
    const y = origin.y + (0 - origin.y) * t.value;
    const w = origin.width + (width - origin.width) * t.value;
    const h = origin.height + (height - origin.height) * t.value;
    return {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 16 * (1 - t.value),
      overflow: 'hidden',
    };
  });

  const content = useAnimatedStyle(() => ({ opacity: childOp.value }));

  return (
    <Animated.View style={[container, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, content]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
