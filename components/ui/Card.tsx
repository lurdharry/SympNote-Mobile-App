import React from 'react';
import { Pressable, StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, shadows } from '../../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padding?: number;
};

export function Card({
  children,
  onPress,
  style,
  elevated = false,
  padding = spacing.s5,
}: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const Container: any = onPress ? Pressable : View;

  return (
    <Animated.View style={anim}>
      <Container
        onPress={onPress}
        onPressIn={() => {
          if (onPress) scale.value = withSpring(0.98, { damping: 20, stiffness: 240 });
        }}
        onPressOut={() => {
          if (onPress) scale.value = withSpring(1, { damping: 18, stiffness: 160 });
        }}
        style={[
          styles.card,
          {
            backgroundColor: colors.bgSurface,
            borderRadius: radius.lg,
            padding,
            borderColor: colors.border,
          },
          elevated ? shadows.elevated : shadows.card,
          style,
        ]}
      >
        {children}
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
