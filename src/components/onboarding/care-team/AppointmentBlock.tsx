import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays, format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { hapticLight } from '@/services/haptics';

interface AppointmentBlockProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  when: Date;
  onChange: (next: Date) => void;
  pickerMode: 'date' | 'time' | null;
  onOpenPicker: (mode: 'date' | 'time') => void;
  onClosePicker: () => void;
  /**
   * When true, the Switch toggle hides and the body always renders.
   * Used on the new-visit screen where adding an appointment is the
   * whole point of being there — a toggle would be redundant. The
   * header and subtext still show so the module feels identical to
   * the onboarding version.
   */
  alwaysOn?: boolean;
}

type Preset = { label: string; days: number };

const PRESETS: Preset[] = [
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
  { label: 'Two weeks', days: 14 },
  { label: 'A month', days: 30 },
];

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  enabled,
  onToggle,
  when,
  onChange,
  pickerMode,
  onOpenPicker,
  onClosePicker,
  alwaysOn = false,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const open = alwaysOn || enabled;

  const handleToggle = (value: boolean) => {
    hapticLight();
    onToggle(value);
  };

  const applyPreset = (days: number) => {
    hapticLight();
    const target = addDays(new Date(), days);
    // Preserve the current time-of-day on the new date.
    target.setHours(when.getHours(), when.getMinutes(), 0, 0);
    onChange(target);
    onClosePicker();
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') onClosePicker();
    if (event.type === 'dismissed') return;
    if (selected) onChange(selected);
  };

  const iosDateDisplay: 'inline' | 'spinner' =
    pickerMode === 'date' ? 'inline' : 'spinner';

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.label,
              styles.label,
              { color: colors.textPrimary },
            ]}
          >
            Upcoming appointment
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            Sympnote will prep a visit brief for this date.
          </Text>
        </View>
        {!alwaysOn && (
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.bgMuted, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {open && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presets}
          >
            {PRESETS.map((p) => {
              const target = addDays(new Date(), p.days);
              const active = isSameDay(when, target);
              return (
                <Pressable
                  key={p.label}
                  onPress={() => applyPreset(p.days)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: active
                        ? colors.accent + '14'
                        : 'transparent',
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.label,
                      {
                        color: active ? colors.accent : colors.textSecondary,
                        fontFamily: 'DMSans_600SemiBold',
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.whenRow}>
            <Pressable
              onPress={() => onOpenPicker('date')}
              style={[styles.whenTile, { borderColor: colors.border }]}
            >
              <View style={[styles.whenIcon, { backgroundColor: colors.accent + '1A' }]}>
                <Calendar size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  Date
                </Text>
                <Text
                  style={[styles.whenValue, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {format(when, 'EEE, MMM d')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => onOpenPicker('time')}
              style={[styles.whenTile, { borderColor: colors.border }]}
            >
              <View style={[styles.whenIcon, { backgroundColor: colors.accent + '1A' }]}>
                <Clock size={moderateScale(14)} color={colors.accent} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  Time
                </Text>
                <Text
                  style={[styles.whenValue, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {format(when, 'h:mm a')}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Android renders DateTimePicker as its own native dialog
              when mounted — no wrapper needed. */}
          {pickerMode && Platform.OS === 'android' && (
            <DateTimePicker
              value={when}
              mode={pickerMode}
              display="default"
              minimumDate={pickerMode === 'date' ? new Date() : undefined}
              onChange={handlePickerChange}
            />
          )}

          {/* iOS wraps the picker in a centered modal card so the
              calendar doesn't eat the whole page. */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={!!pickerMode}
              transparent
              animationType="fade"
              onRequestClose={onClosePicker}
            >
              <View style={styles.backdrop}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={onClosePicker}
                />
                <View
                  style={[
                    styles.modalCard,
                    { backgroundColor: colors.bgPrimary },
                  ]}
                >
                  {pickerMode && (
                    <DateTimePicker
                      value={when}
                      mode={pickerMode}
                      display={iosDateDisplay}
                      minimumDate={pickerMode === 'date' ? new Date() : undefined}
                      onChange={handlePickerChange}
                      accentColor={colors.accent}
                    />
                  )}
                  <Pressable onPress={onClosePicker} style={styles.doneRow}>
                    <Text
                      style={[
                        typography.label,
                        { color: colors.accent, fontFamily: 'DMSans_600SemiBold' },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          )}
        </>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: moderateScale(14),
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(14),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.s4,
    marginBottom: spacing.s4,
  },
  presets: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingRight: moderateScale(4),
  },
  presetChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  whenRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: spacing.s4,
  },
  whenTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  whenIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  whenValue: {
    ...theme.typography.body,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.s5,
  },
  modalCard: {
    width: '100%',
    maxWidth: moderateScale(360),
    borderRadius: theme.radius.xl,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s2,
  },
  doneRow: {
    alignItems: 'flex-end',
    paddingVertical: verticalScale(8),
  },
}));
