import React from 'react';
import { Text, View } from 'react-native';
import { fontScale, spacing, typography, useTheme } from '@/theme';
import type { ConcernDemo } from '@/constants/demo/prep';
import { ConcernRow } from './ConcernRow';

interface SummarySectionProps {
  concerns: ConcernDemo[];
  timeline: string;
  accent: string;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ concerns, timeline, accent }) => {
  const { colors } = useTheme();
  const isEmpty = concerns.length === 0 && !timeline;

  if (isEmpty) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s6,
            lineHeight: fontScale(20),
          },
        ]}
      >
        Log entries leading up to this visit and they'll be summarized here.
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {concerns.map((c, i) => (
        <ConcernRow key={`${i}-${c.t}`} concern={c} accent={accent} />
      ))}
      {!!timeline && (
        <View style={{ marginTop: 6 }}>
          <Text
            style={[
              typography.label,
              {
                color: colors.textTertiary,
                fontFamily: 'DMSans_600SemiBold',
                letterSpacing: 1,
                marginBottom: 4,
              },
            ]}
          >
            TIMELINE
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, lineHeight: fontScale(20) },
            ]}
          >
            {timeline}
          </Text>
        </View>
      )}
    </View>
  );
};
