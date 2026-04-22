import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { Badge } from '@/hooks/useSettingsStats';
import { BADGE_STYLES } from '@/constants/settingsBadges';
import { levelTitle } from '@/utils/levelTitle';

interface MilestonesCardProps {
  level: number;
  xp: number;
  xpForNextLevel: number;
  levelProgress: number;
  badges: Badge[];
}

export const MilestonesCard: React.FC<MilestonesCardProps> = ({
  level,
  xp,
  xpForNextLevel,
  levelProgress,
  badges,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>Milestones</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        <View style={styles.headRow}>
          <ProgressRing value={levelProgress} size={48} stroke={4}>
            <Text
              style={[
                typography.caption,
                { color: colors.accent, fontFamily: 'DMSans_700Bold' },
              ]}
            >
              LV {level}
            </Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.body,
                { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
              ]}
            >
              {levelTitle(level)}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {xp} / {xpForNextLevel} XP to Level {level + 1}
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
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  section: {
    paddingHorizontal: spacing.s6,
    marginBottom: spacing.s5,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(13),
    lineHeight: fontScale(16),
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingBottom: verticalScale(8),
  },
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
    marginTop: verticalScale(12),
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
}));
