import { clamp } from 'lodash';
import {
  ExpoSpeechRecognitionModule,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';

/**
 * On-device speech recognition (iOS Speech framework / Android SpeechRecognizer).
 *
 * Audio never leaves the device. Callers consume the live transcript from
 * interim results while the user speaks, then hand the final text to Gemini
 * for structuring.
 *
 * iOS Simulator note: simulators fall back to network-based recognition
 * because on-device recognition is unavailable. If the simulator can't
 * reach the internet you'll get error `network` or no results at all.
 */

export interface SpeechCallbacks {
  onPartial?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onVolume?: (normalized: number) => void;
  onError?: (code: string, message: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface SpeechHandle {
  stop: () => void;
  abort: () => void;
  getTranscript: () => string;
}

interface PermissionResult {
  granted: boolean;
  reason?: string;
}

const STOP_FINAL_DELAY_MS = 600;
const VOLUME_RAW_SHIFT = 2;
const VOLUME_RAW_RANGE = 12;
const VOLUME_FLOOR = 0.12;

export async function ensureSpeechPermission(): Promise<PermissionResult> {
  const existing = await ExpoSpeechRecognitionModule.getPermissionsAsync();
  if (existing.granted) return { granted: true };
  const req = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (req.granted) return { granted: true };
  return {
    granted: false,
    reason: req.canAskAgain
      ? 'Microphone and speech recognition access were denied.'
      : 'Permissions are blocked. Enable them in Settings → Sympnote.',
  };
}

const normalizeVolume = (raw: number): number => {
  const n = clamp((raw + VOLUME_RAW_SHIFT) / VOLUME_RAW_RANGE, 0, 1);
  return VOLUME_FLOOR + n * (1 - VOLUME_FLOOR);
};

export function startRecognition(cb: SpeechCallbacks): SpeechHandle {
  let latest = '';
  let finished = false;

  const subs = [
    ExpoSpeechRecognitionModule.addListener(
      'result',
      (e: ExpoSpeechRecognitionResultEvent) => {
        const t = e.results?.[0]?.transcript ?? '';
        if (!t) return;
        latest = t;
        if (e.isFinal) cb.onFinal?.(t);
        else cb.onPartial?.(t);
      },
    ),
    ExpoSpeechRecognitionModule.addListener(
      'volumechange',
      (e: { value: number }) => {
        const raw = typeof e.value === 'number' ? e.value : 0;
        cb.onVolume?.(normalizeVolume(raw));
      },
    ),
    ExpoSpeechRecognitionModule.addListener(
      'error',
      (e: ExpoSpeechRecognitionErrorEvent) => {
        cb.onError?.(e.error ?? 'unknown', e.message || 'Speech recognition error');
      },
    ),
    ExpoSpeechRecognitionModule.addListener('start', () => cb.onStart?.()),
    ExpoSpeechRecognitionModule.addListener('end', () => {
      if (finished) return;
      finished = true;
      cb.onEnd?.();
    }),
  ];

  try {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      maxAlternatives: 1,
      iosTaskHint: 'dictation',
      addsPunctuation: true,
      volumeChangeEventOptions: {
        enabled: true,
        intervalMillis: 300,
      },
    });
  } catch (e) {
    cb.onError?.('start-failed', String(e));
  }

  const cleanup = () => subs.forEach((s) => s.remove());

  return {
    getTranscript: () => latest,
    stop: () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      // Give the recognizer time to emit a final result before tearing
      // down listeners.
      setTimeout(cleanup, STOP_FINAL_DELAY_MS);
    },
    abort: () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
      cleanup();
    },
  };
}

const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone or speech recognition permission was denied. Enable both in Settings → Sympnote.',
  'no-speech':
    "We didn't hear anything. Hold the button and speak close to the mic.",
  'audio-capture':
    "We couldn't access the microphone. Another app may be using it.",
  network:
    'Speech recognition needs the internet on this device (the iOS Simulator always uses network mode). Check your connection.',
  'service-not-allowed':
    'Speech recognition is unavailable. On simulators, Siri must be enabled.',
  'language-not-supported':
    'This device does not support English (US) speech recognition.',
  busy: 'Another recognition request is still running. Try again in a moment.',
};

/**
 * Human-readable explanation for a speech-recognition error code.
 * Use this in alerts so users know what to try next.
 */
export function describeSpeechError(code: string): string {
  return SPEECH_ERROR_MESSAGES[code] ?? `Speech recognition error (${code}).`;
}
