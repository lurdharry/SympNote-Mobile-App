import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, radius, spacing, typography } from '../../theme';
import { SharedElementScene } from '../../components/navigation/SharedElementScene';
import { StaggeredList } from '../../components/animated/StaggeredList';
import { Button } from '../../components/ui/Button';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { formatDate, formatTime, formatDuration } from '../../utils/date';
import { hapticLight } from '../../services/haptics';
import { useTransition } from '../../components/navigation/TransitionContext';

export default function RecordingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const recording = useRecordingsStore((s) => s.getById(id!));
  const remove = useRecordingsStore((s) => s.remove);
  const { closeScene } = useTransition();

  const goBack = async () => {
    hapticLight();
    await closeScene();
    router.back();
  };

  if (!recording) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Recording not found.
          </Text>
          <View style={{ height: spacing.s4 }} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const s = recording.structured;

  const confirmDelete = () => {
    Alert.alert('Delete recording?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(recording.id);
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
            {s.symptoms[0] ?? 'Entry'}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
            {formatDate(recording.createdAt)} · {formatTime(recording.createdAt)} ·{' '}
            {formatDuration(recording.durationSec)}
          </Text>

          <StaggeredList stagger={80} initialDelay={150}>
            <Section label="Transcript">
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {recording.transcript}
              </Text>
            </Section>

            <Section label="Symptoms">
              <ChipsOrDash items={s.symptoms} />
            </Section>

            <Section label="Location">
              <LineOrDash text={s.location} />
            </Section>

            <Section label="Duration">
              <LineOrDash text={s.duration} />
            </Section>

            <Section label="Severity">
              <Text style={[typography.bodyLarge, { color: colors.textPrimary }]}>
                {s.severity}/10
              </Text>
            </Section>

            <Section label="Triggers">
              <ChipsOrDash items={s.triggers} />
            </Section>

            <Section label="Medications">
              <ChipsOrDash items={s.medications} />
            </Section>

            {s.notes ? (
              <Section label="Notes">
                <Text style={[typography.body, { color: colors.textPrimary }]}>
                  {s.notes}
                </Text>
              </Section>
            ) : null}

            {recording.tags.length > 0 && (
              <Section label="Tags">
                <ChipsOrDash items={recording.tags} />
              </Section>
            )}
          </StaggeredList>

          <View style={{ marginTop: spacing.s8 }}>
            <Button
              label="Delete recording"
              variant="destructive"
              haptic="medium"
              onPress={confirmDelete}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SharedElementScene>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: spacing.s5 }}>
      <Text style={[typography.label, { color: colors.textTertiary, marginBottom: 4 }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function ChipsOrDash({ items }: { items: string[] }) {
  const { colors } = useTheme();
  if (items.length === 0) {
    return <Text style={[typography.body, { color: colors.textTertiary }]}>—</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.bgMuted,
            paddingHorizontal: spacing.s3,
            paddingVertical: 4,
            borderRadius: radius.sm,
          }}
        >
          <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
            {i}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LineOrDash({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.body,
        { color: text ? colors.textPrimary : colors.textTertiary },
      ]}
    >
      {text || '—'}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s6,
    paddingBottom: spacing.s12,
  },
});
