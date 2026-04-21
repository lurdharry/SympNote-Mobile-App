import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { StaggeredList } from '../../components/animated/StaggeredList';
import { PulsingOrb } from '../../components/animated/PulsingOrb';
import { ShimmerText } from '../../components/animated/ShimmerText';
import { AnimatedCheckmark } from '../../components/animated/AnimatedCheckmark';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { ClinicalSummary } from '../../components/clinical/ClinicalSummary';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { generateAppointmentSummary } from '../../services/ai';
import { hapticLight, hapticMedium, hapticSuccess } from '../../services/haptics';
import { formatDate, daysUntil } from '../../utils/date';
import { uuid } from '../../utils/uuid';
import { Appointment } from '../../stores/types';

export default function Prep() {
  const { colors } = useTheme();
  // Subscribe to raw array, derive sorted view via useMemo. Returning a
  // sorted .slice() directly from the selector creates a new array ref
  // every render and triggers React 19's getSnapshot loop.
  const rawAppointments = useAppointmentsStore((s) => s.appointments);
  const appointments = useMemo(
    () =>
      rawAppointments
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [rawAppointments]
  );
  const [adding, setAdding] = useState(false);
  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [dateInput, setDateInput] = useState('');

  const add = () => {
    if (!doctor.trim() || !dateInput.trim()) {
      Alert.alert('Missing info', 'Please add a doctor name and date.');
      return;
    }
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Invalid date', 'Try YYYY-MM-DD format.');
      return;
    }
    useAppointmentsStore.getState().add({
      id: uuid(),
      title: `${specialty || 'Visit'} with ${doctor}`,
      doctorName: doctor.trim(),
      specialty: specialty.trim() || 'General',
      date: parsed.toISOString(),
      relatedRecordingIds: [],
      summary: null,
      generatedAt: null,
    });
    hapticSuccess();
    setDoctor('');
    setSpecialty('');
    setDateInput('');
    setAdding(false);
  };

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.h1, { color: colors.textPrimary }]}>
            Prep
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginTop: 4 },
            ]}
          >
            Appointments and their AI summaries.
          </Text>

          <View style={{ marginTop: spacing.s6 }}>
            {appointments.length === 0 && (
              <Text
                style={[
                  typography.body,
                  { color: colors.textTertiary, textAlign: 'center', marginVertical: spacing.s8 },
                ]}
              >
                No appointments yet. Add one below.
              </Text>
            )}
            <StaggeredList stagger={90}>
              {appointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))}
            </StaggeredList>
          </View>

          <View style={{ marginTop: spacing.s8 }}>
            {adding ? (
              <View
                style={[
                  styles.addCard,
                  { backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderColor: colors.border },
                ]}
              >
                <TextInput
                  label="Doctor name"
                  value={doctor}
                  onChangeText={setDoctor}
                  placeholder="Dr. Kim"
                />
                <View style={{ height: spacing.s3 }} />
                <TextInput
                  label="Specialty"
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="Cardiology"
                />
                <View style={{ height: spacing.s3 }} />
                <TextInput
                  label="Date (YYYY-MM-DD)"
                  value={dateInput}
                  onChangeText={setDateInput}
                  placeholder="2026-05-14"
                  autoCapitalize="none"
                />
                <View style={{ height: spacing.s4 }} />
                <Button label="Add appointment" onPress={add} />
                <Pressable onPress={() => setAdding(false)} style={{ marginTop: spacing.s3 }}>
                  <Text style={[typography.body, { color: colors.textTertiary, textAlign: 'center' }]}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Button
                label="Add appointment"
                variant="secondary"
                onPress={() => setAdding(true)}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { colors } = useTheme();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const ids = new Set(appointment.relatedRecordingIds);
    const all = useRecordingsStore.getState().recordings;
    // Include every recording if none attached (best-effort for MVP).
    const logs = ids.size > 0 ? all.filter((r) => ids.has(r.id)) : all;
    if (logs.length === 0) {
      Alert.alert('No recordings yet', 'Log at least one symptom to generate a summary.');
      return;
    }
    setGenerating(true);
    hapticMedium();
    try {
      const summary = await generateAppointmentSummary(logs);
      useAppointmentsStore.getState().update(appointment.id, {
        summary,
        generatedAt: new Date().toISOString(),
        relatedRecordingIds: Array.from(new Set(logs.map((l) => l.id))),
      });
      hapticSuccess();
    } catch (e) {
      Alert.alert('Summary failed', String(e));
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!appointment.summary) return;
    await Clipboard.setStringAsync(appointment.summary);
    hapticLight();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const share = async () => {
    if (!appointment.summary) return;
    Share.share({ message: appointment.summary }).catch(() => {});
  };

  const days = daysUntil(appointment.date);

  return (
    <View
      style={[
        styles.appt,
        shadows.card,
        { backgroundColor: colors.bgSurface, borderRadius: radius.lg, borderColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {appointment.doctorName}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            {appointment.specialty} · {formatDate(appointment.date)}
          </Text>
        </View>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {days >= 0 ? `in ${days}d` : `${Math.abs(days)}d ago`}
          </Text>
        </View>
      </View>

      {generating ? (
        <View style={{ alignItems: 'center', marginTop: spacing.s4 }}>
          <PulsingOrb size={110} />
          <View style={{ marginTop: spacing.s2 }}>
            <ShimmerText
              text="Drafting summary..."
              textStyle={{ ...typography.body, color: colors.textSecondary }}
            />
          </View>
        </View>
      ) : appointment.summary ? (
        <View style={{ marginTop: spacing.s4 }}>
          <ClinicalSummary text={appointment.summary} stagger initialDelay={100} />
          <View style={{ flexDirection: 'row', gap: spacing.s3, marginTop: spacing.s4 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={copied ? 'Copied!' : 'Copy'}
                variant="secondary"
                haptic="light"
                onPress={copy}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Share"
                variant="secondary"
                haptic="light"
                onPress={share}
              />
            </View>
          </View>
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, marginTop: spacing.s4 },
            ]}
          >
            Not medical advice. Review with your doctor.
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.s4 }}>
          <Button
            label="Generate summary"
            onPress={generate}
          />
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s12,
  },
  appt: {
    padding: spacing.s5,
    marginBottom: spacing.s3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addCard: {
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
