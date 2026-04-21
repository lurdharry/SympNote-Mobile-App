import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  count: number;
  activeIndex: number;
  containerWidth: number;
  color: string;
  height?: number;
  widthRatio?: number; // indicator width as fraction of slot
  bottomInset?: number;
};

export function SharedTabIndicator({
  count,
  activeIndex,
  containerWidth,
  color,
  height = 3,
  widthRatio = 0.35,
  bottomInset = 0,
}: Props) {
  const reduced = useReducedMotion();
  const slotWidth = containerWidth / count;
  const pillWidth = slotWidth * widthRatio;
  const translateX = useSharedValue(
    slotWidth * activeIndex + (slotWidth - pillWidth) / 2
  );

  useEffect(() => {
    const target = slotWidth * activeIndex + (slotWidth - pillWidth) / 2;
    translateX.value = reduced
      ? target
      : withSpring(target, { damping: 18, stiffness: 180, mass: 0.7 });
  }, [activeIndex, slotWidth, pillWidth, reduced, translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: pillWidth,
  }));

  return (
    <View style={[styles.track, { width: containerWidth, bottom: bottomInset }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.pill,
          { height, backgroundColor: color, borderRadius: height / 2 },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { position: 'absolute', left: 0 },
  pill: { position: 'absolute' },
});
