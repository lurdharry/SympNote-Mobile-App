import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link2 } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
import type { TriggerCorrelation } from '@/utils/insights';

interface TriggerCorrelationCardProps {
  correlation: TriggerCorrelation;
}

/**
 * Surfaces the single strongest (trigger, symptom) co-occurrence when
 * one is strong enough to report honestly. Copy is deliberately
 * observational ("appears with", not "causes") because the data is
 * correlational — the user and their doctor are the ones who
 * interpret whether it's causal. Renders nothing when no pairing
 * clears the threshold (common at low entry counts).
 */
export const TriggerCorrelationCard: React.FC<TriggerCorrelationCardProps> = ({
  correlation,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { symptom, trigger, coCount, symptomCount, pct } = correlation;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accent + '14' }]}>
          <Link2 size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
        </View>
        <Text
          style={[
            typography.label,
            {
              color: colors.textTertiary,
              fontFamily: 'DMSans_700Bold',
              letterSpacing: 0.8,
            },
          ]}
        >
          PATTERN WORTH NOTING
        </Text>
      </View>

      <Text style={[styles.body, { color: colors.textPrimary }]}>
        <Text style={styles.accent}>{trigger}</Text> appears with your{' '}
        <Text style={styles.accent}>{symptom.toLowerCase()}</Text> entries{' '}
        <Text style={styles.accent}>
          {coCount} of {symptomCount} times
        </Text>{' '}
        ({pct}%).
      </Text>

      <Text style={[styles.footnote, { color: colors.textTertiary }]}>
        Observation only, not a cause. Worth raising at your next visit.
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: theme.spacing.s3,
  },
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...theme.typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
  },
  accent: {
    fontFamily: 'DMSans_700Bold',
  },
  footnote: {
    ...theme.typography.caption,
    marginTop: theme.spacing.s3,
    fontStyle: 'italic',
  },
}));
