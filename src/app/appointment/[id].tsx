import React, { useState } from 'react';
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
import { ChevronRight, Paperclip } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { SharedElementScene } from '@/components/navigation/SharedElementScene';
import { StaggeredList } from '@/components/animated/StaggeredList';
import { Button } from '@/components/ui/Button';
import { ClinicalSummary } from '@/components/clinical/ClinicalSummary';
import { RecordingPicker } from '@/components/appointment/RecordingPicker';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { generateAppointmentSummary } from '@/services/ai';
import { formatDate } from '@/utils/date';
import { hapticLight, hapticMedium, hapticSuccess } from '@/services/haptics';
import { useTransition } from '@/components/navigation/TransitionContext';

const AppointmentDetail: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const appt = useAppointmentsStore((s) => s.getById(id!));
  const update = useAppointmentsStore((s) => s.update);
  const remove = useAppointmentsStore((s) => s.remove);
  const setRelatedRecordings = useAppointmentsStore((s) => s.setRelatedRecordings);
  const allRecordings = useRecordingsStore((s) => s.recordings);
  const { closeScene } = useTransition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const attachedCount = appt.relatedRecordingIds.length;
  const attachedRecordings = allRecordings.filter((r) =>
    appt.relatedRecordingIds.includes(r.id),
  );

  const regenerate = async () => {
    if (attachedRecordings.length === 0) {
      Alert.alert(
        'Attach recordings first',
        'Pick which recordings Sympnote should use to build this visit brief.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Attach recordings', onPress: () => setPickerOpen(true) },
        ],
      );
      return;
    }
    hapticMedium();
    setGenerating(true);
    try {
      const text = await generateAppointmentSummary(attachedRecordings);
      update(appt.id, {
        summary: text,
        generatedAt: new Date().toISOString(),
      });
      hapticSuccess();
    } catch (e) {
      Alert.alert('Summary failed', String(e));
    } finally {
      setGenerating(false);
    }
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
            <Text style={[typography.label, { color: colors.accent }]}>← Back</Text>
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

          {/* Attached recordings row — tap to pick */}
          <Pressable
            onPress={() => {
              hapticLight();
              setPickerOpen(true);
            }}
            style={[
              styles.attachRow,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <View style={[styles.attachIcon, { backgroundColor: colors.accent + '1A' }]}>
              <Paperclip size={moderateScale(16)} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  typography.body,
                  { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
                ]}
              >
                {attachedCount === 0
                  ? 'Attach recordings'
                  : `${attachedCount} ${attachedCount === 1 ? 'recording' : 'recordings'} attached`}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                {attachedCount === 0
                  ? 'Pick which entries inform this brief.'
                  : 'Tap to change selection.'}
              </Text>
            </View>
            <ChevronRight size={moderateScale(16)} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>

          {appt.summary ? (
            <StaggeredList stagger={100} initialDelay={150}>
              <View style={{ marginTop: spacing.s6 }}>
                <ClinicalSummary text={appt.summary} stagger initialDelay={50} />
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
                <Button
                  label={generating ? 'Regenerating…' : 'Regenerate'}
                  disabled={generating}
                  onPress={regenerate}
                />
              </View>
            </StaggeredList>
          ) : (
            <View style={{ marginTop: spacing.s6 }}>
              <Button
                label={generating ? 'Generating…' : 'Generate summary'}
                disabled={generating}
                onPress={regenerate}
              />
              {attachedCount === 0 && (
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textTertiary,
                      textAlign: 'center',
                      marginTop: spacing.s3,
                      lineHeight: fontScale(18),
                    },
                  ]}
                >
                  Attach at least one recording above for Sympnote to build
                  your brief from.
                </Text>
              )}
            </View>
          )}

          <View style={{ marginTop: spacing.s8 }}>
            <Button label="Delete appointment" variant="destructive" onPress={del} />
          </View>
        </ScrollView>

        <RecordingPicker
          visible={pickerOpen}
          recordings={allRecordings}
          initialSelected={appt.relatedRecordingIds}
          onClose={() => setPickerOpen(false)}
          onSave={(ids) => setRelatedRecordings(appt.id, ids)}
        />
      </SafeAreaView>
    </SharedElementScene>
  );
};

export default AppointmentDetail;

const useStyles = makeStyles((theme) => ({
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: theme.spacing.s6,
    paddingBottom: theme.spacing.s12,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginTop: spacing.s5,
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  attachIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
