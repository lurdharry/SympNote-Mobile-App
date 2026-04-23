import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';
import { CalendarCheck, CalendarX, CircleHelp } from 'lucide-react-native';
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
import type { Appointment } from '@/stores/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hapticLight, hapticSuccess } from '@/services/haptics';

interface PostVisitPromptProps {
  appointment: Appointment;
  onAttended: () => void;
  onMissed: () => void;
  onCancelled: () => void;
}

/**
 * Home-screen nudge for appointments whose date has passed but are
 * still marked `upcoming`. Shown one at a time (oldest first); once
 * the user picks an action, the appointment moves to its terminal
 * state and this card disappears. If more unresolved exist, the next
 * one surfaces on the next render.
 *
 * Copy is direct and asks what actually happened — no softening
 * ("review your visit") because the three real answers are: I went,
 * I didn't go, it was cancelled.
 */
export const PostVisitPrompt: React.FC<PostVisitPromptProps> = ({
  appointment,
  onAttended,
  onMissed,
  onCancelled,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const opacity = useSharedValue(reduced ? 1 : 0);
  const translate = useSharedValue(reduced ? 0 : 12);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(
      60,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
    translate.value = withDelay(
      60,
      withSpring(0, { damping: 18, stiffness: 140, mass: 0.7 }),
    );
  }, [reduced, opacity, translate]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  const when = format(parseISO(appointment.date), 'EEEE, MMM d');

  const handleAttended = () => {
    hapticSuccess();
    onAttended();
  };
  const handleMissed = () => {
    hapticLight();
    onMissed();
  };
  const handleCancelled = () => {
    hapticLight();
    onCancelled();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + '33' },
        shadows.card,
        enterStyle,
      ]}
    >
      <LinearGradient
        colors={[colors.accent + '10', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <View style={[styles.iconTile, { backgroundColor: colors.accent + '1A' }]}>
          <CircleHelp size={moderateScale(16)} color={colors.accent} strokeWidth={2.2} />
        </View>
        <Text
          style={[
            typography.label,
            {
              color: colors.accent,
              fontFamily: 'DMSans_700Bold',
              letterSpacing: 0.8,
              fontSize: fontScale(10),
            },
          ]}
        >
          QUICK CHECK-IN
        </Text>
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        Did you see {appointment.doctorName}?
      </Text>
      <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
        {when}
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={handleAttended}
          style={[styles.primary, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={`Mark attended: ${appointment.doctorName} on ${when}`}
        >
          <CalendarCheck size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.primaryLabel}>I went</Text>
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            onPress={handleMissed}
            style={[
              styles.secondary,
              { backgroundColor: colors.bgMuted, borderColor: colors.border },
            ]}
            accessibilityRole="button"
          >
            <CalendarX size={moderateScale(12)} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={[typography.label, { color: colors.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>
              Didn't go
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCancelled}
            style={[
              styles.secondary,
              { backgroundColor: colors.bgMuted, borderColor: colors.border },
            ]}
            accessibilityRole="button"
          >
            <CalendarX size={moderateScale(12)} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={[typography.label, { color: colors.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>
              Cancelled
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: spacing.s3,
  },
  iconTile: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    ...theme.typography.h3,
    fontFamily: 'Fraunces_500Medium',
    letterSpacing: -0.3,
  },
  actions: {
    marginTop: spacing.s4,
    gap: moderateScale(8),
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    height: verticalScale(44),
    borderRadius: theme.radius.full,
  },
  primaryLabel: {
    ...theme.typography.label,
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(14),
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    height: verticalScale(40),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: scale(10),
  },
}));
