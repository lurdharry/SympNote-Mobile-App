import { useCallback, useEffect, useState } from "react";
import { LLMQuotaError } from "@/services/aiQuota";
import { hapticHeavy } from "@/services/haptics";
import { useStructureTranscript } from "./useStructureTranscript";
import { uuid } from "@/utils/uuid";
import { useRecordingsStore } from "@/stores/useRecordingsStore";

interface UseOverlayRecordingProps {
  showToast: (message: string) => void;
}

interface OncommitProps {
  transcript: string;
  durationSec: number;
}

export const useOverlayRecording = ({ showToast }: UseOverlayRecordingProps) => {
  // Post-release state — the captured transcript + duration we're
  // reviewing. Null means no review in progress. When this is set
  // alongside isRecording=false the overlay stays mounted in
  // review/extracting mode instead of dismissing.
  const [postCapture, setPostCapture] = useState<{
    transcript: string;
    durationSec: number;
    createdAt: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [retryInSec, setRetryInSec] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  const structureMutation = useStructureTranscript();

  // Retry countdown tick for quota errors.
  useEffect(() => {
    if (retryInSec <= 0) return;
    const id = setInterval(() => {
      setRetryInSec((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryInSec]);

  const dismissOverlay = useCallback(() => {
    setPostCapture(null);
    setEditValue("");
    setAiError(null);
    setRetryInSec(0);
    setIsExtracting(false);
  }, []);

  const onCommit = useCallback(({ transcript, durationSec }: OncommitProps) => {
    setPostCapture({ transcript, durationSec, createdAt: new Date().toISOString() });
    setEditValue(transcript);
    setAiError(null);
    setRetryInSec(0);
  }, []);

  // Notes are no longer tagged with clinicians at save-time. Audience
  // tagging belongs on the brief (see brief-first pivot in the dev
  // plan), so the recording just persists the transcript + structured
  // fields without any per-note routing.
  const onSave = useCallback(() => {
    if (!postCapture) return;
    const text = editValue.trim();
    if (!text) {
      showToast("Nothing to save");
      return;
    }
    setAiError(null);
    setIsExtracting(true);
    structureMutation.mutate(text, {
      onSuccess: (structured) => {
        const tags = Array.from(new Set(structured.symptoms.slice(0, 2).filter(Boolean)));
        useRecordingsStore.getState().add({
          id: uuid(),
          createdAt: postCapture.createdAt,
          durationSec: postCapture.durationSec,
          transcript: text,
          structured,
          tags,
        });
        hapticHeavy();
        dismissOverlay();
      },
      onError: (e) => {
        setIsExtracting(false);
        if (e instanceof LLMQuotaError) {
          setAiError(e.message);
          setRetryInSec(e.retryAfterSec ?? 0);
        } else {
          setAiError(e instanceof Error ? e.message : "Could not structure transcript.");
        }
      },
    });
  }, [postCapture, editValue, structureMutation, showToast, dismissOverlay]);

  return {
    onSave,
    isExtracting,
    postCapture,
    onCommit,
    dismissOverlay,
    retryInSec,
    aiError,
    editValue,
    setEditValue,
  };
};
