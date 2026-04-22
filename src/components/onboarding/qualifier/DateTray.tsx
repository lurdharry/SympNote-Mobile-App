import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from '../../../theme';
import { Option } from '../../../constants/onboarding';
import { hapticLight } from '../../../services/haptics';

type Props = {
  onAnswer: (o: Option) => void;
  disabled: boolean;
};

type Preset = { label: string; addDays: number };

const PRESETS: Preset[] = [
  { label: 'Tomorrow', addDays: 1 },
  { label: '1 week', addDays: 7 },
  { label: '2 weeks', addDays: 14 },
  { label: '1 month', addDays: 30 },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

function formatHero(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatPersist(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Answer UI for the appointment-date question. One unified card —
 * editorial date as the hero, tapping it toggles the native picker
 * inline; a quiet preset row sits below; a single gradient CTA
 * confirms. "Not scheduled" is demoted to a text link so the primary
 * path reads as one clear decision.
 */
export function DateTray({ onAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(() => addDays(today, 7));
  const [pickerOpen, setPickerOpen] = useState(false);

  const daysFromNow = daysBetween(today, selected);
  const countdown =
    daysFromNow === 0
      ? 'today'
      : daysFromNow === 1
      ? 'tomorrow'
      : `in ${daysFromNow} days`;

  const activePreset = PRESETS.find((p) => p.addDays === daysFromNow);

  const toggle = () => {
    hapticLight();
    setPickerOpen((v) => !v);
  };

  const handlePreset = (p: Preset) => {
    hapticLight();
    setSelected(addDays(today, p.addDays));
  };

  const handlePickerChange = (_ev: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setPickerOpen(false);
    if (date) setSelected(startOfDay(date));
  };

  const confirm = () =>
    onAnswer({ t: formatPersist(selected), v: 'scheduled' });

  const markUnscheduled = () =>
    onAnswer({ t: 'Not scheduled yet', v: 'none' });

  return (
    <Animated.View layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))} style={styles.root}>
      {/* Hero card — tap the header row to toggle the picker. */}
      <View style={styles.card}>
        <Pressable
          onPress={toggle}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Pick date. Currently ${formatHero(selected)}. Tap to change.`}
          style={({ pressed }) => [
            styles.heroPressable,
            { opacity: pressed || disabled ? 0.85 : 1 },
          ]}
        >
          <View style={styles.heroHead}>
            <View style={styles.iconTile}>
              <Calendar size={moderateScale(14)} color={colors.accent} />
            </View>
            <Text style={styles.eyebrow}>Appointment</Text>
            <View style={{ flex: 1 }} />
            <Animated.View
              style={[
                styles.changeHint,
                pickerOpen && styles.changeHintOpen,
              ]}
            >
              <ChevronDown
                size={moderateScale(14)}
                color={colors.textTertiary}
              />
            </Animated.View>
          </View>
          <Text style={styles.heroDate}>{formatHero(selected)}</Text>
          <Text style={styles.heroCountdown}>{countdown}</Text>
        </Pressable>

        {pickerOpen && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(160)}
            style={styles.pickerBay}
          >
            <DateTimePicker
              value={selected}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={today}
              onChange={handlePickerChange}
              themeVariant="light"
              accentColor={colors.accent}
            />
          </Animated.View>
        )}

        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const active = activePreset?.label === p.label;
            return (
              <Pressable
                key={p.label}
                onPress={() => handlePreset(p)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.chip,
                  active && {
                    backgroundColor: colors.accent + '18',
                    borderColor: colors.accent,
                  },
                  {
                    opacity: pressed || disabled ? 0.6 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? colors.accent : colors.textSecondary },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Primary CTA — single, strong. */}
      <Pressable
        onPress={confirm}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Use ${formatHero(selected)}`}
        style={({ pressed }) => [
          styles.cta,
          { opacity: pressed || disabled ? 0.88 : 1 },
        ]}
      >
        <LinearGradient
          colors={['#3BA79F', '#2C6E6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.ctaLabel}>Use this date</Text>
      </Pressable>

      {/* De-emphasized escape hatch. */}
      <Pressable
        onPress={markUnscheduled}
        disabled={disabled}
        hitSlop={8}
        style={styles.linkBtn}
        accessibilityRole="button"
        accessibilityLabel="Not scheduled yet"
      >
        <Text style={styles.linkLabel}>Not scheduled yet</Text>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    gap: moderateScale(12),
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSurface,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  heroPressable: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(12),
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  iconTile: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent + '1F',
  },
  eyebrow: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  changeHint: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgMuted,
  },
  changeHintOpen: {
    transform: [{ rotate: '180deg' }],
  },
  heroDate: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(26),
    lineHeight: fontScale(30),
    letterSpacing: -0.6,
    color: theme.colors.textPrimary,
  },
  heroCountdown: {
    ...theme.typography.label,
    color: theme.colors.accent,
    marginTop: moderateScale(4),
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.3,
  },
  pickerBay: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(4),
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  chip: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgPrimary,
  },
  chipLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
  cta: {
    height: verticalScale(52),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...theme.shadows.accentGlow,
  },
  ctaLabel: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(16),
    letterSpacing: -0.1,
  },
  linkBtn: {
    alignSelf: 'center',
    paddingVertical: verticalScale(4),
  },
  linkLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
}));
