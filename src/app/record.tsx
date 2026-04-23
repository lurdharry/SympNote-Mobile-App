import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X as XIcon } from 'lucide-react-native';
import { fontScale, makeStyles, moderateScale, useTheme } from '../theme';
import { IdlePhase } from '../components/recording/IdlePhase';
import { RecordingPhase } from '../components/recording/RecordingPhase';
import { ReviewPhase } from '../components/recording/ReviewPhase';
import { ExtractingPhase } from '../components/recording/ExtractingPhase';
import { ExtractedPhase } from '../components/recording/ExtractedPhase';
import { useRecordingFlow } from '../components/recording/useRecordingFlow';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { uuid } from '../utils/uuid';
import { hapticHeavy, hapticLight } from '../services/haptics';
import type { Phase } from '../components/recording/types';

/**
 * Full-screen capture surface — opens over everything so the recording
 * orb and transcript own the device. Four phases progress left→right in
 * the indicator: record → review → analyze → confirm. Idle and recording
 * share the first step; extracting and extracted share the last two so
 * the stepper feels stable rather than jumping.
 */
const RecordModal: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const flow = useRecordingFlow();

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
        ].filter(Boolean),
      ),
    );
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: new Date().toISOString(),
      durationSec: flow.durationSec,
      transcript: flow.reviewText.trim(),
      structured: flow.structured,
      tags,
    });
    hapticHeavy();
    router.back();
  };

  const close = () => {
    hapticLight();
    router.back();
  };

  const title = titleForKind(kind);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <PhaseIndicator phase={flow.phase} />
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.close, { backgroundColor: colors.bgMuted }]}
          >
            <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        <View style={styles.body}>
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
            <ExtractedPhase structured={flow.structured} onSave={save} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── Phase indicator ──────────────────────────────────────────────────────
// Four visible steps. Idle + recording = step 1 (capture). Review = 2.
// Extracting = 3 (analyze). Extracted = 4 (confirm). Privacy lives outside
// the stepper because it's a consent gate, not a capture step.

const STEP_ORDER: { label: string; phases: Phase[] }[] = [
  { label: 'Capture', phases: ['idle', 'recording'] },
  { label: 'Review', phases: ['review'] },
  { label: 'Analyze', phases: ['extracting'] },
  { label: 'Confirm', phases: ['extracted'] },
];

const indexForPhase = (phase: Phase): number => {
  const idx = STEP_ORDER.findIndex((step) => step.phases.includes(phase));
  return idx === -1 ? 0 : idx;
};

const PhaseIndicator: React.FC<{ phase: Phase }> = ({ phase }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const active = indexForPhase(phase);
  return (
    <View style={styles.stepperRow}>
      {STEP_ORDER.map((step, i) => {
        const isActive = i === active;
        const isPast = i < active;
        return (
          <View key={step.label} style={styles.stepperCell}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: isActive
                    ? colors.accent
                    : isPast
                      ? colors.accent + '66'
                      : colors.border,
                  width: isActive ? moderateScale(18) : moderateScale(6),
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

// ─── Title helpers ────────────────────────────────────────────────────────

function kindToTag(raw: string): string | null {
  const k = raw.toLowerCase();
  if (k === 'medication' || k === 'meds' || k === 'med') return 'meds';
  if (k === 'symptom' || k === 'symptoms') return 'symptom';
  if (k === 'side-effect' || k === 'sideeffect' || k === 'side_effect')
    return 'side-effect';
  return null;
}

function titleForKind(raw?: string): string {
  if (!raw) return 'New entry';
  const k = raw.toLowerCase();
  if (k === 'medication' || k === 'meds' || k === 'med') return 'Log medication';
  if (k === 'symptom' || k === 'symptoms') return 'Log a symptom';
  if (k === 'side-effect' || k === 'sideeffect' || k === 'side_effect')
    return 'Log a side effect';
  return 'New entry';
}

export default RecordModal;

const useStyles = makeStyles((theme) => ({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s3,
    gap: moderateScale(12),
  },
  stepperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  stepperCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  close: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s2,
    paddingBottom: theme.spacing.s3,
  },
  title: {
    ...theme.typography.h1,
    fontSize: fontScale(28),
    lineHeight: fontScale(34),
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.s6,
  },
}));
