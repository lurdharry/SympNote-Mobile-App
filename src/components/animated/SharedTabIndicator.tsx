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
  /**
   * Horizontal offset of the track's left edge from the parent's left
   * edge. Use this when the tab row sits inside a padded container
   * (e.g. a bar with paddingHorizontal) — pass the left-padding value
   * and a `containerWidth` equal to the inner content width so the
   * indicator lines up with each tab's centre.
   */
  leftOffset?: number;
};

export const SharedTabIndicator: React.FC<Props> = ({
  count,
  activeIndex,
  containerWidth,
  color,
  height = 3,
  widthRatio = 0.35,
  bottomInset = 0,
  leftOffset = 0,
}) => {
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
    <View
      style={[
        styles.track,
        { width: containerWidth, bottom: bottomInset, left: leftOffset },
      ]}
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
  track: { position: 'absolute' },
  pill: { position: 'absolute' },
});
