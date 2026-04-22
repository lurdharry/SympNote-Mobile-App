import React, { useEffect, useRef } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTransition } from './TransitionContext';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Captures its on-screen frame on press and stores it in TransitionContext
 * so the destination screen can reverse-animate back into it on dismiss.
 */
export const SharedElementCard: React.FC<Props> = ({ children, onPress, style }) => {
  const ref = useRef<View>(null);
  const { setOrigin } = useTransition();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handle = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setOrigin({ x, y, width, height });
      onPress?.();
    });
  };

  return (
    <Animated.View style={anim}>
      <Pressable
        ref={ref as any}
        onPress={handle}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 18, stiffness: 220 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 18, stiffness: 160 }))}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export const SharedElementStyles = StyleSheet.create({});
