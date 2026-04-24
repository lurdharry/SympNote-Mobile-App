import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { PrepRow } from '@/hooks/usePrepRows';
import { findSpecialty } from '@/constants/specialties';
import { hapticLight } from '@/services/haptics';

interface AppointmentCardProps {
  row: PrepRow;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ row }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const specialty = findSpecialty(row.spec);
  const SpecIcon = specialty.Icon;
  const isStale = row.briefState === 'stale';

  const openFullBrief = () => {
    hapticLight();
    router.push(`/appointment/${row.id}`);
  };

  const briefLabel =
    row.briefState === 'none'
      ? 'Draft your visit brief'
      : isStale
        ? 'Refresh brief · new entries'
        : 'View your visit brief';

  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [enter]);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 10 }],
  }));

  return (
    <Animated.View style={[enterStyle, { marginBottom: spacing.s4 }]}>
      <Pressable
        onPress={openFullBrief}
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.elevated,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Visit with ${row.doc}, ${row.dateLabel}`}
      >
        {/* Gradient hero band carries the specialty identity at a glance. */}
        <View style={styles.hero}>
          <LinearGradient
            colors={specialty.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.heroBlob} />
          <View style={styles.heroRow}>
            <View style={styles.specTile}>
              <SpecIcon size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {row.doc}
              </Text>
              <Text style={styles.specLabel} numberOfLines={1}>
                {row.spec}
              </Text>
            </View>
            <View style={styles.countdown}>
              <Text style={styles.countdownNum}>{row.inDays}</Text>
              <Text style={styles.countdownLabel}>
                {row.inDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Calendar size={moderateScale(13)} color={colors.textTertiary} strokeWidth={2} />
          <Text
            style={[typography.label, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {row.dateLabel} · {row.timeLabel}
          </Text>
        </View>

        <View style={styles.briefCTA}>
          <LinearGradient
            colors={isStale ? ['#F6C06A', '#D9964A'] : specialty.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.briefCTAText} numberOfLines={1}>
            {briefLabel}
          </Text>
          <ArrowRight size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  hero: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    overflow: 'hidden',
  },
  heroBlob: {
    position: 'absolute',
    right: -scale(40),
    top: -verticalScale(40),
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  specTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    ...theme.typography.h3,
    fontFamily: 'Fraunces_500Medium',
    color: '#FFFFFF',
    fontSize: fontScale(19),
    lineHeight: fontScale(24),
    letterSpacing: -0.3,
  },
  specLabel: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  countdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    minWidth: moderateScale(54),
  },
  countdownNum: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(22),
    lineHeight: fontScale(24),
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  countdownLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(10),
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.6,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
  },
  briefCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  briefCTAText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
