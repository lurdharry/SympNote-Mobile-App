import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import {
  ensureSpeechPermission,
  startRecognition,
  describeSpeechError,
  SpeechHandle,
} from "../../services/speech";
import { GeminiQuotaError } from "../../services/ai";
import { hapticHeavy, hapticLight, hapticMedium } from "../../services/haptics";
import { useStructureTranscript } from "../../hooks/useStructureTranscript";
import { Phase, StructuredWithSources } from "./types";

const DEBUG = __DEV__;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[recording-flow]", ...args);
};

export type RecordingFlow = {
  phase: Phase;
  durationSec: number;
  liveTranscript: string;
  reviewText: string;
  setReviewText: (v: string) => void;
  structured: StructuredWithSources | null;
  meterSv: SharedValue<number>;
  /** Human-readable error for the review phase (e.g. quota exhausted). */
  reviewError: string | null;
  /** Seconds until retry is allowed. 0 = allowed now. */
  retryInSec: number;

  beginRecording: () => Promise<void>;
  endRecording: () => Promise<void>;
  toggleRecording: () => void;
  skipToTyping: () => void;
  discardAndRetry: () => void;
  processWithAI: () => Promise<void>;
  setStructuredDone: () => void;
};

export function useRecordingFlow(): RecordingFlow {
  const [phase, setPhaseRaw] = useState<Phase>("idle");
  const [durationSec, setDurationSec] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [structured, setStructured] = useState<StructuredWithSources | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);

  const meterSv = useSharedValue(0);
  const speechRef = useRef<SpeechHandle | null>(null);
  const startedAtRef = useRef(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wrap setPhase so we can trace transitions.
  const setPhase = useCallback((next: Phase) => {
    setPhaseRaw((prev) => {
      if (prev !== next) log("phase", prev, "→", next);
      return next;
    });
  }, []);

  const stopSpeechIfActive = useCallback(() => {
    if (speechRef.current) {
      log("abort active speech handle");
      speechRef.current.abort();
      speechRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount ONLY. Empty deps avoid React 19 effect re-runs.
  useEffect(() => {
    return () => {
      log("unmount cleanup");
      stopSpeechIfActive();
    };
  }, [stopSpeechIfActive]);

  // Retry countdown tick while the UI shows a quota wait.
  useEffect(() => {
    if (retryInSec <= 0) return;
    const id = setInterval(() => {
      setRetryInSec((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryInSec]);

  const resetForNewAttempt = useCallback(() => {
    setLiveTranscript("");
    setReviewText("");
    setStructured(null);
  }, []);

  const beginRecording = useCallback(async () => {
    if (speechRef.current) {
      log("begin blocked: speech already active");
      return;
    }
    log("begin: requesting permissions");
    const perm = await ensureSpeechPermission();
    if (!perm.granted) {
      Alert.alert("Permissions needed", perm.reason ?? "Enable microphone and speech in Settings.");
      return;
    }
    hapticHeavy();
    resetForNewAttempt();
    startedAtRef.current = Date.now();
    setDurationSec(0);
    setPhase("recording");
    log("begin: starting recognition");
    try {
      speechRef.current = startRecognition({
        onStart: () => log("speech started"),
        onPartial: (t) => setLiveTranscript(t),
        onFinal: (t) => {
          log("speech final:", t.slice(0, 60));
          setLiveTranscript(t);
        },
        onVolume: (v) => {
          meterSv.value = v;
        },
        onError: (code, message) => {
          log("speech error", code, message);
          if (code === "no-speech") return;
          Alert.alert("Speech recognition issue", describeSpeechError(code));
        },
        onEnd: () => log("speech ended"),
      });
      durationTimerRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e) {
      log("begin: threw", e);
      speechRef.current = null;
      setPhase("idle");
      Alert.alert("Could not start recording", String(e));
    }
  }, [meterSv, resetForNewAttempt, setPhase]);

  const endRecording = useCallback(async () => {
    hapticMedium();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    const speech = speechRef.current;
    speechRef.current = null;
    const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (!speech) {
      log("end: no active speech handle");
      setPhase("idle");
      return;
    }
    log("end: stopping speech (duration:", duration, ")");
    speech.stop();
    // Give recognizer a moment to flush a final result event.
    await new Promise((r) => setTimeout(r, 500));
    const transcript = (speech.getTranscript() || liveTranscript || "").trim();
    log("end: transcript length:", transcript.length);
    if (!transcript || duration < 1) {
      setPhase("idle");
      Alert.alert(
        "Nothing captured",
        duration < 1
          ? "Tap the mic, speak a sentence, then tap again to finish."
          : "We didn't catch any words. Try speaking a bit louder and closer to the mic.",
      );
      return;
    }
    setReviewText(transcript);
    setDurationSec(duration);
    setPhase("review");
  }, [liveTranscript, setPhase]);

  const toggleRecording = useCallback(() => {
    if (phase === "idle") void beginRecording();
    else if (phase === "recording") void endRecording();
  }, [phase, beginRecording, endRecording]);

  /**
   * Skip the mic entirely and go straight to the review/edit box. For users
   * who denied permissions, can't get speech recognition to work, or just
   * prefer typing.
   */
  const skipToTyping = useCallback(() => {
    resetForNewAttempt();
    setDurationSec(0);
    setPhase("review");
  }, [resetForNewAttempt, setPhase]);

  const discardAndRetry = useCallback(() => {
    hapticLight();
    resetForNewAttempt();
    setReviewError(null);
    setRetryInSec(0);
    setPhase("idle");
  }, [resetForNewAttempt, setPhase]);

  const structureMutation = useStructureTranscript();

  const processWithAI = useCallback(async () => {
    const text = reviewText.trim();
    if (!text) {
      Alert.alert("Nothing to process", "Add or record something first.");
      return;
    }
    hapticMedium();
    setReviewError(null);
    setRetryInSec(0);
    setPhase("extracting");
    log("extracting: calling Gemini");
    structureMutation.mutate(text, {
      onSuccess: (s) => {
        log("extracting: done");
        setStructured(s);
        // ExtractingPhase plays the flying-word animation, then calls
        // setStructuredDone to advance to 'extracted'.
      },
      onError: (e) => {
        log("extracting: failed", e);
        if (e instanceof GeminiQuotaError) {
          setReviewError(e.message);
          setRetryInSec(e.retryAfterSec ?? 0);
        } else {
          setReviewError(e instanceof Error ? e.message : "Could not structure transcript.");
        }
        setPhase("review");
      },
    });
  }, [reviewText, setPhase, structureMutation]);

  const setStructuredDone = useCallback(() => {
    setPhase("extracted");
  }, [setPhase]);

  return {
    phase,
    durationSec,
    liveTranscript,
    reviewText,
    setReviewText,
    structured,
    meterSv,
    reviewError,
    retryInSec,
    beginRecording,
    endRecording,
    toggleRecording,
    skipToTyping,
    discardAndRetry,
    processWithAI,
    setStructuredDone,
  };
}
