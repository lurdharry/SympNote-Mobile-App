import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X as XIcon } from 'lucide-react-native';
import { makeStyles, moderateScale, spacing, typography, useTheme } from '../theme';
import { SceneTransition } from '../components/navigation/SceneTransition';
import { TypewriterText } from '../components/animated/TypewriterText';
import { IdlePhase } from '../components/recording/IdlePhase';
import { RecordingPhase } from '../components/recording/RecordingPhase';
import { ReviewPhase } from '../components/recording/ReviewPhase';
import { ExtractingPhase } from '../components/recording/ExtractingPhase';
import { ExtractedPhase } from '../components/recording/ExtractedPhase';
import { useRecordingFlow } from '../components/recording/useRecordingFlow';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { useProfileStore } from '../stores/useProfileStore';
import { uuid } from '../utils/uuid';
import { hapticHeavy, hapticLight } from '../services/haptics';

/**
 * Standalone recording modal — used from the Home tab (FAB + quick-log
 * tiles) and anywhere else an entry needs to be captured outside of
 * onboarding.
 *
 * Behavior:
 *  - Reuses `useRecordingFlow` so privacy/idle/recording/review/
 *    extracting/extracted states match the onboarding screen exactly
 *  - On save: persists the recording to the store (with a preset tag if
 *    the caller passed `?kind=medication|symptom|sideEffect`) and
 *    dismisses the modal
 *  - Close button in the header lets the user abort mid-flow
 */
const RecordModal: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const flow = useRecordingFlow();
  const careTeam = useProfileStore((s) => s.personalization?.careTeam ?? []);
  const [clinicianName, setClinicianName] = useState<string | null>(null);

  // Persisted tag derived from the `kind` query parameter. Kept once the
  // screen mounts so late-arriving tag params don't overwrite.
  const presetTag = typeof kind === 'string' ? kindToTag(kind) : null;

  useEffect(() => {
    return () => {
      if (__DEV__) console.log('[record] unmount');
    };
  }, []);

  const save = () => {
    if (!flow.structured || !flow.reviewText) return;
    const tags = Array.from(
      new Set(
        [
          ...(presetTag ? [presetTag] : []),
          ...flow.structured.symptoms.slice(0, 2),
        ].filter(Boolean)
      )
    );
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: new Date().toISOString(),
      durationSec: flow.durationSec,
      transcript: flow.reviewText.trim(),
      structured: flow.structured,
      tags,
      ...(clinicianName ? { clinicianName } : {}),
    });
    hapticHeavy();
    router.back();
  };

  const close = () => {
    hapticLight();
    router.back();
  };

  const kindLabel = kindToLabel(kind);

  return (
    <SceneTransition mode="sheet-up">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {kindLabel && (
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
                  {kindLabel.toUpperCase()}
                </Text>
              )}
              <Text
                style={[
                  typography.h2,
                  { color: colors.textPrimary, marginTop: kindLabel ? 2 : 0 },
                ]}
              >
                New entry
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={[styles.closeBtn, { backgroundColor: colors.bgMuted }]}
            >
              <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ minHeight: 56, marginTop: spacing.s3 }}>
              <TypewriterText
                text="Tell me what's going on"
                speed={30}
                style={[typography.h1, { color: colors.textPrimary }]}
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
                transcript={flow.reviewText}
                onDone={flow.setStructuredDone}
              />
            )}

            {flow.phase === 'extracted' && flow.structured && (
              <ExtractedPhase
                structured={flow.structured}
                onSave={save}
                careTeam={careTeam}
                clinicianName={clinicianName}
                onClinicianChange={setClinicianName}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

function kindToTag(raw: string): string | null {
  const k = raw.toLowerCase();
  if (k === 'medication' || k === 'meds' || k === 'med') return 'meds';
  if (k === 'symptom' || k === 'symptoms') return 'symptom';
  if (k === 'side-effect' || k === 'sideeffect' || k === 'side_effect')
    return 'side-effect';
  return null;
}

function kindToLabel(raw?: string): string | null {
  if (!raw) return null;
  const k = raw.toLowerCase();
  if (k === 'medication' || k === 'meds' || k === 'med') return 'Medication';
  if (k === 'symptom' || k === 'symptoms') return 'Symptom';
  if (k === 'side-effect' || k === 'sideeffect' || k === 'side_effect')
    return 'Side effect';
  return null;
}

export default RecordModal;

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
    paddingBottom: theme.spacing.s12,
  },
}));
