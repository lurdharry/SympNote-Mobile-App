import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface BinCellProps {
  label: string;
  value?: string;
  filled?: boolean;
  tone?: 'accent' | 'warn';
}

export const BinCell: React.FC<BinCellProps> = ({
  label,
  value,
  filled = false,
  tone = 'accent',
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const fill = useSharedValue(0);

  useEffect(() => {
    if (filled) {
      fill.value = reduced
        ? withTiming(1, { duration: 200 })
        : withSequence(
            withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
            withTiming(0.35, { duration: 500, easing: Easing.in(Easing.cubic) }),
          );
    }
  }, [filled, fill, reduced]);

  const toneColor = tone === 'warn' ? colors.error : colors.accent;

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value * 0.85,
  }));

  return (
    <View
      style={[
        styles.bin,
        { borderColor: filled ? toneColor + '99' : colors.border },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.binFill,
          { backgroundColor: toneColor + '22' },
          fillStyle,
        ]}
      />
      <Text
        style={[
          typography.label,
          {
            color: filled ? toneColor : colors.textTertiary,
            letterSpacing: 0.3,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[styles.value, { color: filled ? colors.textPrimary : colors.textTertiary }]}
        numberOfLines={1}
      >
        {filled ? value || '—' : '•'}
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  bin: {
    width: '48%',
    minHeight: verticalScale(72),
    padding: theme.spacing.s4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.md,
  },
  binFill: {
    borderRadius: theme.radius.md,
  },
  value: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
    marginTop: moderateScale(4),
    letterSpacing: -0.2,
  },
}));
