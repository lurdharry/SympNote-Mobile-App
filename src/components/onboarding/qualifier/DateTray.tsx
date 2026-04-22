import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronRight } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
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
  { label: 'In 3 days', addDays: 3 },
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

function formatLong(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPretty(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Answer UI for the appointment-date question. Lets the user tap a
 * preset, open the native date picker for a custom date, or mark the
 * appointment as not yet scheduled.
 */
export function DateTray({ onAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(() => addDays(today, 7));
  const [pickerOpen, setPickerOpen] = useState(false);

  const daysFromNow = daysBetween(today, selected);
  const countdownLabel =
    daysFromNow === 0
      ? 'today'
      : daysFromNow === 1
      ? 'tomorrow'
      : `in ${daysFromNow} days`;

  const handlePreset = (p: Preset) => {
    hapticLight();
    setSelected(addDays(today, p.addDays));
  };

  const handlePickerChange = (_ev: DateTimePickerEvent, date?: Date) => {
    // Android auto-dismisses; iOS stays open on spinner/inline. We close
    // explicitly after a value comes through so the flow feels decisive.
    if (Platform.OS !== 'ios') setPickerOpen(false);
    if (date) setSelected(startOfDay(date));
  };

  const openPicker = () => {
    hapticLight();
    setPickerOpen(true);
  };

  const dismissPicker = () => setPickerOpen(false);

  const confirm = () => {
    onAnswer({
      t: formatPretty(selected),
      v: 'scheduled',
    });
  };

  const markUnscheduled = () =>
    onAnswer({ t: 'Not scheduled yet', v: 'none' });

  // Which preset (if any) is currently active.
  const activePreset = PRESETS.find((p) => p.addDays === daysFromNow);

  return (
    <View style={styles.root}>
      {/* Selected-date card — tappable to open the picker. */}
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Pick date. Currently ${formatLong(selected)}`}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed || disabled ? 0.85 : 1 },
        ]}
      >
        <View style={styles.iconTile}>
          <Calendar size={moderateScale(18)} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>Appointment date</Text>
          <Text style={styles.dateValue}>{formatPretty(selected)}</Text>
          <Text style={styles.countdown}>{countdownLabel}</Text>
        </View>
        <ChevronRight size={moderateScale(18)} color={colors.textTertiary} />
      </Pressable>

      {/* Preset chips. */}
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
                active && styles.chipActive,
                {
                  borderColor: active
                    ? colors.accent
                    : colors.border,
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
                  { color: active ? colors.accent : colors.textPrimary },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Action row. */}
      <View style={styles.actions}>
        <Pressable
          onPress={markUnscheduled}
          disabled={disabled}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { opacity: pressed || disabled ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Not scheduled yet"
        >
          <Text style={styles.secondaryLabel}>Not scheduled</Text>
        </Pressable>
        <Pressable
          onPress={confirm}
          disabled={disabled}
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: pressed || disabled ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Use ${formatPretty(selected)}`}
        >
          <LinearGradient
            colors={['#3BA79F', '#2C6E6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.primaryLabel}>Use this date</Text>
        </Pressable>
      </View>

      {/* Native picker. Rendered inline as a spinner on iOS, dialog on
          Android. Kept below the tray so the preset state is still
          visible on iOS while the picker is open. */}
      {pickerOpen && Platform.OS === 'ios' && (
        <View style={styles.pickerWrap}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderLabel}>Pick a date</Text>
            <Pressable onPress={dismissPicker} hitSlop={8}>
              <Text style={styles.pickerDone}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={selected}
            mode="date"
            display="spinner"
            minimumDate={today}
            onChange={handlePickerChange}
          />
        </View>
      )}
      {pickerOpen && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          minimumDate={today}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { gap: spacing.s3 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  iconTile: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent + '1A',
  },
  cardLabel: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
  },
  dateValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: moderateScale(2),
  },
  countdown: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    marginTop: moderateScale(2),
    fontFamily: 'Inter_600SemiBold',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
  },
  chipActive: {
    backgroundColor: theme.colors.accent + '14',
  },
  chipLabel: {
    ...theme.typography.label,
    fontSize: fontScale(13),
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s2,
  },
  secondaryBtn: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgMuted,
  },
  secondaryLabel: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryBtn: {
    flex: 2,
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryLabel: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  pickerWrap: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  pickerHeaderLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  pickerDone: {
    ...theme.typography.label,
    color: theme.colors.accent,
    fontFamily: 'Inter_700Bold',
  },
}));
