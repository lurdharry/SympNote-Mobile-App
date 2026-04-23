import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
  verticalScale,
} from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { StepTint } from '@/constants/analyzing';

interface CheckRowProps {
  label: string;
  step: number;
  done: boolean;
  tint: StepTint;
}

/**
 * Step row with a numbered tile on the left. Tile cross-fades from a
 * muted pending face to a tinted gradient face; only the tile pulses on
 * completion — the row (and its text) stays on the pixel grid to avoid
 * the blur that scale-on-text produces.
 */
export const CheckRow: React.FC<CheckRowProps> = ({ label, step, done, tint }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const fill = useSharedValue(done ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!done) {
      fill.value = 0;
      return;
    }
    if (reduced) {
      fill.value = 1;
      return;
    }
    fill.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withSequence(
      withTiming(1.06, { duration: 140, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 240 }),
    );
  }, [done, reduced, fill, pulse]);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const pendingFaceStyle = useAnimatedStyle(() => ({
    opacity: 1 - fill.value,
  }));

  const doneFaceStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.tileWrap, tileStyle]}>
        <Animated.View
          style={[styles.face, { backgroundColor: colors.bgMuted }, pendingFaceStyle]}
        >
          <Text style={[styles.numPending, { color: colors.textTertiary }]}>
            {step}
          </Text>
        </Animated.View>
        <Animated.View
          style={[styles.face, { backgroundColor: tint.glow }, doneFaceStyle]}
        >
          <LinearGradient
            colors={tint.tileGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.numDone}>{step}</Text>
        </Animated.View>
      </Animated.View>

      <Text
        style={[
          styles.label,
          {
            color: done ? colors.textPrimary : colors.textTertiary,
            fontFamily: done ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
    paddingVertical: verticalScale(10),
  },
  tileWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  numPending: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(15),
    letterSpacing: 0,
    includeFontPadding: false,
  },
  numDone: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(15),
    color: '#FFFFFF',
    letterSpacing: 0,
    includeFontPadding: false,
  },
  label: {
    ...theme.typography.bodyLarge,
    flex: 1,
    fontSize: fontScale(15),
    letterSpacing: -0.1,
  },
}));
