import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { Badge } from '@/hooks/useSettingsStats';
import { BADGE_STYLES } from '@/constants/settingsBadges';

interface MilestonesCardProps {
  recordingsCount: number;
  summariesCount: number;
  badges: Badge[];
}

/**
 * Real milestones, no game scaffold. A summary line ("X notes · Y
 * briefs prepped") gives the user honest context, then a 4-cell
 * grid of badges — locked badges desaturated, unlocked ones in
 * their tint. No ring, no level number, no XP bar.
 */
export const MilestonesCard: React.FC<MilestonesCardProps> = ({
  recordingsCount,
  summariesCount,
  badges,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            {unlockedCount} of {badges.length} milestones
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
            {' · '}
            {summariesCount} {summariesCount === 1 ? 'brief prepped' : 'briefs prepped'}
          </Text>
        </View>
      </View>

      <View style={styles.badgeGrid}>
        {badges.map((b) => {
          const { Icon, tint } = BADGE_STYLES[b.key](colors);
          return (
            <View key={b.key} style={styles.badgeCell}>
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor: tint + (b.unlocked ? '22' : '11'),
                    opacity: b.unlocked ? 1 : 0.35,
                  },
                ]}
              >
                <Icon
                  size={20}
                  color={b.unlocked ? tint : colors.textTertiary}
                  strokeWidth={2}
                />
              </View>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginTop: 4 },
                ]}
                numberOfLines={1}
              >
                {b.label}
              </Text>
            </View>
          );
        })}
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
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeGrid: {
    marginTop: verticalScale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
  },
  badgeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: fontScale(11),
  },
}));
