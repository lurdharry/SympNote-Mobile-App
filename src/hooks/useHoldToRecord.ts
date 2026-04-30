import { useCallback, useEffect, useRef, useState } from "react";
import { useSharedValue, SharedValue } from "react-native-reanimated";
import {
  ensureSpeechPermission,
  startRecognition,
  SpeechHandle,
} from "../services/speech";
import { hapticHeavy, hapticLight, hapticMedium } from "../services/haptics";
import { showError } from "../components/ui/Toast";

export interface HoldToRecordState {
  /** True once the hold has been held long enough to begin recording. */
  isRecording: boolean;
  /** Live interim transcript surfaced by the speech recognizer. */
  liveTranscript: string;
  /** Seconds elapsed since recording actually started. */
  durationSec: number;
  /** 0–1 normalized volume, for a volume-reactive orb/pulse. */
  volume: SharedValue<number>;
}

export interface HoldToRecordHandlers {
  /** Attach to the FAB's `onPressIn`. Starts the hold timer. */
  onPressIn: () => void;
  /** Attach to the FAB's `onPressOut`. Commits the recording if long
   *  enough, else discards silently. */
  onPressOut: () => void;
  /** Imperative cancel — used when the user drags off-screen or we
   *  need to abort mid-hold (app backgrounded, etc.). */
  cancel: () => void;
}

export interface HoldToRecordOptions {
  /**
   * ms to wait after press-in before actually starting recognition.
   * Short taps under this threshold fire `onShortTap` instead.
   */
  holdThresholdMs?: number;
  /**
   * Minimum duration a committed hold must reach before it's treated
   * as a real recording. Releases under this commit a silent discard
   * rather than a save.
   */
  minCommitDurationMs?: number;
  /**
   * Fired when the user pressed but released before the hold
   * threshold — surface a toast like "Hold to record". Never fires
   * after recording has begun.
   */
  onShortTap?: () => void;
  /**
   * Fired when a valid recording finishes. The callback receives the
   * finalized transcript and duration in seconds. The caller is
   * responsible for deciding what to do next (navigate, persist,
   * etc.).
   */
  onCommit?: (result: { transcript: string; durationSec: number }) => void;
  /**
   * Fired when a hold started recording but ended empty or too short.
   * Gives the caller a chance to show feedback ("didn't catch that").
   */
  onDiscard?: (reason: "too-short" | "empty") => void;
}

/**
 * Hold-to-record controller for the home FAB. Owns a single speech
 * session, a duration timer, a volume shared value, and the
 * long-press gating. Use it like:
 *
 *   const { state, handlers } = useHoldToRecord({
 *     onCommit: ({ transcript, durationSec }) => { ... },
 *     onShortTap: () => showToast("Hold to record"),
 *   });
 *   <Pressable onPressIn={handlers.onPressIn} onPressOut={handlers.onPressOut} />
 */
