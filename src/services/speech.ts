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

export type SpeechCallbacks = {
  onPartial?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onVolume?: (normalized: number) => void; // 0..1
  onError?: (code: string, message: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
};

export type SpeechHandle = {
  stop: () => void;
  abort: () => void;
  getTranscript: () => string;
};

export async function ensureSpeechPermission(): Promise<{
  granted: boolean;
  reason?: string;
}> {
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

export function startRecognition(cb: SpeechCallbacks): SpeechHandle {
  let latest = '';
  let finished = false;

  const resultSub = ExpoSpeechRecognitionModule.addListener(
    'result',
    (e: ExpoSpeechRecognitionResultEvent) => {
      const t = e.results?.[0]?.transcript ?? '';
      if (!t) return;
      latest = t;
      if (e.isFinal) cb.onFinal?.(t);
      else cb.onPartial?.(t);
    }
  );

  const volumeSub = ExpoSpeechRecognitionModule.addListener(
    'volumechange',
    (e: { value: number }) => {
      const raw = typeof e.value === 'number' ? e.value : 0;
      const norm = Math.max(0, Math.min(1, (raw + 2) / 12));
      cb.onVolume?.(0.12 + norm * 0.88);
    }
  );

  const errorSub = ExpoSpeechRecognitionModule.addListener(
    'error',
    (e: ExpoSpeechRecognitionErrorEvent) => {
      cb.onError?.(e.error ?? 'unknown', e.message || 'Speech recognition error');
    }
  );

  const startSub = ExpoSpeechRecognitionModule.addListener('start', () => {
    cb.onStart?.();
  });

  const endSub = ExpoSpeechRecognitionModule.addListener('end', () => {
    if (finished) return;
    finished = true;
    cb.onEnd?.();
  });

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

  const cleanup = () => {
    resultSub.remove();
    volumeSub.remove();
    errorSub.remove();
    startSub.remove();
    endSub.remove();
  };

  return {
    getTranscript: () => latest,
    stop: () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      // Give the recognizer time to emit a final result before tearing
      // down listeners.
      setTimeout(cleanup, 600);
    },
    abort: () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
      cleanup();
    },
  };
}

/**
 * Human-readable explanation for a speech-recognition error code.
 * Use this in alerts so users know what to try next.
 */
export function describeSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'Microphone or speech recognition permission was denied. Enable both in Settings → Sympnote.';
    case 'no-speech':
      return "We didn't hear anything. Hold the button and speak close to the mic.";
    case 'audio-capture':
      return 'We couldn\'t access the microphone. Another app may be using it.';
    case 'network':
      return 'Speech recognition needs the internet on this device (the iOS Simulator always uses network mode). Check your connection.';
    case 'service-not-allowed':
      return 'Speech recognition is unavailable. On simulators, Siri must be enabled.';
    case 'language-not-supported':
      return 'This device does not support English (US) speech recognition.';
    case 'busy':
      return 'Another recognition request is still running. Try again in a moment.';
    default:
      return `Speech recognition error (${code}).`;
  }
}
