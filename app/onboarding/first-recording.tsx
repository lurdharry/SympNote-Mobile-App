import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, typography } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { TypewriterText } from '../../components/animated/TypewriterText';
import { hapticHeavy } from '../../services/haptics';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { uuid } from '../../utils/uuid';
import {
  q4AnswerToDate,
  tentativeAppointmentTitle,
} from '../../utils/onboarding';
import { generateAppointmentSummary } from '../../services/ai';
import { useRecordingFlow } from '../../components/recording/useRecordingFlow';
import { PrivacyPhase } from '../../components/recording/PrivacyPhase';
import { IdlePhase } from '../../components/recording/IdlePhase';
import { RecordingPhase } from '../../components/recording/RecordingPhase';
import { ReviewPhase } from '../../components/recording/ReviewPhase';
import { ExtractingPhase } from '../../components/recording/ExtractingPhase';
import { ExtractedPhase } from '../../components/recording/ExtractedPhase';

export default function FirstRecording() {
  const router = useRouter();
  const { colors } = useTheme();
  const flow = useRecordingFlow();

  useEffect(() => {
    if (__DEV__) console.log('[first-recording] mount');
    return () => {
      if (__DEV__) console.log('[first-recording] unmount');
    };
  }, []);

  /**
   * Save the first entry AND seed a tentative appointment from Q4 so the
   * Prep tab isn't empty on first open. Summary generation kicks off in
   * the background — the paywall will show a blurred preview as it streams
   * in. This is the "show value before asking for money" move: by the time
   * the user gets to the paywall, their actual doctor-ready summary is
   * being drafted from their own words.
   */
  const save = async () => {
    if (!flow.structured || !flow.reviewText) return;

    const recordingId = uuid();
    useRecordingsStore.getState().add({
      id: recordingId,
      createdAt: new Date().toISOString(),
      durationSec: flow.durationSec,
      transcript: flow.reviewText.trim(),
      structured: flow.structured,
      tags: flow.structured.symptoms.slice(0, 3),
    });
    hapticHeavy();

    const answers = useProfileStore.getState().onboardingAnswers;
    const prefillDate = q4AnswerToDate(answers);
    if (prefillDate) {
      const apptId = uuid();
      useAppointmentsStore.getState().add({
        id: apptId,
        title: tentativeAppointmentTitle(),
        doctorName: 'Your doctor',
        specialty: 'General',
        date: prefillDate.toISOString(),
        relatedRecordingIds: [recordingId],
        summary: null,
        generatedAt: null,
      });

      // Kick off summary generation — non-blocking. The paywall reads
      // whichever appointment has a summary first. Failures are ignored
      // here; the paywall falls back to a placeholder if nothing arrives.
      generateAppointmentSummary([
        {
          id: recordingId,
          createdAt: new Date().toISOString(),
          durationSec: flow.durationSec,
          transcript: flow.reviewText.trim(),
          structured: flow.structured,
          tags: flow.structured.symptoms.slice(0, 3),
        },
      ])
        .then((summary) => {
          useAppointmentsStore.getState().update(apptId, {
            summary,
            generatedAt: new Date().toISOString(),
          });
        })
        .catch((err) => {
          if (__DEV__) console.warn('[summary] preview failed', err);
        });
    }

    router.push('/onboarding/paywall');
  };

  return (
    <SceneTransition mode="scale-fade">
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        {flow.phase === 'privacy' ? (
          <PrivacyPhase onAccept={flow.acknowledgePrivacy} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ minHeight: 70, marginTop: spacing.s4 }}>
              <TypewriterText
                text="Tell me what's been on your mind."
                speed={30}
                style={[
                  typography.serifHeadline,
                  { color: colors.textPrimary },
                ]}
              />
            </View>

            {flow.phase === 'idle' && (
              <IdlePhase
                onStart={flow.beginRecording}
                onTypeInstead={flow.skipToTyping}
              />
            )}

            {flow.phase === 'recording' && (
              <RecordingPhase
                meterSv={flow.meterSv}
                liveTranscript={flow.liveTranscript}
                durationSec={flow.durationSec}
                onStop={flow.endRecording}
              />
            )}

            {flow.phase === 'review' && (
              <ReviewPhase
                text={flow.reviewText}
                onChange={flow.setReviewText}
                durationSec={flow.durationSec}
                onProcess={flow.processWithAI}
                onDiscard={flow.discardAndRetry}
                error={flow.reviewError}
                retryInSec={flow.retryInSec}
              />
            )}

            {flow.phase === 'extracting' && (
              <ExtractingPhase
                structured={flow.structured}
                onDone={flow.setStructuredDone}
              />
            )}

            {flow.phase === 'extracted' && flow.structured && (
              <ExtractedPhase structured={flow.structured} onSave={save} />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </SceneTransition>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.s6, paddingBottom: spacing.s12 },
});
