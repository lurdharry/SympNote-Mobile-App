import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { fontScale, makeStyles, moderateScale, scale, verticalScale } from '../../../theme';
import { QUALIFIER_TIMINGS } from '../../../constants/onboarding';

/** User message bubble — right-aligned, teal gradient. */
export function UserBubble({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: QUALIFIER_TIMINGS.userBubbleDurationMs,
      easing: Easing.out(Easing.cubic),
    });
    ty.value = withSpring(0, { damping: 18, stiffness: 160 });
  }, [opacity, ty]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.View style={[styles.row, animStyle]}>
      <Animated.View style={styles.bubble}>
        <LinearGradient
          colors={['#2C6E6B', '#1F504E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.text}>{children}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.lg,
    borderTopRightRadius: moderateScale(6),
    overflow: 'hidden',
  },
  text: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    lineHeight: fontScale(20),
  },
}));
