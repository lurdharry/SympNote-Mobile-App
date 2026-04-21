import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme, radius, spacing, typography } from '../../theme';
import { SharedElementScene } from '../../components/navigation/SharedElementScene';
import { StaggeredList } from '../../components/animated/StaggeredList';
import { Button } from '../../components/ui/Button';
import { ClinicalSummary } from '../../components/clinical/ClinicalSummary';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { generateAppointmentSummary } from '../../services/ai';
import { formatDate } from '../../utils/date';
import { hapticLight, hapticMedium, hapticSuccess } from '../../services/haptics';
import { useTransition } from '../../components/navigation/TransitionContext';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const appt = useAppointmentsStore((s) => s.getById(id!));
  const update = useAppointmentsStore((s) => s.update);
  const remove = useAppointmentsStore((s) => s.remove);
  const { closeScene } = useTransition();

  const goBack = async () => {
    hapticLight();
    await closeScene();
    router.back();
  };

  if (!appt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Appointment not found.
          </Text>
          <View style={{ height: spacing.s4 }} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const regenerate = async () => {
    hapticMedium();
    const all = useRecordingsStore.getState().recordings;
    if (all.length === 0) {
      Alert.alert('No recordings yet', 'Log at least one symptom first.');
      return;
    }
    const text = await generateAppointmentSummary(all);
    update(appt.id, {
      summary: text,
      generatedAt: new Date().toISOString(),
      relatedRecordingIds: all.map((r) => r.id),
    });
    hapticSuccess();
  };

  const copy = async () => {
    if (!appt.summary) return;
    await Clipboard.setStringAsync(appt.summary);
    hapticLight();
  };

  const share = () => {
    if (!appt.summary) return;
    Share.share({ message: appt.summary }).catch(() => {});
  };

  const del = () => {
    Alert.alert('Delete appointment?', 'This removes the summary too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(appt.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SharedElementScene style={{ backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={goBack}>
            <Text style={[typography.label, { color: colors.accent }]}>
              ← Back
            </Text>
          </Pressable>

          <Text
            style={[
              typography.h1,
              { color: colors.textPrimary, marginTop: spacing.s4 },
            ]}
          >
            {appt.doctorName}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
            {appt.specialty} · {formatDate(appt.date)}
          </Text>

          {appt.summary ? (
            <StaggeredList stagger={100} initialDelay={150}>
              <View style={{ marginTop: spacing.s6 }}>
                <ClinicalSummary
                  text={appt.summary}
                  stagger
                  initialDelay={50}
                />
              </View>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing.s4,
                    fontStyle: 'italic',
                  },
                ]}
              >
                Not medical advice. Review with your doctor.
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.s3, marginTop: spacing.s5 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Copy" variant="secondary" haptic="light" onPress={copy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Share" variant="secondary" haptic="light" onPress={share} />
                </View>
              </View>
              <View style={{ marginTop: spacing.s4 }}>
                <Button label="Regenerate" onPress={regenerate} />
              </View>
            </StaggeredList>
          ) : (
            <View style={{ marginTop: spacing.s6 }}>
              <Button label="Generate summary" onPress={regenerate} />
            </View>
          )}

          <View style={{ marginTop: spacing.s8 }}>
            <Button label="Delete appointment" variant="destructive" onPress={del} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SharedElementScene>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s6,
    paddingBottom: spacing.s12,
  },
});
