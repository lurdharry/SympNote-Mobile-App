import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import {
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
import { daysUntil, formatDate, formatTime } from '@/utils/date';

interface UpNextCardProps {
  appointment: Appointment | undefined;
  onPress: () => void;
}

interface UpNextDisplay {
  doctor: string;
  specialty: string;
  when: string;
  timeLabel: string;
}

const displayFor = (appointment: Appointment | undefined): UpNextDisplay => {
  if (!appointment) {
    return {
      doctor: 'Dr. Chen',
      specialty: 'Rheumatology',
      when: 'Fri Nov 28',
      timeLabel: '2:00 PM · in 7d',
    };
  }
  return {
    doctor: appointment.doctorName,
    specialty: appointment.specialty,
    when: formatDate(appointment.date),
    timeLabel: `${formatTime(appointment.date)} · in ${Math.max(0, daysUntil(appointment.date))}d`,
  };
};

export const UpNextCard: React.FC<UpNextCardProps> = ({ appointment, onPress }) => {
  useTheme();
  const styles = useStyles();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 12 }],
  }));

  const { doctor, specialty, when, timeLabel } = displayFor(appointment);

  return (
    <Animated.View style={[{ marginTop: spacing.s3 }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <View style={[styles.card, shadows.elevated]}>
          <LinearGradient
            colors={['#2C6E6B', '#1F504E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.decoBlob} />

          <Text style={styles.eyebrow}>NEXT VISIT</Text>
          <Text style={[typography.h1, { color: '#FFFFFF', marginTop: 4 }]}>
            {doctor}
          </Text>
          <Text
            style={[
              typography.body,
              { color: 'rgba(255,255,255,0.75)', marginTop: 2 },
            ]}
          >
            {specialty}
          </Text>

          <View style={styles.foot}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {when}
              </Text>
              <Text
                style={[
                  typography.h3,
                  { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
                ]}
              >
                {timeLabel}
              </Text>
            </View>
            <View style={styles.prepReady}>
              <Sparkles size={12} color="#F6C06A" strokeWidth={2} />
              <Text
                style={[
                  typography.label,
                  { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
                ]}
              >
                Prep ready
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    padding: moderateScale(20),
    overflow: 'hidden',
  },
  decoBlob: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(246,192,106,0.1)',
  },
  eyebrow: {
    ...typography.caption,
    color: 'rgba(246,192,106,0.9)',
    letterSpacing: 1.4,
    fontFamily: 'DMSans_600SemiBold',
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s4,
    gap: moderateScale(12),
  },
  prepReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
}));
