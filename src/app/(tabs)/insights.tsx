import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polyline } from 'react-native-svg';
import {
  Dot,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { makeStyles, shadows, spacing, typography, useTheme } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { hapticLight } from '../../services/haptics';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import {
  computeHeatmap,
  filterByRange,
  formatTotalDuration,
  peakHeatmapRow,
  rangeLabel,
  summarize,
  symptomFrequencies,
  SymptomFrequency,
  InsightsRange,
} from '../../utils/insights';

/**
 * Insights — Phase 2 (partial real data).
 *
 *  - Headline stat card and symptom frequency list are computed from
 *    the recordings store when enough data exists (>= 3 recordings in
 *    the selected range). Below that threshold we fall back to the
 *    design-handoff demo data so new users don't see empty charts.
 *  - Correlations + heatmap remain demo-only for now — meaningful
 *    correlations need keyword analysis and more history than most
 *    early users will have.
 */

type Range = InsightsRange;

type SymptomRow = SymptomFrequency;

const DEMO_SYMPTOMS: SymptomRow[] = [
  { name: 'Knee pain', count: 18, trend: 'up',   pct: 72, color: '#2C6E6B', sparkline: [3,4,5,4,6,7,6,5,7,8] },
  { name: 'Fatigue',   count: 12, trend: 'up',   pct: 48, color: '#F6C06A', sparkline: [4,5,4,6,5,7,6,5,6,7] },
  { name: 'Headache',  count:  6, trend: 'down', pct: 24, color: '#E07A5F', sparkline: [5,6,4,3,4,3,2,2,3,2] },
  { name: 'Nausea',    count:  3, trend: 'flat', pct: 12, color: '#D97706', sparkline: [2,3,2,3,2,3,2,2,3,2] },
];

const CORRELATIONS = [
  { a: 'Fatigue',   b: 'Poor sleep',   strength: 0.8, pattern: 'Fatigue follows nights with <6h sleep 4 of 5 times.', severity: 'strong'   },
  { a: 'Knee pain', b: 'Stairs',       strength: 0.7, pattern: 'Knee pain is ~2× more severe on days you mention stairs.', severity: 'strong' },
  { a: 'Headache',  b: 'Dehydration',  strength: 0.5, pattern: 'Headaches cluster on low-water days.', severity: 'moderate' },
];

const RANGES: Range[] = ['7d', '30d', '90d', 'All'];
const DAY_COLS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ROW_LABELS = ['AM', 'Noon', 'PM', 'Eve', 'Night'];

// Shape-only demo heatmap shown when there aren't enough real
// recordings to bucket. Intentionally smooth so it doesn't look like
// it's claiming a specific user pattern.
const DEMO_HEATMAP: number[][] = (() => {
  const rows = 5;
  const cols = 7;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const intensity = (Math.sin(r * 1.3 + c * 0.7) + 1) / 2;
      return r === 0 || r === 2 ? intensity * 0.9 : intensity * 0.4;
    })
  );
})();

