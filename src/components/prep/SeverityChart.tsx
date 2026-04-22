import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { mean } from 'lodash';
import { makeStyles, moderateScale, spacing, typography, useTheme, verticalScale } from '@/theme';
import type { SeverityPoint } from '@/constants/demo/prep';

interface SeverityChartProps {
  data: SeverityPoint[];
  accent: string;
}

interface SeverityStats {
  avg: string;
  peak: number;
}

const computeStats = (data: SeverityPoint[]): SeverityStats => ({
  avg: mean(data.map((d) => d.v)).toFixed(1),
  peak: Math.max(...data.map((d) => d.v)),
});

export const SeverityChart: React.FC<SeverityChartProps> = ({ data, accent }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const stats = useMemo(() => (data.length > 0 ? computeStats(data) : null), [data]);

  if (!stats) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s8,
          },
        ]}
      >
        No severity data yet.
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.chartStats}>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Average</Text>
          <Text style={[typography.h2, styles.statValue, { color: colors.textPrimary }]}>
            {stats.avg}
            <Text style={[typography.body, { color: colors.textTertiary }]}>/10</Text>
          </Text>
        </View>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>Peak</Text>
          <Text style={[typography.h2, styles.statValue, { color: colors.coral }]}>
            {stats.peak}
            <Text style={[typography.body, { color: colors.textTertiary }]}>/10</Text>
          </Text>
        </View>
        <View style={styles.trendInline}>
          <TrendingUp size={12} color={colors.coral} strokeWidth={2} />
          <Text
            style={[
              typography.caption,
              { color: colors.coral, fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            Trending up
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={styles.yAxis}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>10</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>5</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>0</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { justifyContent: 'space-between' }]}
          >
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.gridline, { backgroundColor: colors.border }]} />
            ))}
          </View>
          <View style={styles.barsRow}>
            {data.map((d, i) => {
              const severe = d.v >= 7;
              return (
                <View key={i} style={[styles.bar, { height: `${(d.v / 10) * 100}%` }]}>
                  <LinearGradient
                    colors={severe ? ['#E07A5F', '#C45C3F'] : ['#A8C4C2', accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.xAxis}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {data[0]!.d}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {data[data.length - 1]!.d}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  chartStats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: moderateScale(16),
    marginBottom: verticalScale(12),
  },
  statValue: {
    fontVariant: ['tabular-nums'],
  },
  trendInline: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  yAxis: {
    width: moderateScale(16),
    height: verticalScale(112),
    justifyContent: 'space-between',
    paddingVertical: verticalScale(2),
    alignItems: 'flex-end',
  },
  gridline: {
    height: 1,
    opacity: 0.6,
  },
  barsRow: {
    height: verticalScale(112),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: moderateScale(3),
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: 'hidden',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(4),
  },
}));
