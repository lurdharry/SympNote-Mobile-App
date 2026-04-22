import { useMemo } from 'react';
import { compact, keyBy } from 'lodash';
import { spacing } from '@/theme';
import type { FieldKey, StructuredWithSources } from '@/components/recording/types';
import { FIELDS } from '@/components/recording/types';

export const EXTRACT_BIN_KEYS: readonly FieldKey[] = [
  'symptoms',
  'location',
  'duration',
  'severity',
  'triggers',
] as const;

type BinKey = FieldKey | 'redFlags';

export interface BinLayout {
  key: BinKey;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Flight {
  id: string;
  label: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  tone: 'accent' | 'warn';
  targetKey: BinKey;
}

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CELL_HEIGHT = 72;
const COLS = 2;
const STEP_DELAY_MS = 180;

const FIELD_LABELS = keyBy(FIELDS, (f) => f.key);

const labelFor = (key: BinKey): string =>
  key === 'redFlags' ? 'Worth flagging' : FIELD_LABELS[key]?.label ?? key;

const firstValueFor = (key: FieldKey, s: StructuredWithSources): string => {
  switch (key) {
    case 'severity':
      return `${s.severity}/10`;
    case 'symptoms':
      return s.symptoms[0] ?? '';
    case 'triggers':
      return s.triggers[0] ?? '';
    case 'location':
      return s.location;
    case 'duration':
      return s.duration;
  }
};

export interface UseExtractLayoutResult {
  bins: BinLayout[];
  flights: Flight[];
  hasFlags: boolean;
}

/**
 * Derives the grid layout for extracted-field bins and the sequence of
 * flying-word flights given the measured container frame and the
 * structured AI output.
 */
export const useExtractLayout = (
  structured: StructuredWithSources | null,
  frame: Frame | null,
  screenWidth: number,
): UseExtractLayoutResult => {
  const hasFlags = !!structured && structured.redFlags.length > 0;

  const bins = useMemo<BinLayout[]>(() => {
    if (!frame) return [];
    const gutter = spacing.s3;
    const cellW = (frame.width - gutter * (COLS - 1)) / COLS;
    const keys: BinKey[] = hasFlags
      ? [...EXTRACT_BIN_KEYS, 'redFlags']
      : [...EXTRACT_BIN_KEYS];
    return keys.map((key, i) => ({
      key,
      label: labelFor(key),
      x: frame.x + (i % COLS) * (cellW + gutter),
      y: frame.y + Math.floor(i / COLS) * (CELL_HEIGHT + gutter),
      width: cellW,
      height: CELL_HEIGHT,
    }));
  }, [frame, hasFlags]);

  const flights = useMemo<Flight[]>(() => {
    if (!structured || bins.length === 0) return [];
    const binByKey = keyBy(bins, (b) => b.key);
    const fromY = 160;
    const fromX = screenWidth / 2;

    const fieldFlights: (Flight | null)[] = EXTRACT_BIN_KEYS.map((key, idx) => {
      const value = firstValueFor(key, structured);
      const bin = binByKey[key];
      if (!value || !bin) return null;
      return {
        id: `f-${key}`,
        label: value,
        fromX: fromX + ((idx * 37) % 120) - 60,
        fromY,
        toX: bin.x + 20,
        toY: bin.y + 34,
        delay: idx * STEP_DELAY_MS,
        tone: 'accent',
        targetKey: key,
      };
    });

    const flagBin = hasFlags ? binByKey.redFlags : null;
    const flagFlight: Flight | null =
      flagBin && structured.redFlags[0]
        ? {
            id: 'f-redFlags',
            label: structured.redFlags[0],
            fromX,
            fromY,
            toX: flagBin.x + 20,
            toY: flagBin.y + 34,
            delay: EXTRACT_BIN_KEYS.length * STEP_DELAY_MS,
            tone: 'warn',
            targetKey: 'redFlags',
          }
        : null;

    return compact([...fieldFlights, flagFlight]);
  }, [structured, bins, hasFlags, screenWidth]);

  return { bins, flights, hasFlags };
};
