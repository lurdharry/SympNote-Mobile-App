import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { TriggerFrequency } from '@/utils/insights';

interface TriggerFrequencyListProps {
  triggers: TriggerFrequency[];
}

/**
 * Top triggers list — mirrors SymptomFrequencyList visually but drops
 * the sparkline/trend since triggers don't have a per-day shape worth
 * charting (they're context, not a metric). Each row shows the
 * trigger, absolute count, and a share-of-total bar.
 */
export const TriggerFrequencyList: React.FC<TriggerFrequencyListProps> = ({ triggers }) => {
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
      {triggers.map((t, i) => (
        <View
          key={t.name}
          style={[
            styles.row,
            i > 0 && {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.title}>
              <View style={[styles.swatch, { backgroundColor: t.color }]} />
              <Text
                style={[
                  typography.body,
                  { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
                ]}
                numberOfLines={1}
              >
                {t.name}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {t.count}× · {t.pct}%
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
            <View
              style={{
                width: `${t.pct}%`,
                height: '100%',
                backgroundColor: t.color,
                borderRadius: 999,
              }}
            />
          </View>
        </View>
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
  track: {
    height: verticalScale(6),
    borderRadius: 999,
    overflow: 'hidden',
  },
}));