export function useHoldToRecord(opts: HoldToRecordOptions = {}): {
  state: HoldToRecordState;
  handlers: HoldToRecordHandlers;
} {
  const {
    holdThresholdMs = 500,
    minCommitDurationMs = 1000,
    onShortTap,
    onCommit,
    onDiscard,
  } = opts;

  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const volume = useSharedValue(0);

  // Refs because these shouldn't trigger re-renders while a hold is
  // in progress — the JSX only cares about `isRecording` / transcript
  // / duration, which are state above.
  const speechRef = useRef<SpeechHandle | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const pressActiveRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const cancelRequestedRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const resetLocalState = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setLiveTranscript("");
    setDurationSec(0);
    volume.value = 0;
  }, [volume]);

  const cancel = useCallback(() => {
    cancelRequestedRef.current = true;
    pressActiveRef.current = false;
    clearTimers();
    if (speechRef.current) {
      speechRef.current.abort();
      speechRef.current = null;
    }
    resetLocalState();
  }, [clearTimers, resetLocalState]);

  // Clean up on unmount — don't leave a dangling speech session.
  useEffect(() => {
    return () => {
      clearTimers();
      if (speechRef.current) {
        speechRef.current.abort();
        speechRef.current = null;
      }
    };
  }, [clearTimers]);

  const beginRecording = useCallback(async () => {
    // Guard: user may have already released before the hold threshold
    // fired its timeout callback.
    if (!pressActiveRef.current) return;
    if (speechRef.current) return;

    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      // On denial we bail quietly; the caller's short-tap fallback will
      // still fire for subsequent taps, so surface a one-time toast.
      showError("Microphone needed", {
        body: perm.reason ?? "Enable microphone and speech in Settings.",
      });
      pressActiveRef.current = false;
      return;
    }

    // If the user already released while we were awaiting permissions,
    // abort before actually opening the mic.
    if (!pressActiveRef.current) return;

    hapticHeavy();
    setIsRecording(true);
    isRecordingRef.current = true;
    setLiveTranscript("");
    setDurationSec(0);
    volume.value = 0;
    startedAtRef.current = Date.now();

    try {
      speechRef.current = startRecognition({
        onPartial: (t) => setLiveTranscript(t),
        onFinal: (t) => setLiveTranscript(t),
        onVolume: (v) => {
          volume.value = v;
        },
        onError: (code) => {
          // Swallow "no-speech"; surface other errors as a gentle alert
          // after cleanup so the overlay can still close.
          if (code !== "no-speech" && __DEV__) {
            console.log("[hold-to-record] speech error", code);
          }
        },
      });
      durationTimerRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch {
      resetLocalState();
      showError("Could not start recording", {
        body: "Try again in a moment, or tap the mic to open the recorder manually.",
      });
    }
  }, [resetLocalState, volume]);

  const onPressIn = useCallback(() => {
    pressActiveRef.current = true;
    cancelRequestedRef.current = false;
    hapticLight();
    // Arm the hold threshold; if the user holds past it, we start
    // recording. Otherwise onPressOut fires first and we treat it as
    // a short tap.
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      void beginRecording();
    }, holdThresholdMs);
  }, [beginRecording, holdThresholdMs]);

  const onPressOut = useCallback(() => {
    if (!pressActiveRef.current) return;
    pressActiveRef.current = false;

    // Case 1: user released before the hold threshold fired.
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      // Recording never started — surface the short-tap toast hint.
      onShortTap?.();
      return;
    }

    // Case 2: hold was cancelled imperatively (e.g. slide-off). We
    // already did cleanup in `cancel`; nothing else to do.
    if (cancelRequestedRef.current) {
      cancelRequestedRef.current = false;
      return;
    }

    // Case 3: the hold produced a real recording — stop and commit
    // when the transcript is non-empty and long enough.
    const speech = speechRef.current;
    speechRef.current = null;

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (!speech) {
      resetLocalState();
      return;
    }

    const heldMs = Date.now() - startedAtRef.current;
    hapticMedium();
    speech.stop();

    // Give the recognizer a beat to flush a final result. Speech
    // service's 600ms timer for this is baked into stop(); we await
    // a little longer here to be safe.
    setTimeout(() => {
      const transcript = speech.getTranscript().trim();
      const dur = Math.max(0, Math.round(heldMs / 1000));

      if (heldMs < minCommitDurationMs) {
        onDiscard?.("too-short");
        resetLocalState();
        return;
      }
      if (!transcript) {
        onDiscard?.("empty");
        resetLocalState();
        return;
      }
      onCommit?.({ transcript, durationSec: dur });
      resetLocalState();
    }, 700);
  }, [minCommitDurationMs, onCommit, onDiscard, onShortTap, resetLocalState]);

  return {
    state: {
      isRecording,
      liveTranscript,
      durationSec,
      volume,
    },
    handlers: {
      onPressIn,
      onPressOut,
      cancel,
    },
  };
}
