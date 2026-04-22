import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { hapticLight } from '../../services/haptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { makeStyles, moderateScale, scale, useTheme, verticalScale } from '../../theme';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  heightRatio?: number;
};

/**
 * Bottom sheet with blurred backdrop. Velocity-aware swipe-down dismiss
 * with a haptic on commit.
 */
export const Sheet: React.FC<Props> = ({ visible, onDismiss, children, heightRatio = 0.75 }) => {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const sheetH = height * heightRatio;

  const translateY = useSharedValue(sheetH);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdrop.value = withTiming(1, { duration: reduced ? 200 : 260 });
      translateY.value = reduced
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 18, stiffness: 100 });
    } else {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(sheetH, { duration: 220 });
    }
  }, [visible, translateY, backdrop, sheetH, reduced]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const shouldDismiss = e.translationY > sheetH * 0.25 || e.velocityY > 900;
      if (shouldDismiss) {
        translateY.value = withTiming(sheetH, { duration: 200 }, () => {
          runOnJS(hapticLight)();
          runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 140 });
      }
    });

  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const bd = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!visible && translateY.value === sheetH) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, bd]}>
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.overlay },
          ]}
        />
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View style={[styles.sheet, { height: sheetH }, sheet]}>
          <Animated.View style={styles.grabber} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { zIndex: 10 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(10),
    backgroundColor: theme.colors.bgSurface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  grabber: {
    width: scale(44),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(8),
    backgroundColor: theme.colors.border,
  },
}));
