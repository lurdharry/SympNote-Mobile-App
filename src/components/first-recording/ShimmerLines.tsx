import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles, moderateScale, useTheme, verticalScale } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const LINE_WIDTHS = [16, 14, 12] as const;

export const ShimmerLines: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduced, t]);

  const bg = useAnimatedStyle(() => ({
    transform: [{ translateX: -200 + t.value * 400 }],
  }));

  return (
    <View style={styles.frame}>
      {LINE_WIDTHS.map((w, i) => (
        <View
          key={i}
          style={[styles.line, { backgroundColor: colors.bgMuted, width: `${w * 6}%` }]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, bg]} pointerEvents="none">
            <LinearGradient
              colors={[
                'rgba(245,241,234,0)',
                'rgba(245,241,234,0.8)',
                'rgba(245,241,234,0)',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      ))}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  frame: {
    width: '100%',
    maxWidth: 260,
    gap: 8,
  },
  line: {
    height: verticalScale(14),
    borderRadius: moderateScale(7),
    overflow: 'hidden',
  },
}));
