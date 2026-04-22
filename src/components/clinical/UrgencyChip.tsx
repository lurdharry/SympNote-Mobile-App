import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme';
import { UrgencyLevel } from '../../stores/types';

type Props = {
  urgency: UrgencyLevel;
};

const LABELS: Record<UrgencyLevel, string> = {
  routine: 'Routine',
  'follow-up': 'Next visit',
  soon: 'Within weeks',
  urgent: 'Consider urgent',
};

export function UrgencyChip({ urgency }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone =
    urgency === 'urgent'
      ? colors.error
      : urgency === 'soon'
      ? colors.warning
      : urgency === 'follow-up'
      ? colors.accent
      : colors.textTertiary;
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: tone + '18', borderColor: tone + '55' },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.label, { color: tone }]}>{LABELS[urgency]}</Text>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: { ...theme.typography.label, letterSpacing: 0.3 },
}));
