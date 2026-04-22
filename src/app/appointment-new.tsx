import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X as XIcon } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, shadows, spacing, typography, useTheme, verticalScale } from '../theme';
import { SceneTransition } from '../components/navigation/SceneTransition';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { hapticSuccess } from '../services/haptics';
import { uuid } from '../utils/uuid';

/**
 * Minimal appointment creation modal — doctor, specialty, date, time.
 *
 * Date + time take free-text input for now; real date/time pickers can
 * replace these without changing the surrounding shell. Parsing is
 * forgiving: we try Date.parse of "doctorName [spec] YYYY-MM-DD HH:mm"
 * and fall back to a composed ISO string.
 */
const AppointmentNew: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [time, setTime] = useState(''); // HH:mm (24h)

  const canSave = doctorName.trim().length > 0 && date.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    // Compose ISO. If time is missing, default to 09:00.
    const t = time.trim() || '09:00';
    const iso = `${date.trim()}T${t}:00`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      Alert.alert(
        'Invalid date',
        'Use YYYY-MM-DD for date and HH:mm (24-hour) for time.'
      );
      return;
    }
    const id = uuid();
    useAppointmentsStore.getState().add({
      id,
      title: `${specialty.trim() || 'Visit'} with ${doctorName.trim()}`,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General',
      date: parsed.toISOString(),
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
              <Text
                style={[
                  typography.h2,
                  { color: colors.textPrimary, marginTop: 2 },
                ]}
              >
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
            <Field
              label="Doctor"
              placeholder="Dr. Chen"
              value={doctorName}
              onChangeText={setDoctorName}
            />
            <Field
              label="Specialty"
              placeholder="Rheumatology"
              value={specialty}
              onChangeText={setSpecialty}
            />
            <Field
              label="Date"
              placeholder="2026-04-28"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
              helper="YYYY-MM-DD"
            />
            <Field
              label="Time"
              placeholder="14:00"
              value={time}
              onChangeText={setTime}
              autoCapitalize="none"
              helper="24-hour (HH:mm). Defaults to 09:00 if left blank."
            />
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

          <View style={{ paddingHorizontal: spacing.s6, paddingBottom: spacing.s6 }}>
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
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  helper?: string;
}

const Field: React.FC<FieldProps> = ({ label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  helper }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ marginTop: spacing.s5 }}>
      <Text
        style={[
          typography.label,
          {
            color: colors.textTertiary,
            fontFamily: 'DMSans_600SemiBold',
            letterSpacing: 0.3,
            marginBottom: 6,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
      <View
        style={[
          styles.input,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize={autoCapitalize}
          style={[
            typography.bodyLarge,
            { color: colors.textPrimary },
          ]}
        />
      </View>
      {helper && (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: 4 },
          ]}
        >
          {helper}
        </Text>
      )}
    </View>
  );
}

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
  input: {
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
}));
