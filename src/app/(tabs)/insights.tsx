import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useInsightsData } from '@/hooks/useInsightsData';
import { BodySystemBreakdownCard } from '@/components/insights/BodySystemBreakdownCard';
import { HeadlineCard } from '@/components/insights/HeadlineCard';
import { PeriodCompareCard } from '@/components/insights/PeriodCompareCard';
import { PostVisitOutcomeCard } from '@/components/insights/PostVisitOutcomeCard';
import { RangeSelector } from '@/components/insights/RangeSelector';
import { RedFlagRollupCard } from '@/components/insights/RedFlagRollupCard';
import { SeverityTrendCard } from '@/components/insights/SeverityTrendCard';
import { SymptomFrequencyList } from '@/components/insights/SymptomFrequencyList';
import { TriggerCorrelationCard } from '@/components/insights/TriggerCorrelationCard';
import { TriggerFrequencyList } from '@/components/insights/TriggerFrequencyList';
import { Heatmap } from '@/components/insights/Heatmap';
import { InsightsEmpty } from '@/components/insights/InsightsEmpty';

const INSIGHTS_THRESHOLD = 3;

const TabInsights: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const {
    range,
    setRange,
    summary,
    symptoms,
    triggers,
    severity,
    bodySystems,
    redFlag,
    correlation,
    comparison,
    postVisit,
    streak,
    heatmap,
    peakLabel,
    hasEnoughData,
    inRangeCount,
    totalRecordings,
  } = useInsightsData();

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
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

          <View style={styles.rangeSlot}>
            <RangeSelector range={range} onChange={setRange} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {!hasEnoughData || !summary || !heatmap ? (
              <InsightsEmpty
                inRangeCount={inRangeCount}
                threshold={INSIGHTS_THRESHOLD}
                totalEmpty={totalRecordings === 0}
              />
            ) : (
              <>
                <HeadlineCard range={range} summary={summary} streak={streak} />

                {comparison && (
                  <PeriodCompareCard comparison={comparison} />
                )}

                {redFlag.concerningCount > 0 && (
                  <RedFlagRollupCard rollup={redFlag} />
                )}

                {postVisit && (
                  <View>
                    <SectionLabel label="Post-visit" />
                    <PostVisitOutcomeCard outcome={postVisit} />
                  </View>
                )}

                {severity && severity.sampleCount > 0 && (
                  <View>
                    <SectionLabel label="Severity trend" />
                    <SeverityTrendCard summary={severity} />
                  </View>
                )}

                {correlation && (
                  <View>
                    <SectionLabel label="Pattern" />
                    <TriggerCorrelationCard correlation={correlation} />
                  </View>
                )}

                <View>
                  <SectionLabel label="Symptom frequency" />
                  <SymptomFrequencyList symptoms={symptoms} />
                </View>

                {triggers.length > 0 && (
                  <View>
                    <SectionLabel label="Top triggers" />
                    <TriggerFrequencyList triggers={triggers} />
                  </View>
                )}

                {bodySystems.length > 0 && (
                  <View>
                    <SectionLabel label="Body systems touched" />
                    <BodySystemBreakdownCard slices={bodySystems} />
                  </View>
                )}

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
                    <Heatmap grid={heatmap} />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.textTertiary,
                          marginTop: 10,
                          lineHeight: fontScale(16),
                        },
                      ]}
                    >
                      {peakLabel ? (
                        <>
                          Your entries cluster in the{' '}
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontFamily: 'DMSans_600SemiBold',
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
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default TabInsights;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
  },
  rangeSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s3,
  },
  scroll: {
    paddingHorizontal: spacing.s6,
    paddingBottom: 120,
    gap: spacing.s5,
  },
  heatCard: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
}));
