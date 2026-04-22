import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { VoiceReactiveOrb } from './recording/VoiceReactiveOrb';
import { ShimmerText } from './animated/ShimmerText';
import { fontScale, makeStyles, moderateScale } from '../theme';
import { hapticHeavy, hapticMedium } from '../services/haptics';
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from '../services/speech';
import { structureTranscript } from '../services/ai';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { uuid } from '../utils/uuid';
import { formatDuration } from '../utils/date';

type Props = {
  onSaved?: (recordingId: string) => void;
};

type Phase = 'idle' | 'recording' | 'processing' | 'done';

/**
 * Home-tab recorder. Shares the VoiceReactiveOrb with onboarding so the
 * visual language is unified.
 */
export function RecordButton({ onSaved }: Props) {
  const styles = useStyles();
  const [phase, setPhase] = useState<Phase>('idle');
  const [dur, setDur] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');

  const meterSv = useSharedValue(0);
  const speechRef = useRef<SpeechHandle | null>(null);
  const startedAtRef = useRef(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      if (durationTimer.current) clearInterval(durationTimer.current);
    };
  }, []);

  const begin = async () => {
    if (speechRef.current) return;
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert(
        'Permissions needed',
        perm.reason ?? 'Enable microphone and speech recognition in Settings.'
      );
      return;
    }
    hapticHeavy();
    setPhase('recording');
    setDur(0);
    setLiveTranscript('');
    startedAtRef.current = Date.now();
    try {
      speechRef.current = startRecognition({
        onPartial: (t) => setLiveTranscript(t),
        onFinal: (t) => setLiveTranscript(t),
        onVolume: (v) => {
          meterSv.value = v;
        },
        onError: (code, message) => {
          if (code === 'no-speech') return;
          console.warn('[speech]', code, message);
          Alert.alert('Speech recognition issue', describeSpeechError(code));
        },
      });
      durationTimer.current = setInterval(() => {
        setDur(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e) {
      speechRef.current = null;
      setPhase('idle');
      Alert.alert('Could not start', String(e));
    }
  };

  const end = async () => {
    hapticMedium();
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    const speech = speechRef.current;
    speechRef.current = null;
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (!speech) {
      setPhase('idle');
      return;
    }
    speech.stop();
    await new Promise((r) => setTimeout(r, 350));
    const transcript = (speech.getTranscript() || liveTranscript || '').trim();

    if (!transcript || duration < 1) {
      setPhase('idle');
      Alert.alert('Nothing captured', 'Tap the mic, speak, then tap again to finish.');
      return;
    }

    setPhase('processing');
    try {
      const structured = await structureTranscript(transcript);
      const id = uuid();
      useRecordingsStore.getState().add({
        id,
        createdAt: new Date().toISOString(),
        durationSec: duration,
        transcript,
        structured,
        tags: structured.symptoms.slice(0, 3),
      });
      setPhase('done');
      onSaved?.(id);
      setTimeout(() => setPhase('idle'), 1200);
    } catch (e) {
      Alert.alert('Something went wrong', String(e));
      setPhase('idle');
    }
  };

  const toggle = () => {
    if (phase === 'idle') begin();
    else if (phase === 'recording') end();
  };

  return (
    <View style={styles.wrap}>
      <VoiceReactiveOrb
        active={phase === 'recording'}
        meterSv={meterSv}
        onPress={toggle}
        size={moderateScale(180)}
        disabled={phase === 'processing' || phase === 'done'}
      />

      {phase === 'recording' && (
        <View style={styles.info}>
          <Text style={styles.duration}>{formatDuration(dur)}</Text>
          {!!liveTranscript && (
            <Text numberOfLines={2} style={styles.liveTranscript}>
              {liveTranscript}
            </Text>
          )}
        </View>
      )}

      {phase === 'processing' && (
        <ShimmerText
          text="Processing..."
          textStyle={styles.shimmerText}
          containerStyle={styles.shimmerWrap}
        />
      )}

      {phase === 'done' && <Text style={styles.saved}>Saved</Text>}

      {(phase === 'idle' || phase === 'recording') && (
        <Text style={styles.caption}>
          {phase === 'recording' ? 'Tap to finish' : 'Tap to record'}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: { alignItems: 'center' },
  info: { alignItems: 'center', marginTop: theme.spacing.s5 },
  duration: {
    ...theme.typography.numberEditorial,
    color: theme.colors.warning,
    fontSize: fontScale(22),
    lineHeight: fontScale(24),
  },
  liveTranscript: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
  },
  shimmerText: { ...theme.typography.body, color: theme.colors.textSecondary },
  shimmerWrap: { marginTop: theme.spacing.s4 },
  saved: {
    ...theme.typography.body,
    color: theme.colors.success,
    marginTop: theme.spacing.s4,
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.s4,
  },
}));