export default function TabInsights() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [range, setRange] = useState<Range>('30d');

  const recordings = useRecordingsStore((s) => s.recordings);

  // Switch from demo to real data once the user has enough recordings
  // in the selected range that trends become meaningful (>=3 entries).
  const { summary, symptoms, heatmap, peakLabel, isReal } = useMemo(() => {
    const inRange = filterByRange(recordings, range);
    if (inRange.length < 3) {
      return {
        summary: null,
        symptoms: DEMO_SYMPTOMS,
        heatmap: null as number[][] | null,
        peakLabel: null as string | null,
        isReal: false,
      };
    }
    const grid = computeHeatmap(inRange);
    return {
      summary: summarize(inRange),
      symptoms: symptomFrequencies(inRange, range, 4),
      heatmap: grid,
      peakLabel: peakHeatmapRow(grid),
      isReal: true,
    };
  }, [recordings, range]);

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={[typography.h1, { color: colors.textPrimary }]}>
                Insights
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                Patterns from your notes.
              </Text>
            </View>
          </View>

          {/* Range selector */}
          <View style={{ paddingHorizontal: spacing.s6, paddingBottom: spacing.s3 }}>
            <View
              style={[
                styles.rangeWrap,
                { backgroundColor: colors.bgMuted },
              ]}
            >
              {RANGES.map((r) => {
                const active = r === range;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      hapticLight();
                      setRange(r);
                    }}
                    style={[
                      styles.rangeBtn,
                      active && {
                        backgroundColor: colors.bgSurface,
                        ...shadows.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: active
                            ? colors.accent
                            : colors.textSecondary,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.s6,
              paddingBottom: 120,
              gap: spacing.s5,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Headline stat */}
            <View style={[styles.headlineCard, shadows.elevated]}>
              <LinearGradient
                colors={['#2C6E6B', '#1F504E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                pointerEvents="none"
                style={styles.headlineBlob}
              />
              <View style={styles.headlineContent}>
                <View style={styles.headlineIcon}>
                  <LineChartIcon size={22} color="#F6C06A" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.label,
                      {
                        color: '#F6C06A',
                        fontFamily: 'Inter_600SemiBold',
                        letterSpacing: 0.8,
                      },
                    ]}
                  >
                    {rangeLabel(range).toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      typography.h2,
                      { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
                    ]}
                  >
                    {summary
                      ? `${summary.recordingCount} voice note${summary.recordingCount === 1 ? '' : 's'}`
                      : '42 voice notes'}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      { color: 'rgba(255,255,255,0.8)' },
                    ]}
                  >
                    {summary
                      ? `${summary.distinctSymptoms} symptom${
                          summary.distinctSymptoms === 1 ? '' : 's'
                        } tracked · ${formatTotalDuration(summary.totalDurationSec)} recorded`
                      : '4 symptoms tracked · 18h 12m recorded'}
                  </Text>
                  {!isReal && (
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: 'rgba(255,255,255,0.55)',
                          marginTop: 4,
                          fontStyle: 'italic',
                        },
                      ]}
                    >
                      Example data — log a few entries to see your own.
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Symptom frequency */}
            <View>
              <SectionLabel label="Symptom frequency" />
              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                  shadows.card,
                ]}
              >
                {symptoms.map((s, i) => (
                  <SymptomRowView
                    key={s.name}
                    row={s}
                    isFirst={i === 0}
                  />
                ))}
              </View>
            </View>

            {/* Correlations */}
            <View>
              <View style={styles.labelRow}>
                <SectionLabel label="Patterns detected" />
                <Text
                  style={[
                    typography.label,
                    {
                      color: colors.accent,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
                  {CORRELATIONS.length}
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {CORRELATIONS.map((c, i) => (
                  <CorrelationCard key={i} corr={c} />
                ))}
              </View>
            </View>

            {/* Heatmap */}
            <View>
              <SectionLabel label="When symptoms strike" />
              <View
                style={[
                  styles.heatCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                  shadows.card,
                ]}
              >
                <Heatmap grid={heatmap ?? DEMO_HEATMAP} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textTertiary,
                      marginTop: 10,
                      lineHeight: 16,
                    },
                  ]}
                >
                  {peakLabel ? (
                    <>
                      Your entries cluster in the{' '}
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontFamily: 'Inter_600SemiBold',
                        }}
                      >
                        {peakLabel}
                      </Text>
                      .
                    </>
                  ) : (
                    'Log more entries to see when symptoms strike.'
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  paddingHorizontal: spacing.s4,
                  paddingBottom: spacing.s2,
                },
              ]}
            >
              Patterns are observational, based on your notes. Not a diagnosis.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

