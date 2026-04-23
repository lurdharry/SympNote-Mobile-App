import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays, format, setHours, setMinutes, setSeconds } from 'date-fns';
import { Calendar, Clock, X as XIcon } from 'lucide-react-native';
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
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticLight, hapticSuccess } from '@/services/haptics';
import { uuid } from '@/utils/uuid';

const DEFAULT_TIME = { hours: 9, minutes: 0 };

const defaultDate = (): Date => {
  const d = addDays(new Date(), 1);
  return setSeconds(setMinutes(setHours(d, DEFAULT_TIME.hours), DEFAULT_TIME.minutes), 0);
};

const AppointmentNew: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [when, setWhen] = useState<Date>(defaultDate);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const canSave = doctorName.trim().length > 0;

  const pickClinician = (name: string, role: string) => {
    hapticLight();
    setDoctorName(name);
    setSpecialty(role);
  };

  const openPicker = (mode: 'date' | 'time') => {
    hapticLight();
    setPickerMode(mode);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android closes the picker after every interaction; iOS keeps it open.
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed') return;
    if (selected) setWhen(selected);
  };

  const save = () => {
    if (!canSave) return;
    const id = uuid();
    useAppointmentsStore.getState().add({
      id,
      title: `${specialty.trim() || 'Visit'} with ${doctorName.trim()}`,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General',
      date: when.toISOString(),
      relatedRecordingIds: [],
      summary: null,
      generatedAt: null,
    });
    hapticSuccess();
    router.back();
  };

  return (
    <SceneTransition mode="sheet-up">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.label,
                  {
                    color: colors.accent,
                    fontFamily: 'DMSans_600SemiBold',
                    letterSpacing: 0.4,
                  },
                ]}
              >
                NEW APPOINTMENT
              </Text>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>
                Add a visit
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {careTeam.length > 0 && (
              <View style={{ marginTop: spacing.s3 }}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
                  FROM YOUR CARE TEAM
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {careTeam.map((c) => {
                    const active = c.name === doctorName;
                    return (
                      <Pressable
                        key={`${c.name}-${c.role}`}
                        onPress={() => pickClinician(c.name, c.role)}
                        style={[
                          styles.clinicianChip,
                          {
                            backgroundColor: active
                              ? colors.accent
                              : colors.bgSurface,
                            borderColor: active ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.label,
                            {
                              color: active ? '#FFFFFF' : colors.textPrimary,
                              fontFamily: 'DMSans_600SemiBold',
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: active
                                ? 'rgba(255,255,255,0.85)'
                                : colors.textTertiary,
                            },
                          ]}
                        >
                          {c.role}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TextField
              label="Doctor"
              placeholder="e.g. Dr. Chen"
              value={doctorName}
              onChangeText={setDoctorName}
            />
            <TextField
              label="Specialty"
              placeholder="e.g. Rheumatology"
              value={specialty}
              onChangeText={setSpecialty}
            />

            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>WHEN</Text>
            <View style={styles.whenRow}>
              <Pressable
                onPress={() => openPicker('date')}
                style={[
                  styles.whenTile,
                  { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  shadows.card,
                ]}
              >
                <Calendar size={moderateScale(14)} color={colors.accent} strokeWidth={2} />
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  DATE
                </Text>
                <Text style={[styles.whenValue, { color: colors.textPrimary }]}>
                  {format(when, 'EEE, MMM d')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => openPicker('time')}
                style={[
                  styles.whenTile,
                  { backgroundColor: colors.bgSurface, borderColor: colors.border },
                  shadows.card,
                ]}
              >
                <Clock size={moderateScale(14)} color={colors.accent} strokeWidth={2} />
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  TIME
                </Text>
                <Text style={[styles.whenValue, { color: colors.textPrimary }]}>
                  {format(when, 'h:mm a')}
                </Text>
              </Pressable>
            </View>

            {pickerMode && (
              <View style={{ marginTop: spacing.s3 }}>
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
                  >
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

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  marginTop: spacing.s4,
                  textAlign: 'center',
                },
              ]}
            >
              You can edit or delete this visit later from the Prep tab.
            </Text>
          </ScrollView>

          <View style={styles.ctaSlot}>
            <PrimaryButton
              label="Add appointment"
              onPress={save}
              disabled={!canSave}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ marginTop: spacing.s5 }}>
      <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
        {label.toUpperCase()}
      </Text>
      <View
        style={[
          styles.input,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          style={[typography.bodyLarge, { color: colors.textPrimary }]}
        />
      </View>
    </View>
  );
};

export default AppointmentNew;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(12),
  },
  closeBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s6,
  },
  fieldLabel: {
    ...theme.typography.label,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.3,
    marginTop: theme.spacing.s5,
    marginBottom: 6,
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  whenRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  whenTile: {
    flex: 1,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: moderateScale(6),
  },
  whenValue: {
    ...theme.typography.bodyLarge,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 2,
  },
  doneRow: {
    alignItems: 'flex-end',
    paddingVertical: verticalScale(6),
  },
  ctaSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingVertical: verticalScale(2),
    paddingRight: scale(4),
  },
  clinicianChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: moderateScale(2),
  },
}));
