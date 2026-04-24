import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { RedFlagRollup } from '@/utils/insights';

interface RedFlagRollupCardProps {
  rollup: RedFlagRollup;
}

/**
 * Safety roll-up. Renders only when at least one concerning entry
 * shows up in the range. Deliberately non-alarmist — shows a count
 * and the most common flag phrases so the user can raise them at a
 * visit without feeling like the app is diagnosing them.
 */
export const RedFlagRollupCard: React.FC<RedFlagRollupCardProps> = ({ rollup }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const { concerningCount, flags } = rollup;
  if (concerningCount === 0) return null;

  const tint = colors.error;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tint + '14', borderColor: tint + '55' },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
          <AlertTriangle size={moderateScale(16)} color={tint} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.label,
              {
                color: tint,
                fontFamily: 'DMSans_700Bold',
                letterSpacing: 0.8,
              },
            ]}
          >
            WORTH RAISING
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
            {concerningCount}{' '}
            {concerningCount === 1 ? 'entry' : 'entries'} your doctor should hear
          </Text>
        </View>
      </View>

      {flags.length > 0 && (
        <View style={styles.flagRow}>
          {flags.map((f) => (
            <View
              key={f}
              style={[styles.flagChip, { borderColor: tint + '55' }]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: colors.textPrimary, fontFamily: 'DMSans_500Medium' },
                ]}
                numberOfLines={1}
              >
                {f}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.s3,
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
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  flagChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
}));
