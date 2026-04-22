import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, typography, useTheme, verticalScale } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { StepTint } from '@/constants/analyzing';
import { XP_PER_STEP } from '@/constants/analyzing';

type IconRef = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface CheckRowProps {
  label: string;
  Icon: IconRef;
  done: boolean;
  tint: StepTint;
}

export const CheckRow: React.FC<CheckRowProps> = ({ label, Icon, done, tint }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const rowScale = useSharedValue(1);
  const fill = useSharedValue(done ? 1 : 0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!done) return;
    if (reduced) {
      fill.value = 1;
      return;
    }
    rowScale.value = withSequence(
      withTiming(1.04, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    fill.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    shimmer.value = 0;
    shimmer.value = withDelay(
      80,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [done, reduced, rowScale, fill, shimmer]);

  const xpScale = useSharedValue(done ? 1 : 0);
  const xpOpacity = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    if (!done) return;
    if (reduced) {
      xpScale.value = 1;
      xpOpacity.value = 1;
      return;
    }
    xpOpacity.value = withTiming(1, { duration: 140 });
    xpScale.value = withSequence(
      withTiming(1.3, { duration: 170, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
  }, [done, reduced, xpScale, xpOpacity]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
    shadowOpacity: fill.value * 0.25,
    shadowRadius: 8 + fill.value * 12,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      fill.value,
      [0, 1],
      [colors.bgSurface, '#FFFFFF'],
    ),
    borderColor: interpolateColor(
      fill.value,
      [0, 1],
      [colors.border, tint.glow + '66'],
    ),
    opacity: 0.55 + fill.value * 0.45,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value < 0.05 ? 0 : shimmer.value > 0.95 ? 0 : 0.85,
    transform: [{ translateX: -80 + shimmer.value * 360 }],
  }));

  const tileIdleStyle = useAnimatedStyle(() => ({
    opacity: 1 - fill.value,
  }));
  const tileDoneStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: fill.value * 0.6,
    transform: [{ scale: 1 + fill.value * 0.3 }],
  }));

  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
    opacity: xpOpacity.value,
  }));

  return (
    <Animated.View style={[styles.rowWrap, { shadowColor: tint.glow }, wrapStyle]}>
      <Animated.View style={[styles.rowCard, cardStyle]}>
        <Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.9)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={styles.iconTile}>
          <Animated.View
            pointerEvents="none"
            style={[styles.tileGlow, { backgroundColor: tint.glow }, glowStyle]}
          />
          <Animated.View
            style={[styles.tileFace, { backgroundColor: colors.bgMuted }, tileIdleStyle]}
          >
            <Icon size={moderateScale(16)} color={colors.textSecondary} strokeWidth={2} />
          </Animated.View>
          <Animated.View style={[styles.tileFace, tileDoneStyle]}>
            <LinearGradient
              colors={tint.tileGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Check size={moderateScale(16)} color={tint.text} strokeWidth={3} />
          </Animated.View>
        </Animated.View>

        <Text
          style={[
            typography.bodyLarge,
            styles.rowLabel,
            {
              color: done ? colors.textPrimary : colors.textTertiary,
              fontFamily: done ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
            },
          ]}
        >
          {label}
        </Text>

        <Animated.View style={[styles.xpChip, xpStyle]}>
          <LinearGradient
            colors={tint.badgeGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.xpChipText}>+{XP_PER_STEP} XP</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  rowWrap: {
    borderRadius: theme.radius.lg,
    shadowOffset: { width: 0, height: moderateScale(6) },
    elevation: 6,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: moderateScale(80),
  },
  iconTile: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileGlow: {
    position: 'absolute',
    top: -moderateScale(4),
    left: -moderateScale(4),
    right: -moderateScale(4),
    bottom: -moderateScale(4),
    borderRadius: moderateScale(16),
  },
  tileFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowLabel: {
    flex: 1,
    letterSpacing: -0.1,
  },
  xpChip: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    minWidth: moderateScale(58),
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpChipText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: moderateScale(11),
    letterSpacing: 0.6,
  },
}));
