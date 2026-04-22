import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fontScale, makeStyles, moderateScale, scale, verticalScale } from '../../../theme';
import { QUALIFIER_TIMINGS } from '../../../constants/onboarding';
import { AssistantAvatar } from './AssistantAvatar';

/** Bot message bubble — gradient avatar on the left, soft-tinted surface. */
interface AssistantBubbleProps {
  children: React.ReactNode;
}

export const AssistantBubble: React.FC<AssistantBubbleProps> = ({ children }) => {
  const styles = useStyles();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: QUALIFIER_TIMINGS.bubbleDurationMs,
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
      <AssistantAvatar />
      <Animated.View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(8),
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.lg,
    borderTopLeftRadius: moderateScale(6),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: fontScale(20),
  },
}));
