import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, TrendingUp } from 'lucide-react-native';
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
import { hapticLight } from '@/services/haptics';

interface InsightsEmptyProps {
  /** Current recordings inside the selected range. */
  inRangeCount: number;
  /** Threshold needed to unlock insights. */
  threshold: number;
  /** True when the user has zero recordings overall. */
  totalEmpty: boolean;
}

const clampPct = (n: number): number => Math.min(100, Math.max(0, n));

export const InsightsEmpty: React.FC<InsightsEmptyProps> = ({
  inRangeCount,
  threshold,
  totalEmpty,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const remaining = Math.max(0, threshold - inRangeCount);
  const pct = clampPct((inRangeCount / threshold) * 100);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconRing, { backgroundColor: colors.accent + '14' }]}>
        <TrendingUp size={moderateScale(28)} color={colors.accent} strokeWidth={2} />
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        {totalEmpty ? 'No insights yet' : 'Almost there'}
      </Text>
      <Text style={[styles.caption, { color: colors.textTertiary }]}>
        {totalEmpty
          ? 'Log your first few entries and Sympnote will start showing patterns. Trending symptoms, time of day heatmap, and more.'
          : `Log ${remaining} more ${remaining === 1 ? 'entry' : 'entries'} in this range and Sympnote will surface patterns here.`}
      </Text>

      <View style={[styles.progressTrack, { backgroundColor: colors.bgMuted }]}>
        <View style={[styles.progressFill, { width: `${pct}%` }]}>
          <LinearGradient
            colors={[colors.accent, '#1F504E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 6 }]}>
        {inRangeCount} / {threshold} entries
      </Text>

      <Pressable
        onPress={() => {
          hapticLight();
          router.push('/record');
        }}
        style={[styles.cta, shadows.accentGlow]}
      >
        <LinearGradient
          colors={[colors.accent, '#1F504E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Mic size={moderateScale(16)} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.ctaLabel}>Log an entry</Text>
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: spacing.s6,
  },
  iconRing: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s5,
  },
  headline: {
    ...theme.typography.serifHeadline,
    fontSize: fontScale(24),
    lineHeight: fontScale(30),
    textAlign: 'center',
  },
  caption: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing.s2,
    maxWidth: moderateScale(320),
  },
  progressTrack: {
    width: '100%',
    maxWidth: moderateScale(280),
    height: verticalScale(6),
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: theme.spacing.s5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  cta: {
    marginTop: theme.spacing.s6,
    height: verticalScale(48),
    paddingHorizontal: moderateScale(24),
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    overflow: 'hidden',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(15),
  },
}));
