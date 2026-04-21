import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  items: string[];
};

/**
 * Alert card listing things the patient should make sure their doctor
 * hears first. Styled with an error accent and a subtle pulsing left rule
 * to draw attention without being alarmist.
 */
export function RedFlagAlert({ items }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced || items.length === 0) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [pulse, reduced, items.length]);

  const ruleStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
  }));

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.error + '55',
          borderRadius: radius.lg,
        },
      ]}
    >
      <Animated.View
        style={[styles.rule, { backgroundColor: colors.error }, ruleStyle]}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.label,
            { color: colors.error, letterSpacing: 0.3 },
          ]}
        >
          Worth flagging
        </Text>
        <View style={{ marginTop: spacing.s3, gap: spacing.s2 }}>
          {items.map((item, i) => (
            <View key={`${i}-${item}`} style={styles.row}>
              <Text
                style={{
                  color: colors.error,
                  fontSize: 14,
                  marginRight: 8,
                  marginTop: 3,
                }}
              >
                ⚠
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textPrimary, flex: 1 },
                ]}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rule: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 1.5,
    marginRight: spacing.s4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
