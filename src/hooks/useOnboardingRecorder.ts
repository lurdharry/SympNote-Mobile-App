import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from '../services/speech';
import { structureTranscript, GeminiQuotaError } from '../services/ai';
import {
  hapticHeavy,
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from '../services/haptics';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { StructuredEntry } from '../stores/types';
import { StructuredWithSources } from '../components/recording/types';
import { uuid } from '../utils/uuid';
import { RECORDING_PROMPTS } from '../constants/prompts';
import { FIELD_META } from '../constants/fields';

export type RecorderPhase =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'structured'
  | 'error';

/**
 * Drives the onboarding first-recording screen.
 *
 * Owns: phase state machine, real speech capture, Gemini structuring,
 * retry-backoff, field-reveal animation timing, and the final save to
 * the recordings store. The screen renders the resulting state.
 */
export function useOnboardingRecorder() {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [promptIdx, setPromptIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [structured, setStructured] = useState<StructuredWithSources | null>(null);
  const [fieldCount, setFieldCount] = useState(0);
  const [burst, setBurst] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);

  const speechRef = useRef<SpeechHandle | null>(null);
  const promptRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedRef = useRef<string>('');
  const startedAtRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef<boolean>(false);

  // Rotate example prompts while idle.
  useEffect(() => {
    if (phase !== 'idle') {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
      return;
    }
    promptRotationRef.current = setInterval(
      () => setPromptIdx((i) => (i + 1) % RECORDING_PROMPTS.length),
      3000
    );
    return () => {
      if (promptRotationRef.current) clearInterval(promptRotationRef.current);
    };
  }, [phase]);

  // Retry countdown for quota errors.
  useEffect(() => {
    if (retryInSec <= 0) return;
    const id = setInterval(() => {
      setRetryInSec((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryInSec]);

  // Kick off structured field reveal + celebration when we hit 'structured'.
  useEffect(() => {
    if (phase !== 'structured') return;
    setFieldCount(0);
    setBurst(false);
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setFieldCount(n);
      if (n >= FIELD_META.length) {
        clearInterval(id);
        setTimeout(() => {
          setBurst(true);
          hapticSuccess();
        }, 200);
      }
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  const runGemini = async (text: string) => {
    setErrorMessage(null);
    setRetryInSec(0);
    setPhase('processing');
    try {
      const s = await structureTranscript(text);
      setStructured(s);
      setPhase('structured');
    } catch (e) {
      if (e instanceof GeminiQuotaError) {
        setErrorMessage(e.message);
        setRetryInSec(e.retryAfterSec ?? 0);
      } else {
        setErrorMessage(
          e instanceof Error ? e.message : 'Could not structure transcript.'
        );
      }
      setPhase('error');
    }
  };

  const stopAndProcess = async () => {
    const speech = speechRef.current;
    speechRef.current = null;
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    const duration = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;
    if (!speech) {
      setPhase('idle');
      return;
    }
    hapticMedium();
    speech.stop();
    await new Promise((r) => setTimeout(r, 500));
    const text = (speech.getTranscript() || capturedRef.current || '').trim();
    if (!text || duration < 1) {
      setPhase('idle');
      Alert.alert(
        'Nothing captured',
        duration < 1
          ? 'Tap the mic, speak a sentence, then tap again to finish.'
          : "We didn't catch any words. Try speaking a bit louder and closer to the mic."
      );
      return;
    }
    capturedRef.current = text;
    setTranscript(text);
    await runGemini(text);
  };

  const onMic = async () => {
    if (phase === 'recording') {
      void stopAndProcess();
      return;
    }
    if (phase !== 'idle') return;
    hapticHeavy();
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert(
        'Microphone access needed',
        perm.reason ??
          'Enable microphone and speech recognition in Settings to log your first entry.'
      );
      return;
    }
    capturedRef.current = '';
    setTranscript('');
    setStructured(null);
    setErrorMessage(null);
    startedAtRef.current = Date.now();
    setPhase('recording');
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
        onError: (code) => {
          if (code === 'no-speech') return;
          speechRef.current?.abort();
          speechRef.current = null;
          if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          setPhase('idle');
          Alert.alert('Speech recognition issue', describeSpeechError(code));
        },
      });
      durationTimerRef.current = setInterval(() => {
        // keep the tick so a future UI element can read startedAtRef.
      }, 500);
    } catch (e) {
      speechRef.current = null;
      setPhase('idle');
      Alert.alert('Could not start recording', String(e));
    }
  };

  const retryStructuring = () => {
    const text = (capturedRef.current || transcript).trim();
    if (!text) {
      setPhase('idle');
      return;
    }
    if (retryInSec > 0) return;
    void runGemini(text);
  };

  const resetToIdle = () => {
    hapticLight();
    speechRef.current?.abort();
    speechRef.current = null;
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    capturedRef.current = '';
    setTranscript('');
    setStructured(null);
    setErrorMessage(null);
    setRetryInSec(0);
    setFieldCount(0);
    setBurst(false);
    savedRef.current = false;
    setPhase('idle');
  };

  /**
   * Persist the captured + structured recording once, idempotently.
   * Returns true when the record was saved (first call with valid data),
   * false when nothing needed saving.
   */
  const saveFirstRecording = (): boolean => {
    if (!structured || savedRef.current) return false;
    savedRef.current = true;
    const text = (capturedRef.current || transcript).trim();
    const duration = startedAtRef.current
      ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      : 1;
    useRecordingsStore.getState().add({
      id: uuid(),
      createdAt: new Date().toISOString(),
      durationSec: duration,
      transcript: text,
      structured: structured as StructuredEntry,
      tags: structured.symptoms.filter(Boolean).slice(0, 2),
    });
    return true;
  };

  return {
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
  };
}
