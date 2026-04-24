import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
import type { PeriodComparison } from '@/utils/insights';

interface PeriodCompareCardProps {
  comparison: PeriodComparison;
}

/**
 * Apple-Health-style "this range vs prior range" comparison. Flat
 * direction reads as a grounding reassurance ("holding steady"),
 * up / down get coral / green tints. Copy is entry-count focused
 * because that's the honest interpretation — we're not comparing
 * severity means here (that's the severity trend card's job).
 */
export const PeriodCompareCard: React.FC<PeriodCompareCardProps> = ({ comparison }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { current, prior, direction, currentLabel, priorLabel } = comparison;

  const tint =
    direction === 'up'
      ? colors.accent
      : direction === 'down'
        ? colors.coral
        : colors.textTertiary;

  const Icon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  const headline = (() => {
    if (prior === 0 && current === 0) return 'No entries yet';
    if (prior === 0) return `${current} ${current === 1 ? 'entry' : 'entries'} ${currentLabel}`;
    if (direction === 'flat') return `Holding steady at ${current} ${currentLabel}`;
    return direction === 'up'
      ? `More entries ${currentLabel}`
      : `Fewer entries ${currentLabel}`;
  })();

  const detail =
    prior === 0
      ? `No entries ${priorLabel}.`
      : `${current} ${currentLabel} vs ${prior} ${priorLabel}.`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint + '14' }]}>
        <Icon size={moderateScale(16)} color={tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
          numberOfLines={2}
        >
          {headline}
        </Text>
        <Text style={[styles.detail, { color: colors.textTertiary }]}>
          {detail}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    ...theme.typography.caption,
    fontSize: fontScale(12),
    marginTop: 2,
  },
}));
