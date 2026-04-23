import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  Easing,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from '../services/speech';
import { hapticHeavy, hapticLight, hapticMedium } from '../services/haptics';
import { usePendingRecordingStore } from '../stores/usePendingRecordingStore';
import { RECORDING_PROMPTS } from '../constants/prompts';

export type RecorderPhase = 'idle' | 'recording' | 'ready';

/**
 * Drives the onboarding first-recording screen.
 *
 * Owns: phase state machine + local speech capture. The structuring
 * Gemini call has been deferred to the paywall — we only want to pay
 * per conversion, not per install. When the user taps Continue we
 * stash the raw transcript as a pending draft; the paywall picks it up
 * after purchase, runs Gemini, and commits the real recording.
 */
export function useOnboardingRecorder() {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [promptIdx, setPromptIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);

  const speechRef = useRef<SpeechHandle | null>(null);
  const promptRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedRef = useRef<string>('');
  const startedAtRef = useRef<number>(0);
  const capturedAtRef = useRef<string>('');
  const durationRef = useRef<number>(0);
  const savedRef = useRef<boolean>(false);

  // Normalized mic amplitude (0..1) driven by the speech service's
  // `volumechange` event. Off-JS-thread so the recording screen doesn't
  // re-render on every meter tick.
  const volume = useSharedValue(0);

  // Rotate example prompts while idle.
  useEffect(() => {
    if (phase !== 'idle') {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
      return;
    }
    promptRotationRef.current = setInterval(
      () => setPromptIdx((i) => (i + 1) % RECORDING_PROMPTS.length),
      3000,
    );
    return () => {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
    };
  }, []);

  const stopAndReady = async () => {
    const speech = speechRef.current;
    speechRef.current = null;
    const duration = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;
    if (!speech) {
      setPhase('idle');
      return;
    }
    hapticMedium();
    speech.stop();
    volume.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    await new Promise((r) => setTimeout(r, 500));
    const text = (speech.getTranscript() || capturedRef.current || '').trim();
    if (!text || duration < 1) {
      setPhase('idle');
      Alert.alert(
        'Nothing captured',
        duration < 1
          ? 'Tap the mic, speak a sentence, then tap again to finish.'
          : "We didn't catch any words. Try speaking a bit louder and closer to the mic.",
      );
      return;
    }
    capturedRef.current = text;
    durationRef.current = Math.max(1, duration);
    setDuration(Math.max(1, duration));
    setTranscript(text);
    setPhase('ready');
  };

  const startFresh = async () => {
    hapticHeavy();
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert(
        'Microphone access needed',
        perm.reason ??
          'Enable microphone and speech recognition in Settings to log your first entry.',
      );
      return;
    }
    capturedRef.current = '';
    durationRef.current = 0;
    savedRef.current = false;
    setTranscript('');
    setDuration(0);
    startedAtRef.current = Date.now();
    capturedAtRef.current = new Date().toISOString();
    setPhase('recording');
    volume.value = 0;
    try {
      speechRef.current = startRecognition({
        onPartial: (t) => {
          capturedRef.current = t;
          setTranscript(t);
        },
        onFinal: (t) => {
          capturedRef.current = t;
          setTranscript(t);
        },
        onVolume: (v) => {
          volume.value = withTiming(v, {
            duration: 180,
            easing: Easing.out(Easing.quad),
          });
        },
        onError: (code) => {
          if (code === 'no-speech') return;
          speechRef.current?.abort();
          speechRef.current = null;
          setPhase('idle');
          Alert.alert('Speech recognition issue', describeSpeechError(code));
        },
      });
    } catch (e) {
      speechRef.current = null;
      setPhase('idle');
      Alert.alert('Could not start recording', String(e));
    }
  };

  const onMic = async () => {
    if (phase === 'recording') {
      void stopAndReady();
      return;
    }
    // idle or ready → start a fresh capture
    await startFresh();
  };

  const resetToIdle = () => {
    hapticLight();
    speechRef.current?.abort();
    speechRef.current = null;
    capturedRef.current = '';
    durationRef.current = 0;
    savedRef.current = false;
    volume.value = 0;
    setTranscript('');
    setDuration(0);
    setPhase('idle');
  };

  /**
   * Stash the captured transcript as a draft on the pending store.
   * The paywall promotes it to the real recordings store after Gemini
   * structuring runs post-purchase. Idempotent: repeat calls after a
   * successful stash return true without re-writing, so navigation on
   * back-and-forth re-entries still proceeds.
   */
  const saveFirstRecording = (): boolean => {
    if (phase !== 'ready') return false;
    if (savedRef.current) return true;
    const text = (capturedRef.current || transcript).trim();
    if (!text) return false;
    savedRef.current = true;
    usePendingRecordingStore.getState().setDraft({
      transcript: text,
      durationSec: durationRef.current || 1,
      createdAt: capturedAtRef.current || new Date().toISOString(),
    });
    return true;
  };

  return {
    phase,
    promptIdx,
    transcript,
    duration,
    volume: volume as SharedValue<number>,
    onMic,
    resetToIdle,
    saveFirstRecording,
  };
}
