import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { addDays, format, setHours, setMinutes, setSeconds } from 'date-fns';
import {
  Calendar,
  Check,
  Clock,
  Lock,
  Plus,
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
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StaggeredList } from '@/components/animated/StaggeredList';
import { AddClinicianSheet } from '@/components/onboarding/care-team/AddClinicianSheet';
import { findSpecialty, type Specialty } from '@/constants/specialties';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticLight, hapticSuccess } from '@/services/haptics';
import { uuid } from '@/utils/uuid';
import type { Clinician as StoreClinician } from '@/stores/types';

const DEFAULT_TIME = { hours: 9, minutes: 0 };

const defaultDate = (): Date => {
  const d = addDays(new Date(), 1);
  return setSeconds(
    setMinutes(setHours(d, DEFAULT_TIME.hours), DEFAULT_TIME.minutes),
    0,
  );
};

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

const AppointmentNew: React.FC = () => {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colors } = useTheme();
  const styles = useStyles();

  const careTeam = useProfileStore(
    (s) => s.personalization?.careTeam ?? [],
  );
  const addClinicianToStore = useProfileStore((s) => s.addClinician);

  const existing = useAppointmentsStore((s) =>
    editId ? s.getById(editId) : undefined,
  );
  const isEdit = !!existing;

  const initial = useMemo(() => {
    if (existing) {
      return {
        doctor: existing.doctorName,
        specialty: existing.specialty,
        when: new Date(existing.date),
      };
    }
    return { doctor: '', specialty: '', when: defaultDate() };
  }, [existing]);

  const [doctorName, setDoctorName] = useState(initial.doctor);
  const [specialty, setSpecialty] = useState(initial.specialty);
  const [when, setWhen] = useState<Date>(initial.when);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canSave = doctorName.trim().length > 0;
  const selectedName = doctorName.trim().toLowerCase();

  const pickClinician = (c: StoreClinician) => {
    hapticLight();
    setDoctorName(c.name);
    setSpecialty(c.role);
  };

  const handleSheetAdd = (value: { name: string; role: string }) => {
    addClinicianToStore(value);
    setDoctorName(value.name);
    setSpecialty(value.role);
  };

  const applyPreset = (days: number) => {
    hapticLight();
    const target = addDays(new Date(), days);
    target.setHours(when.getHours(), when.getMinutes(), 0, 0);
    setWhen(target);
    setPickerMode(null);
  };

  const openPicker = (mode: 'date' | 'time') => {
    hapticLight();
    setPickerMode((prev) => (prev === mode ? null : mode));
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed') return;
    if (selected) setWhen(selected);
  };

  const save = () => {
    if (!canSave) return;
    const trimmedDoc = doctorName.trim();
    const trimmedSpec = specialty.trim() || 'General';
    const title = `${trimmedSpec} with ${trimmedDoc}`;
    if (isEdit && existing) {
      useAppointmentsStore.getState().update(existing.id, {
        title,
        doctorName: trimmedDoc,
        specialty: trimmedSpec,
        date: when.toISOString(),
      });
    } else {
      useAppointmentsStore.getState().add({
        id: uuid(),
        title,
        doctorName: trimmedDoc,
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

  const iosDateDisplay: 'inline' | 'spinner' =
    pickerMode === 'date' ? 'inline' : 'spinner';

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          <View style={{ width: moderateScale(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {isEdit ? 'EDIT VISIT' : 'UPCOMING VISIT'}
          </Text>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            {isEdit ? `Edit your\nvisit details` : `Who are you\nseeing?`}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {isEdit
              ? 'Update the clinician or reschedule.'
              : 'Pick from your care team or add someone new. Sympnote will prep a tailored brief for this visit.'}
          </Text>

          <View style={styles.body}>
            <StaggeredList stagger={60}>
              {careTeam.map((c) => (
                <SelectableClinicianRow
                  key={`${c.name}-${c.role}`}
                  clinician={c}
                  selected={c.name.trim().toLowerCase() === selectedName}
                  onPress={() => pickClinician(c)}
                />
              ))}
              <AddClinicianRow onPress={() => setSheetOpen(true)} />
            </StaggeredList>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            When
          </Text>
          <View
            style={[
              styles.whenWrap,
              { borderColor: colors.border },
            ]}
          >
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
                onPress={() => openPicker('date')}
                style={[styles.whenTile, { borderColor: colors.border }]}
              >
                <View
                  style={[
                    styles.whenIcon,
                    { backgroundColor: colors.accent + '1A' },
                  ]}
                >
                  <Calendar
                    size={moderateScale(14)}
                    color={colors.accent}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textTertiary },
                    ]}
                  >
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
                onPress={() => openPicker('time')}
                style={[styles.whenTile, { borderColor: colors.border }]}
              >
                <View
                  style={[
                    styles.whenIcon,
                    { backgroundColor: colors.accent + '1A' },
                  ]}
                >
                  <Clock
                    size={moderateScale(14)}
                    color={colors.accent}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textTertiary },
                    ]}
                  >
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
          </View>

          {pickerMode && Platform.OS === 'android' && (
            <DateTimePicker
              value={when}
              mode={pickerMode}
              display="default"
              minimumDate={pickerMode === 'date' ? new Date() : undefined}
              onChange={onPickerChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <Modal
              visible={!!pickerMode}
              transparent
              animationType="fade"
              onRequestClose={() => setPickerMode(null)}
            >
              <View style={styles.backdrop}>
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => setPickerMode(null)}
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
                      onChange={onPickerChange}
                      accentColor={colors.accent}
                    />
                  )}
                  <Pressable
                    onPress={() => setPickerMode(null)}
                    style={styles.doneRow}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: colors.accent,
                          fontFamily: 'DMSans_600SemiBold',
                        },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          )}

          <View style={[styles.privacyRow, { backgroundColor: colors.bgMuted }]}>
            <Lock
              size={moderateScale(12)}
              color={colors.textTertiary}
              strokeWidth={2.2}
            />
            <Text
              style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}
            >
              Private to you. Sympnote never contacts your clinicians.
            </Text>
          </View>
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
              Pick a clinician to continue
            </Text>
          )}
          <PrimaryButton
            label={isEdit ? 'Save changes' : 'Add appointment'}
            onPress={save}
            disabled={!canSave}
          />
        </View>
      </SafeAreaView>

      <AddClinicianSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleSheetAdd}
      />
    </View>
  );
};

