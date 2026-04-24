import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ArrowRight, CalendarCheck } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import type { PostVisitOutcome } from '@/utils/insights';

interface PostVisitOutcomeCardProps {
  outcome: PostVisitOutcome;
}

/**
 * Compares mean severity before vs after the most recent attended
 * visit. Numbers are shown with one decimal so small real changes
 * don't look like integer jumps. Copy frames the change as "severity
 * has trended" — the doctor isn't necessarily the cause, but
 * post-visit is a reasonable anchor to reflect on.
 */
export const PostVisitOutcomeCard: React.FC<PostVisitOutcomeCardProps> = ({
  outcome,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { doctor, attendedAt, beforeMean, afterMean, beforeCount, afterCount, direction } =
    outcome;

  const tint =
    direction === 'better'
      ? colors.success
      : direction === 'worse'
        ? colors.coral
        : colors.textTertiary;

  const headline =
    direction === 'better'
      ? 'Severity trending better'
      : direction === 'worse'
        ? 'Severity trending worse'
        : 'Severity holding steady';

  const visitDate = format(parseISO(attendedAt), 'MMM d');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tint + '14' }]}>
          <CalendarCheck size={moderateScale(15)} color={tint} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
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
            SINCE YOU SAW {doctor.toUpperCase()} · {visitDate.toUpperCase()}
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
            {headline}
          </Text>
        </View>
      </View>

      <View style={styles.meanRow}>
        <View style={styles.meanBlock}>
          <Text style={[styles.meanLabel, { color: colors.textTertiary }]}>
            Before
          </Text>
          <Text style={[styles.meanValue, { color: colors.textPrimary }]}>
            {beforeMean.toFixed(1)}
          </Text>
          <Text style={[styles.meanFoot, { color: colors.textTertiary }]}>
            {beforeCount} {beforeCount === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        <ArrowRight size={moderateScale(18)} color={tint} strokeWidth={2.2} />

        <View style={styles.meanBlock}>
          <Text style={[styles.meanLabel, { color: colors.textTertiary }]}>
            After
          </Text>
          <Text style={[styles.meanValue, { color: tint }]}>
            {afterMean.toFixed(1)}
          </Text>
          <Text style={[styles.meanFoot, { color: colors.textTertiary }]}>
            {afterCount} {afterCount === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.s4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  iconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  meanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: moderateScale(12),
  },
  meanBlock: {
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  meanLabel: {
    ...theme.typography.caption,
    fontSize: fontScale(11),
    letterSpacing: 0.3,
  },
  meanValue: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(32),
    lineHeight: fontScale(36),
    letterSpacing: -0.8,
    marginTop: 2,
  },
  meanFoot: {
    ...theme.typography.caption,
    fontSize: fontScale(11),
    marginTop: 2,
  },
}));
