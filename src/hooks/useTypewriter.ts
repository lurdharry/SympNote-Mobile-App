import { useEffect, useState } from "react";

export interface UseTypewriterOptions {
  /** Milliseconds per character. Default 32. */
  charMs?: number;
  /** Initial delay before typing starts. Default 0. */
  delayMs?: number;
  /** When false, the full text renders immediately (reduced-motion). Default true. */
  enabled?: boolean;
  /** Fires once when the full text has been typed. */
  onDone?: () => void;
}

/**
 * Types `text` out one character at a time. Resets when `text` changes.
 * Returns the currently-displayed substring.
 */
export const useTypewriter = (text: string, options: UseTypewriterOptions = {}): string => {
  const { charMs = 32, delayMs = 0, enabled = true, onDone } = options;
  const [typed, setTyped] = useState<string>(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setTyped(text);
      onDone?.();
      return;
    }
    setTyped("");
    let i = 0;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (cancelled) return;
        i += 1;
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          onDone?.();
        }
      }, charMs);
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, charMs, delayMs, enabled, onDone]);

  return typed;
};
