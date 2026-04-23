import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays, format, setHours, setMinutes, setSeconds } from 'date-fns';
import { Check } from 'lucide-react-native';
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
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticLight, hapticSuccess } from '@/services/haptics';
import { uuid } from '@/utils/uuid';
import type { Clinician } from '@/stores/types';

const DEFAULT_TIME = { hours: 9, minutes: 0 };

const defaultDate = (): Date => {
  const d = addDays(new Date(), 1);
  return setSeconds(
    setMinutes(setHours(d, DEFAULT_TIME.hours), DEFAULT_TIME.minutes),
    0,
  );
};

const initialsFor = (name: string): string =>
  name
    .replace(/^(dr\.?|prof\.?)\s*/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

const AppointmentNew: React.FC = () => {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const existing = useAppointmentsStore((s) =>
    editId ? s.getById(editId) : undefined,
  );
  const isEdit = !!existing;

  const initial = useMemo(() => {
    if (existing) {
      return {
        doctor: existing.doctorName,
        specialty: existing.specialty === 'General' ? '' : existing.specialty,
        when: new Date(existing.date),
      };
    }
    return { doctor: '', specialty: '', when: defaultDate() };
  }, [existing]);

  const [doctorName, setDoctorName] = useState(initial.doctor);
  const [specialty, setSpecialty] = useState(initial.specialty);
  const [when, setWhen] = useState<Date>(initial.when);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const trimmedDoctor = doctorName.trim();
  const canSave = trimmedDoctor.length > 0;

  const selectedFromTeam = careTeam.find(
    (c) => c.name.toLowerCase() === trimmedDoctor.toLowerCase(),
  );

  const pickClinician = (c: Clinician) => {
    hapticLight();
    Keyboard.dismiss();
    setDoctorName(c.name);
    setSpecialty(c.role);
  };

  const openPicker = (mode: 'date' | 'time') => {
    hapticLight();
    Keyboard.dismiss();
    setPickerMode((prev) => (prev === mode ? null : mode));
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed') return;
    if (selected) setWhen(selected);
  };

  const save = () => {
    if (!canSave) return;
    const trimmedSpec = specialty.trim() || 'General';
    const title = `${trimmedSpec} with ${trimmedDoctor}`;
    if (isEdit && existing) {
      useAppointmentsStore.getState().update(existing.id, {
        title,
        doctorName: trimmedDoctor,
        specialty: trimmedSpec,
        date: when.toISOString(),
      });
    } else {
      useAppointmentsStore.getState().add({
        id: uuid(),
        title,
        doctorName: trimmedDoctor,
        specialty: trimmedSpec,
        date: when.toISOString(),
        status: 'upcoming',
        attendedAt: null,
        outcome: null,
        brief: null,
        briefGeneratedAt: null,
        briefSourceRecordingIds: [],
      });
    }
    hapticSuccess();
    router.back();
  };

  const dateLabel = format(when, 'EEE, MMM d');
  const timeLabel = format(when, 'h:mm a');

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={[typography.h2, { color: colors.textPrimary }]}>
            {isEdit ? 'Edit visit' : 'New visit'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {careTeam.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Your care team
                </Text>
                <View style={styles.teamGrid}>
                  {careTeam.map((c) => {
                    const active = selectedFromTeam?.name === c.name;
                    return (
                      <Pressable
                        key={`${c.name}-${c.role}`}
                        onPress={() => pickClinician(c)}
                        style={[
                          styles.teamCard,
                          {
                            backgroundColor: active
                              ? colors.accent + '14'
                              : colors.bgSurface,
                            borderColor: active ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.avatar,
                            {
                              backgroundColor: active
                                ? colors.accent
                                : colors.bgMuted,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              {
                                color: active ? '#FFFFFF' : colors.textPrimary,
                              },
                            ]}
                          >
                            {initialsFor(c.name)}
                          </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[
                              typography.body,
                              {
                                color: colors.textPrimary,
                                fontFamily: 'DMSans_600SemiBold',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {c.name}
                          </Text>
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textTertiary, marginTop: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {c.role}
                          </Text>
                        </View>
                        {active && (
                          <Check
                            size={moderateScale(16)}
                            color={colors.accent}
                            strokeWidth={2.5}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {careTeam.length > 0 ? 'Or add someone new' : 'Clinician'}
            </Text>
            <View style={styles.manualGroup}>
              <FieldRow
                placeholder="Doctor's name"
                value={doctorName}
                onChangeText={setDoctorName}
                autoFocus={careTeam.length === 0 && !isEdit}
              />
              <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />
              <FieldRow
                placeholder="Specialty (optional)"
                value={specialty}
                onChangeText={setSpecialty}
              />
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              When
            </Text>
            <View
              style={[
                styles.whenCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={() => openPicker('date')}
                style={[
                  styles.whenSegment,
                  pickerMode === 'date' && {
                    backgroundColor: colors.accent + '10',
                  },
                ]}
              >
                <Text style={[styles.whenHint, { color: colors.textTertiary }]}>
                  Date
                </Text>
                <Text style={[styles.whenValue, { color: colors.textPrimary }]}>
                  {dateLabel}
                </Text>
              </Pressable>
              <View
                style={[styles.whenDivider, { backgroundColor: colors.border }]}
              />
              <Pressable
                onPress={() => openPicker('time')}
                style={[
                  styles.whenSegment,
                  pickerMode === 'time' && {
                    backgroundColor: colors.accent + '10',
                  },
                ]}
              >
                <Text style={[styles.whenHint, { color: colors.textTertiary }]}>
                  Time
                </Text>
                <Text style={[styles.whenValue, { color: colors.textPrimary }]}>
                  {timeLabel}
                </Text>
              </Pressable>
            </View>

            {pickerMode && (
              <View
                style={[
                  styles.pickerWrap,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <DateTimePicker
                  value={when}
                  mode={pickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={pickerMode === 'date' ? new Date() : undefined}
                  onChange={onPickerChange}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setPickerMode(null)}
                    style={styles.doneRow}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: colors.accent,
                          fontFamily: 'DMSans_700Bold',
                        },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {!isEdit && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing.s5,
                    textAlign: 'center',
                  },
                ]}
              >
                You can edit or delete this visit later from the Prep tab.
              </Text>
            )}
          </ScrollView>

          <View style={styles.ctaSlot}>
            {!canSave && (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    textAlign: 'center',
                    marginBottom: spacing.s2,
                  },
                ]}
              >
                Add a clinician name to continue
              </Text>
            )}
            <PrimaryButton
              label={isEdit ? 'Save changes' : 'Add appointment'}
              onPress={save}
              disabled={!canSave}
            />
        </View>
      </SafeAreaView>
    </View>
  );
};

interface FieldRowProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({
  value,
  onChangeText,
  placeholder,
  autoFocus,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      autoCapitalize="words"
      autoFocus={autoFocus}
      style={[
        typography.bodyLarge,
        styles.fieldInput,
        { color: colors.textPrimary },
      ]}
    />
  );
};

export default AppointmentNew;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s2,
  },
  headerSpacer: {
    width: moderateScale(36),
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s6,
  },
  sectionLabel: {
    ...theme.typography.caption,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: theme.spacing.s5,
    marginBottom: theme.spacing.s2,
  },
  teamGrid: {
    gap: moderateScale(8),
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
  manualGroup: {
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSurface,
    overflow: 'hidden',
  },
  fieldInput: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: scale(14),
  },
  whenCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  whenSegment: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    gap: 2,
  },
  whenDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: verticalScale(8),
  },
  whenHint: {
    ...theme.typography.caption,
  },
  whenValue: {
    ...theme.typography.bodyLarge,
    fontFamily: 'DMSans_600SemiBold',
  },
  pickerWrap: {
    marginTop: theme.spacing.s3,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.s3,
  },
  doneRow: {
    alignItems: 'flex-end',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(6),
  },
  ctaSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s6,
    paddingTop: spacing.s2,
  },
}));