/* -------------------- Subcomponents -------------------- */

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.label,
        {
          color: colors.textTertiary,
          fontFamily: 'Inter_600SemiBold',
          letterSpacing: 1.1,
          marginBottom: 8,
          textTransform: 'uppercase',
        },
      ]}
    >
      {label}
    </Text>
  );
}

function SymptomRowView({
  row,
  isFirst,
}: {
  row: SymptomRow;
  isFirst: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const Trend =
    row.trend === 'up' ? TrendingUp : row.trend === 'down' ? TrendingDown : Dot;
  const trendColor =
    row.trend === 'up' ? '#E07A5F' : row.trend === 'down' ? '#5A8F6E' : colors.textTertiary;
  return (
    <View
      style={[
        styles.symptomRow,
        !isFirst && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.symptomHeader}>
        <View
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: row.color,
            }}
          />
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
            ]}
            numberOfLines={1}
          >
            {row.name}
          </Text>
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
          >
            {row.count}×
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkline data={row.sparkline} color={row.color} />
          <Trend size={12} color={trendColor} strokeWidth={2} />
        </View>
      </View>
      <View style={[styles.symptomTrack, { backgroundColor: colors.bgMuted }]}>
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
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 24;
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const lastX = w;
  const lastY =
    h - ((data[data.length - 1]! - min) / range) * h;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </Svg>
  );
}

function CorrelationCard({
  corr,
}: {
  corr: {
    a: string;
    b: string;
    strength: number;
    pattern: string;
    severity: string;
  };
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const severityColor = corr.severity === 'strong' ? '#E07A5F' : '#D97706';
  return (
    <View
      style={[
        styles.corrCard,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <View style={styles.corrHead}>
        <View
          style={[
            styles.corrPill,
            { backgroundColor: '#2C6E6B22' },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: '#2C6E6B', fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            {corr.a}
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary }}>↔</Text>
        <View
          style={[
            styles.corrPill,
            { backgroundColor: '#E07A5F22' },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: '#E07A5F', fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            {corr.b}
          </Text>
        </View>
        <Text
          style={{
            color: severityColor,
            fontFamily: 'Inter_700Bold',
            fontSize: 11,
            marginLeft: 'auto',
          }}
        >
          {corr.severity.toUpperCase()}
        </Text>
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, marginTop: 8, lineHeight: 20 },
        ]}
      >
        {corr.pattern}
      </Text>
      <View style={[styles.corrTrack, { backgroundColor: colors.bgMuted }]}>
        <View
          style={{
            width: `${corr.strength * 100}%`,
            height: '100%',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#F6C06A', '#E07A5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    </View>
  );
}

function Heatmap({ grid }: { grid: number[][] }) {
  const styles = useStyles();
  return (
    <View>
      <View style={styles.heatHeaderRow}>
        <View style={{ width: 40 }} />
        {DAY_COLS.map((d, i) => (
          <View key={i} style={styles.heatCol}>
            <Text style={styles.heatLabel}>{d}</Text>
          </View>
        ))}
      </View>
      {ROW_LABELS.map((row, rIdx) => (
        <View key={rIdx} style={styles.heatRowView}>
          <View style={{ width: 40, alignItems: 'flex-end', paddingRight: 4 }}>
            <Text style={styles.heatLabel}>{row}</Text>
          </View>
          {Array.from({ length: 7 }).map((_, col) => {
            const cell = grid[rIdx]?.[col] ?? 0;
            return (
              <View key={col} style={styles.heatCol}>
                <View
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: `rgba(44,110,107,${0.08 + cell * 0.7})`,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
  },
  rangeWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  rangeBtn: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  headlineBlob: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(246,192,106,0.15)',
  },
  headlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCard: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  symptomRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  symptomTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  corrCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  corrHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  corrPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  corrTrack: {
    height: 4,
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  heatCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heatRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heatCol: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  heatCell: {
    flex: 1,
    borderRadius: 3,
  },
  heatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#8A9290',
    textAlign: 'center',
  },
}));
