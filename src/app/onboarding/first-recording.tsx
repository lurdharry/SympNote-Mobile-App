import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import {
  makeStyles,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { WaveBars } from '@/components/ui/WaveBars';
import { Confetti } from '@/components/ui/Confetti';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useOnboardingRecorder } from '@/hooks/useOnboardingRecorder';
import { RECORDING_PROMPTS } from '@/constants/prompts';
import { MicOrb } from '@/components/first-recording/MicOrb';
import { ShimmerLines } from '@/components/first-recording/ShimmerLines';
import { TranscriptCard } from '@/components/first-recording/TranscriptCard';
import { StructuredCard } from '@/components/first-recording/StructuredCard';
import { ErrorCard } from '@/components/first-recording/ErrorCard';

type Phase = 'idle' | 'recording' | 'processing' | 'structured' | 'error';

const primaryLabel = (phase: Phase): string => {
  switch (phase) {
    case 'structured':
      return 'Continue';
    case 'recording':
      return 'Tap mic to finish';
    case 'processing':
      return 'Structuring…';
    case 'error':
      return 'Retry above';
    default:
      return 'Tap mic to begin';
  }
};

const ScreenFirstRecording: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const {
    phase,
    promptIdx,
    transcript,
    structured,
    fieldCount,
    burst,
    errorMessage,
    retryInSec,
    onMic,
    retryStructuring,
    resetToIdle,
    saveFirstRecording,
  } = useOnboardingRecorder();

  const onContinue = () => {
    if (!structured) return;
    saveFirstRecording();
    router.push('/onboarding/paywall');
  };

  const hasTranscript =
    !!transcript &&
    (phase === 'recording' ||
      phase === 'processing' ||
      phase === 'structured' ||
      phase === 'error');

  return (
    <SceneTransition mode="scale-fade">
      <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              8 of 9
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                typography.h1,
                { color: colors.textPrimary, textAlign: 'center' },
              ]}
            >
              Tell us what's going on
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 8,
                },
              ]}
            >
              Just talk. We turn it into a clinical summary.
            </Text>

            <View style={styles.micArea}>
              <Confetti show={burst} />
              <MicOrb phase={phase} onPress={onMic} reduced={reduced} />

              <View style={styles.subSlot}>
                {phase === 'idle' && (
                  <Text
                    key={promptIdx}
                    style={[
                      typography.body,
                      {
                        color: colors.textTertiary,
                        textAlign: 'center',
                        fontStyle: 'italic',
                      },
                    ]}
                  >
                    {RECORDING_PROMPTS[promptIdx]}
                  </Text>
                )}
                {phase === 'recording' && <WaveBars />}
                {phase === 'processing' && <ShimmerLines />}
              </View>

              <View style={styles.encryptedRow}>
                <Lock size={12} color={colors.textTertiary} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginLeft: 6 },
                  ]}
                >
                  End-to-end encrypted
                </Text>
              </View>
            </View>

            {hasTranscript && <TranscriptCard text={transcript} typing={false} />}

            {phase === 'structured' && structured && (
              <StructuredCard
                structured={structured}
                fieldCount={fieldCount}
                burst={burst}
              />
            )}

            {phase === 'error' && (
              <ErrorCard
                message={errorMessage ?? 'Something went wrong.'}
                retryInSec={retryInSec}
                onRetry={retryStructuring}
                onStartOver={resetToIdle}
              />
            )}
          </ScrollView>

          <View style={styles.ctaArea}>
            {phase === 'structured' && (
              <Pressable
                onPress={resetToIdle}
                hitSlop={8}
                style={styles.recordAgain}
              >
                <Text
                  style={[typography.caption, { color: colors.textTertiary }]}
                >
                  Record again
                </Text>
              </Pressable>
            )}
            <PrimaryButton
              label={primaryLabel(phase)}
              disabled={phase !== 'structured'}
              onPress={onContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default ScreenFirstRecording;

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
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s6,
  },
  micArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s6,
  },
  subSlot: {
    height: verticalScale(60),
    marginTop: theme.spacing.s5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s4,
  },
  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s3,
  },
  ctaArea: {
    paddingHorizontal: spacing.s6,
    paddingTop: 8,
    gap: 8,
  },
  recordAgain: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
}));
