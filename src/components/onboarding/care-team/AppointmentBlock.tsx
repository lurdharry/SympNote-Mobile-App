import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
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
}

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  enabled,
  onToggle,
  when,
  onChange,
  pickerMode,
  onOpenPicker,
  onClosePicker,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const handleToggle = (value: boolean) => {
    hapticLight();
    onToggle(value);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') onClosePicker();
    if (event.type === 'dismissed') return;
    if (selected) onChange(selected);
  };

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
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.bgMuted, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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

          {pickerMode && (
            <View style={styles.pickerSlot}>
              <DateTimePicker
                value={when}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                onChange={handlePickerChange}
              />
              {Platform.OS === 'ios' && (
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
              )}
            </View>
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
  whenRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
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
  pickerSlot: {
    marginTop: spacing.s3,
  },
  doneRow: {
    alignItems: 'flex-end',
    paddingVertical: verticalScale(6),
  },
}));
