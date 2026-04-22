import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dot, TrendingDown, TrendingUp } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { SymptomFrequency } from '@/utils/insights';
import { Sparkline } from './Sparkline';

interface SymptomFrequencyListProps {
  symptoms: SymptomFrequency[];
}

interface SymptomRowViewProps {
  row: SymptomFrequency;
  isFirst: boolean;
}

const trendColor = (trend: SymptomFrequency['trend'], fallback: string): string => {
  if (trend === 'up') return '#E07A5F';
  if (trend === 'down') return '#5A8F6E';
  return fallback;
};

const SymptomRowView: React.FC<SymptomRowViewProps> = ({ row, isFirst }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const TrendIcon =
    row.trend === 'up' ? TrendingUp : row.trend === 'down' ? TrendingDown : Dot;

  return (
    <View
      style={[
        styles.row,
        !isFirst && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.title}>
          <View style={[styles.swatch, { backgroundColor: row.color }]} />
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
            ]}
            numberOfLines={1}
          >
            {row.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {row.count}×
          </Text>
        </View>
        <View style={styles.trend}>
          <Sparkline data={row.sparkline} color={row.color} />
          <TrendIcon
            size={12}
            color={trendColor(row.trend, colors.textTertiary)}
            strokeWidth={2}
          />
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
        <View
          style={{
            width: `${row.pct}%`,
            height: '100%',
            backgroundColor: row.color,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
};

export const SymptomFrequencyList: React.FC<SymptomFrequencyListProps> = ({ symptoms }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      {symptoms.map((s, i) => (
        <SymptomRowView key={s.name} row={s} isFirst={i === 0} />
      ))}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    height: verticalScale(6),
    borderRadius: 999,
    overflow: 'hidden',
  },
}));
