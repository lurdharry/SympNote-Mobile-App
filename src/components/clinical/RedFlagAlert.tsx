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
import { makeStyles, useTheme } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  items: string[];
};

/**
 * Alert card listing things the patient should make sure their doctor
 * hears first. Styled with an error accent and a subtle pulsing left rule.
 */
export function RedFlagAlert({ items }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
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
    <View style={[styles.card, { borderColor: colors.error + '55' }]}>
      <Animated.View
        style={[styles.rule, { backgroundColor: colors.error }, ruleStyle]}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.heading, { color: colors.error }]}>
          Worth flagging
        </Text>
        <View style={styles.items}>
          {items.map((item, i) => (
            <View key={`${i}-${item}`} style={styles.row}>
              <Text style={[styles.bullet, { color: colors.error }]}>⚠</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.lg,
  },
  rule: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 1.5,
    marginRight: theme.spacing.s4,
  },
  heading: { ...theme.typography.label, letterSpacing: 0.3 },
  items: { marginTop: theme.spacing.s3, gap: theme.spacing.s2 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  bullet: { fontSize: 14, marginRight: 8, marginTop: 3 },
  itemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
}));
