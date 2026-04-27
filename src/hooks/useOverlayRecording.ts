import { View, Text } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { GeminiQuotaError } from "@/services/aiQuota";
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
  const [selectedClinicians, setSelectedClinicians] = useState<string[]>([]);

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
    setSelectedClinicians([]);
  }, []);

  const onCommit = useCallback(({ transcript, durationSec }: OncommitProps) => {
    setPostCapture({ transcript, durationSec, createdAt: new Date().toISOString() });
    setEditValue(transcript);
    setAiError(null);
    setRetryInSec(0);
    setSelectedClinicians([]);
  }, []);

  const toggleClinician = useCallback((name: string) => {
    setSelectedClinicians((prev) => {
      const norm = name.trim();
      const lower = norm.toLowerCase();
      const hit = prev.findIndex((s) => s.trim().toLowerCase() === lower);
      if (hit >= 0) return prev.filter((_, i) => i !== hit);
      return [...prev, norm];
    });
  }, []);

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
          ...(selectedClinicians.length > 0 ? { clinicianNames: selectedClinicians } : {}),
        });
        hapticHeavy();
        dismissOverlay();
      },
      onError: (e) => {
        setIsExtracting(false);
        if (e instanceof GeminiQuotaError) {
          setAiError(e.message);
          setRetryInSec(e.retryAfterSec ?? 0);
        } else {
          setAiError(e instanceof Error ? e.message : "Could not structure transcript.");
        }
      },
    });
  }, [postCapture, editValue, selectedClinicians, structureMutation, showToast, dismissOverlay]);

  return {
    selectedClinicians,
    setSelectedClinicians,
    toggleClinician,
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