// ─── SelectableClinicianRow ───────────────────────────────────────────────
// Mirrors ClinicianCard's visual language (gradient specialty tile + name
// + role) but is tappable with a selected check state instead of a remove
// X. Single-select semantics for visit picking.

interface SelectableClinicianRowProps {
  clinician: StoreClinician;
  selected: boolean;
  onPress: () => void;
}

const SelectableClinicianRow: React.FC<SelectableClinicianRowProps> = ({
  clinician,
  selected,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const spec: Specialty = findSpecialty(clinician.role);
  const Icon = spec.Icon;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cardRow,
        {
          backgroundColor: colors.bgSurface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
        shadows.card,
      ]}
    >
      <View style={styles.specTile}>
        <LinearGradient
          colors={spec.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon size={moderateScale(20)} color={spec.fg} strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
          numberOfLines={1}
        >
          {clinician.name}
        </Text>
        <Text
          style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}
          numberOfLines={1}
        >
          {clinician.role}
        </Text>
      </View>

      <View
        style={[
          styles.checkSlot,
          {
            backgroundColor: selected ? colors.accent : 'transparent',
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        {selected && (
          <Check size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.5} />
        )}
      </View>
    </Pressable>
  );
};

// ─── AddClinicianRow ──────────────────────────────────────────────────────
// Trailing card in the clinician list. Opens the same AddClinicianSheet
// the onboarding flow uses.

const AddClinicianRow: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.addRow,
        { borderColor: colors.border, backgroundColor: colors.bgSurface },
      ]}
    >
      <View style={[styles.addIconTile, { backgroundColor: colors.bgMuted }]}>
        <Plus size={moderateScale(18)} color={colors.accent} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
        >
          Add someone new
        </Text>
        <Text
          style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}
        >
          Pick specialty, enter their name.
        </Text>
      </View>
    </Pressable>
  );
};

export default AppointmentNew;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s6,
  },
  eyebrow: {
    ...theme.typography.label,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1.2,
  },
  headline: {
    ...theme.typography.h1,
    fontFamily: 'Fraunces_500Medium',
    letterSpacing: -0.6,
    marginTop: moderateScale(4),
    lineHeight: fontScale(36),
  },
  sub: {
    ...theme.typography.body,
    marginTop: moderateScale(8),
    lineHeight: fontScale(22),
  },
  body: {
    marginTop: spacing.s6,
    gap: moderateScale(10),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(12),
    paddingRight: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  specTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSlot: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  addIconTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...theme.typography.label,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.6,
    marginTop: spacing.s6,
    marginBottom: spacing.s3,
  },
  whenWrap: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: moderateScale(14),
    backgroundColor: 'transparent',
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
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.full,
    marginTop: spacing.s5,
  },
  ctaSlot: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(8),
    paddingBottom: spacing.s4,
  },
}));
