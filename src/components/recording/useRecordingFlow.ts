import { useCallback, useState } from "react";
import { GeminiQuotaError } from "../../services/ai";
import { hapticLight, hapticMedium } from "../../services/haptics";
import { useStructureTranscript } from "../../hooks/useStructureTranscript";
import { showInfo } from "../ui/Toast";
import { Phase, StructuredWithSources } from "./types";

const DEBUG = __DEV__;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[recording-flow]", ...args);
};

export type RecordingFlow = {
  phase: Phase;
  reviewText: string;
  setReviewText: (v: string) => void;
  structured: StructuredWithSources | null;
  /** Human-readable error for the review phase (e.g. quota exhausted). */
  reviewError: string | null;
  /** Seconds until retry is allowed. 0 = allowed now. */
  retryInSec: number;
  discardAndRetry: () => void;
  processWithAI: () => Promise<void>;
  setStructuredDone: () => void;
  /** Drop the AI result and return to the compose surface with the
   *  typed text intact, so the user can edit and re-process. */
  goBackToReview: () => void;
};

/**
 * Drives the type-only /record flow: compose (`review`) → AI analyze
 * (`extracting`) → structured preview (`extracted`). Voice capture
 * was retired from this surface — it lives on the home long-press
 * FAB now — so this hook holds none of the speech-recognition
 * machinery it used to.
 */
export function useRecordingFlow(): RecordingFlow {
  const [phase, setPhaseRaw] = useState<Phase>("review");
  const [reviewText, setReviewText] = useState("");
  const [structured, setStructured] = useState<StructuredWithSources | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);

  const setPhase = useCallback((next: Phase) => {
    setPhaseRaw((prev) => {
      if (prev !== next) log("phase", prev, "→", next);
      return next;
    });
  }, []);

  const discardAndRetry = useCallback(() => {
    hapticLight();
    setReviewText("");
    setStructured(null);
    setReviewError(null);
    setRetryInSec(0);
    setPhase("review");
  }, [setPhase]);

  const structureMutation = useStructureTranscript();

  const processWithAI = useCallback(async () => {
    const text = reviewText.trim();
    if (!text) {
      showInfo("Nothing to process", { body: "Add or record something first." });
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

  const goBackToReview = useCallback(() => {
    hapticLight();
    setReviewError(null);
    setRetryInSec(0);
    setPhase("review");
  }, [setPhase]);

  return {
    phase,
    reviewText,
    setReviewText,
    structured,
    reviewError,
    retryInSec,
    discardAndRetry,
    processWithAI,
    setStructuredDone,
    goBackToReview,
  };
}
