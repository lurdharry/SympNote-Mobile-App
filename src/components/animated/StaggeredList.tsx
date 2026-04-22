import React, { Children, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  children: React.ReactNode;
  stagger?: number;
  initialDelay?: number;
  translateY?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: StyleProp<ViewStyle>;
};

export const StaggeredList: React.FC<Props> = ({
  children,
  stagger = 80,
  initialDelay = 0,
  translateY = 16,
  direction = 'up',
  style,
}) => {
  const items = Children.toArray(children);
  return (
    <Animated.View style={style}>
      {items.map((child, i) => (
        <StaggeredItem
          key={i}
          delay={initialDelay + i * stagger}
          translateY={translateY}
          direction={direction}
        >
          {child}
        </StaggeredItem>
      ))}
    </Animated.View>
  );
}

type ItemProps = {
  children: React.ReactNode;
  delay: number;
  translateY: number;
  direction: 'up' | 'down' | 'left' | 'right';
};

const StaggeredItem: React.FC<ItemProps> = ({ children, delay, translateY, direction }) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const offset = useSharedValue(translateY);

  useEffect(() => {
    if (reduced) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
      offset.value = 0;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
    offset.value = withDelay(
      delay,
      withSpring(0, { damping: 18, stiffness: 110, mass: 0.7 })
    );
  }, [reduced, delay, opacity, offset]);

  const style = useAnimatedStyle(() => {
    const tx =
      direction === 'left' ? offset.value : direction === 'right' ? -offset.value : 0;
    const ty =
      direction === 'up' ? offset.value : direction === 'down' ? -offset.value : 0;
    return {
      opacity: opacity.value,
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return <Animated.View style={style}>{children}</Animated.View>;
}
