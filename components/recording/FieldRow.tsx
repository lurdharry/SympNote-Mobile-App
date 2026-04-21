import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography } from '../../theme';

type Props = {
  label: string;
  value: string;
  active?: boolean;
};

export function FieldRow({ label, value, active }: Props) {
  const { colors } = useTheme();
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
    <Animated.View
      style={[
        styles.row,
        { borderColor: colors.border, borderRadius: radius.md },
        style,
      ]}
    >
      <Text style={[typography.label, { color: colors.textTertiary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.bodyLarge,
          { color: colors.textPrimary, marginTop: 2 },
        ]}
      >
        {value || '—'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    marginBottom: spacing.s3,
  },
});
