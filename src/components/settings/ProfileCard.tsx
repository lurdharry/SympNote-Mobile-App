import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit as EditIcon } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
import { StreakPill } from '@/components/ui/StreakPill';
import { hapticLight } from '@/services/haptics';

interface ProfileCardProps {
  recordingsCount: number;
  streak: number;
}

const pluralizeEntries = (n: number): string => {
  if (n === 0) return 'No entries yet';
  return `${n} ${n === 1 ? 'entry' : 'entries'} logged`;
};

const streakLabel = (streak: number): string => {
  if (streak === 0) return 'Log an entry to start a streak';
  return streak === 1 ? '1-day streak' : `${streak}-day streak`;
};

export const ProfileCard: React.FC<ProfileCardProps> = ({ recordingsCount, streak }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.avatar}>
        <LinearGradient
          colors={['#2C6E6B', '#1F504E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.avatarLetter}>Y</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
          You
        </Text>
        <Text
          style={[typography.caption, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {pluralizeEntries(recordingsCount)}
        </Text>
        <View style={styles.streakRow}>
          {streak > 0 ? (
            <>
              <StreakPill days={streak} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {streakLabel(streak)}
              </Text>
            </>
          ) : (
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {streakLabel(streak)}
            </Text>
          )}
        </View>
      </View>

      <Pressable hitSlop={8} onPress={() => hapticLight()}>
        <EditIcon size={16} color={colors.textTertiary} strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(22),
  },
  streakRow: {
    marginTop: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
}));
