import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { makeStyles, moderateScale, scale, useTheme, verticalScale } from '../../theme';
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
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: moderateScale(6),
  },
  label: { ...theme.typography.label, letterSpacing: 0.3 },
}));
