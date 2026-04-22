import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { spacing, typography, useTheme } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hapticLight } from '@/services/haptics';
import type { StructuredWithSources } from '@/components/recording/types';
import { useExtractLayout, type Frame } from '@/hooks/useExtractLayout';
import { TranscriptCard } from './extracting/TranscriptCard';
import { BinGrid } from './extracting/BinGrid';
import { FlyingWord } from './extracting/FlyingWord';

interface ExtractingPhaseProps {
  /** null while Gemini is working; becomes non-null when done. */
  structured: StructuredWithSources | null;
  /** Original transcript text, used to show what the AI is reading. */
  transcript: string;
  onDone: () => void;
}

export const ExtractingPhase: React.FC<ExtractingPhaseProps> = ({
  structured,
  transcript,
  onDone,
}) => {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();

  const [binsFrame, setBinsFrame] = useState<Frame | null>(null);
  const [filled, setFilled] = useState<Record<string, boolean>>({});

  const scanPhase = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    scanPhase.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, scanPhase]);

  const { bins, flights } = useExtractLayout(structured, binsFrame, width);

  useEffect(() => {
    if (!structured || flights.length === 0) return;
    const total = flights.reduce((max, f) => Math.max(max, f.delay), 0) + 1000;
    const id = setTimeout(onDone, total);
    return () => clearTimeout(id);
  }, [structured, flights, onDone]);

  const onBinsLayout = (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    setBinsFrame({ x, y, width: w, height: h });
  };

  return (
    <View style={{ gap: spacing.s5 }}>
      <TranscriptCard
        transcript={transcript}
        sourcePhrases={structured?.sourcePhrases ?? {}}
        scanning={structured === null}
        scanPhase={scanPhase}
      />

      <View onLayout={onBinsLayout}>
        <Text
          style={[
            typography.label,
            {
              color: colors.textTertiary,
              letterSpacing: 0.3,
              marginBottom: spacing.s3,
            },
          ]}
        >
          {structured ? 'Sorting your words' : 'Sympnote is reading your words…'}
        </Text>
        <BinGrid bins={bins} structured={structured} filled={filled} />
      </View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {flights.map((f) => (
          <FlyingWord
            key={f.id}
            flight={f}
            onLand={() => {
              hapticLight();
              setFilled((prev) => ({ ...prev, [f.targetKey]: true }));
            }}
          />
        ))}
      </View>
    </View>
  );
};
