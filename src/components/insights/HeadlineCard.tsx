import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart as LineChartIcon } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  verticalScale,
} from '@/theme';
import type { InsightsRange, InsightsSummary } from '@/utils/insights';
import { formatTotalDuration, rangeLabel } from '@/utils/insights';

interface HeadlineCardProps {
  range: InsightsRange;
  summary: InsightsSummary;
}

const recordingsText = (summary: InsightsSummary): string =>
  `${summary.recordingCount} voice note${summary.recordingCount === 1 ? '' : 's'}`;

const tagsText = (summary: InsightsSummary): string =>
  `${summary.distinctSymptoms} symptom${
    summary.distinctSymptoms === 1 ? '' : 's'
  } tracked · ${formatTotalDuration(summary.totalDurationSec)} recorded`;

export const HeadlineCard: React.FC<HeadlineCardProps> = ({ range, summary }) => {
  const styles = useStyles();

  return (
    <View style={[styles.card, shadows.elevated]}>
      <LinearGradient
        colors={['#2C6E6B', '#1F504E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.blob} />

      <View style={styles.content}>
        <View style={styles.icon}>
          <LineChartIcon size={22} color="#F6C06A" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.label,
              {
                color: '#F6C06A',
                fontFamily: 'DMSans_600SemiBold',
                letterSpacing: 0.8,
              },
            ]}
          >
            {rangeLabel(range).toUpperCase()}
          </Text>
          <Text
            style={[
              typography.h2,
              { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            {recordingsText(summary)}
          </Text>
          <Text
            style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}
          >
            {tagsText(summary)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    // Fallback color behind the LinearGradient so the card is never
    // fully transparent if the gradient layer fails to render.
    backgroundColor: '#2C6E6B',
  },
  blob: {
    position: 'absolute',
    right: -scale(32),
    top: -verticalScale(32),
    width: moderateScale(128),
    height: moderateScale(128),
    borderRadius: moderateScale(64),
    backgroundColor: 'rgba(246,192,106,0.15)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  icon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
