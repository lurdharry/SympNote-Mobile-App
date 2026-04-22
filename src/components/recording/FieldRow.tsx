import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles, moderateScale } from '../../theme';

type Props = {
  label: string;
  value: string;
  active?: boolean;
};

export function FieldRow({ label, value, active }: Props) {
  const styles = useStyles();
  const bg = useSharedValue(0);

  useEffect(() => {
    if (active) {
      bg.value = withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0, { duration: 420 })
      );
    }
  }, [active, bg]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: `rgba(168,196,194,${bg.value * 0.8})`,
  }));

  return (
    <Animated.View style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    marginBottom: theme.spacing.s3,
  },
  label: { ...theme.typography.label, color: theme.colors.textTertiary },
  value: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
    marginTop: moderateScale(2),
  },
}));
