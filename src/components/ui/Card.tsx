import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { makeStyles, spacing } from '../../theme';

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
  const styles = useStyles();
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
          { padding },
          elevated ? styles.elevated : styles.flat,
          style,
        ]}
      >
        {children}
      </Container>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.lg,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  elevated: theme.shadows.elevated,
  flat: theme.shadows.card,
}));
