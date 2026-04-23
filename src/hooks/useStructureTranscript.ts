import { useMutation } from '@tanstack/react-query';
import { structureTranscript } from '@/services/ai';

/**
 * Mutation wrapper around the Gemini structured-extraction call used by
 * the recording flow. The caller supplies per-call `onSuccess` / `onError`
 * to drive the phase state machine — quota errors are special-cased in
 * the recording hook so a retry countdown can surface.
 */
export const useStructureTranscript = () =>
  useMutation({
    mutationFn: (transcript: string) => structureTranscript(transcript),
  });
