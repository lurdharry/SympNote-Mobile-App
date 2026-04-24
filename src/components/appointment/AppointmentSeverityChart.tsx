import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { DerivedSeverityPoint } from '@/utils/prep';

interface AppointmentSeverityChartProps {
  data: DerivedSeverityPoint[];
  accent: string;
}

const CHART_H = 96;

/**
 * Visit-scoped severity chart. Plots one dot per logged day across the
 * entries feeding this appointment's brief, joined by a polyline so the
 * doctor can see the arc of severity at a glance. Mild / severe
 * reference lines echo the SeverityBadge tonal bands.
 */
export const AppointmentSeverityChart: React.FC<AppointmentSeverityChartProps> = ({
  data,
  accent,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (data.length === 0) return null;

  const W = 320;
  const H = CHART_H;
  const padX = 6;
  const chartW = W - padX * 2;

  const points = data.map((p, i) => {
    const x =
      data.length === 1
        ? padX + chartW / 2
        : padX + (i / (data.length - 1)) * chartW;
    const y = H - (p.v / 10) * H;
    return { x, y, v: p.v, d: p.d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const mildY = H - (3 / 10) * H;
  const severeY = H - (7 / 10) * H;

  return (
    <View>
      <View style={styles.chart}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
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
          {points.length >= 2 && (
            <Polyline
              points={polyline}
              fill="none"
              stroke={accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={accent} />
          ))}
        </Svg>
      </View>
      <View style={styles.axisRow}>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {data[0]!.d}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {data[data.length - 1]!.d}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  chart: {
    height: verticalScale(CHART_H),
    marginTop: StyleSheet.hairlineWidth,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    fontSize: fontScale(11),
    paddingHorizontal: moderateScale(2),
  },
}));
