import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { SeverityTrendSummary } from '@/utils/insights';

interface SeverityTrendCardProps {
  summary: SeverityTrendSummary;
}

const CHART_H = 80;

/**
 * 30-day severity trend. Answers "am I getting better or worse?" at
 * a glance. Null points (days with no symptom-bearing entries) are
 * skipped in the polyline so the chart doesn't misleadingly pull to
 * zero on off-days — gaps are drawn as segmented lines between the
 * nearest logged days on either side.
 */
export const SeverityTrendCard: React.FC<SeverityTrendCardProps> = ({ summary }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { points, trend, sampleCount } = summary;

  if (sampleCount === 0) return null;

  const W = 320;
  const H = CHART_H;
  const padX = 4;
  const chartW = W - padX * 2;

  const logged = points
    .map((p, i) => ({ i, severity: p.severity }))
    .filter((p): p is { i: number; severity: number } => p.severity !== null);

  const pts = logged
    .map(({ i, severity }) => {
      const x = padX + (i / (points.length - 1)) * chartW;
      const y = H - (severity / 10) * H;
      return `${x},${y}`;
    })
    .join(' ');

  const trendColor =
    trend === 'up' ? '#E07A5F' : trend === 'down' ? '#5A8F6E' : colors.textTertiary;
  const trendLabel =
    trend === 'up' ? 'Trending worse' : trend === 'down' ? 'Trending better' : 'Holding steady';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Gridlines at severity 3 and 7 to anchor mild/moderate/severe zones.
  const mildY = H - (3 / 10) * H;
  const severeY = H - (7 / 10) * H;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.label,
              {
                color: colors.textTertiary,
                fontFamily: 'DMSans_600SemiBold',
                letterSpacing: 0.8,
              },
            ]}
          >
            SEVERITY TREND
          </Text>
          <Text
            style={[
              typography.h3,
              {
                color: colors.textPrimary,
                fontFamily: 'DMSans_600SemiBold',
                marginTop: 2,
              },
            ]}
          >
            {trendLabel}
          </Text>
        </View>
        <View
          style={[
            styles.trendPill,
            { backgroundColor: trendColor + '1A', borderColor: trendColor + '55' },
          ]}
        >
          <TrendIcon size={moderateScale(13)} color={trendColor} strokeWidth={2.2} />
        </View>
      </View>

      <View style={styles.chartWrap}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* Gridlines — subtle, demarcate mild/moderate/severe bands */}
          <Line
            x1={0}
            x2={W}
            y1={mildY}
            y2={mildY}
            stroke={colors.border}
            strokeDasharray="3,4"
            strokeWidth={0.5}
          />
          <Line
            x1={0}
            x2={W}
            y1={severeY}
            y2={severeY}
            stroke={colors.border}
            strokeDasharray="3,4"
            strokeWidth={0.5}
          />
          {/* Trend line — joins only logged days so gaps read as gaps */}
          {logged.length >= 2 && (
            <Polyline
              points={pts}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Dots on every logged day */}
          {logged.map(({ i, severity }) => {
            const x = padX + (i / (points.length - 1)) * chartW;
            const y = H - (severity / 10) * H;
            return <Circle key={i} cx={x} cy={y} r={2.5} fill={colors.accent} />;
          })}
        </Svg>
      </View>

      <View style={styles.axisRow}>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {points.length} days
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {sampleCount} {sampleCount === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: spacing.s3,
  },
  trendPill: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrap: {
    height: verticalScale(CHART_H),
    marginBottom: verticalScale(4),
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    fontSize: fontScale(11),
  },
}));
