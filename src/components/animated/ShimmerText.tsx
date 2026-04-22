import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../theme';

type Props = {
  text: string;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
  durationMs?: number;
};

export const ShimmerText: React.FC<Props> = ({
  text,
  textStyle,
  containerStyle,
  durationMs = 1800,
}) => {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [reduced, durationMs, progress]);

  const sweep = useAnimatedStyle(() => ({
    transform: [
      { translateX: -200 + progress.value * 500 },
    ],
  }));

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[{ color: colors.textPrimary }, textStyle]}>{text}</Text>
      {!reduced && (
        <Animated.View style={[StyleSheet.absoluteFill, sweep]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
