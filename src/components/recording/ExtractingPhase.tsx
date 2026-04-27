import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  useTheme,
} from '@/theme';
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

/**
 * Status beats shown while Gemini is reading the transcript. Cycle
 * one every 1.6s and hold on the last so the user feels the AI is
 * actively working, not stalled. Mirrors the loading beats on
 * /onboarding/first-brief — same cinematic vocabulary.
 *
 * Once structured arrives, the line collapses to a single steady
 * "Sorting your words" while the flying-word animation runs.
 */
const READING_BEATS = [
  'Reading your words…',
  'Pulling out symptoms…',
  'Mapping the body system…',
  'Almost there.',
];

export const ExtractingPhase: React.FC<ExtractingPhaseProps> = ({
  structured,
  transcript,
  onDone,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();

  const [binsFrame, setBinsFrame] = useState<Frame | null>(null);
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const [beat, setBeat] = useState(0);

  const scanPhase = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    scanPhase.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, scanPhase]);

  // Cycle the reading beats while structured is null. Stop advancing
  // when the AI has returned — the line then switches to the sorting
  // copy.
  useEffect(() => {
    if (structured) return;
    const id = setInterval(() => {
      setBeat((b) => Math.min(b + 1, READING_BEATS.length - 1));
    }, 1600);
    return () => clearInterval(id);
  }, [structured]);

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

  const isReading = structured === null;
  const statusText = isReading ? READING_BEATS[beat] : 'Sorting your words';

  return (
    <View style={{ gap: spacing.s5 }}>
      {/* Editorial framing — matches the eyebrow treatment used in
          ExtractedPhase below. The cycling status beat replaces the
          old static "Sympnote is reading…" line. */}
      <Animated.View
        entering={FadeInDown.duration(360).easing(Easing.out(Easing.cubic))}
        style={styles.framingBlock}
      >
        <View style={styles.eyebrowRow}>
          <Sparkles size={moderateScale(12)} color={colors.accent} strokeWidth={2.4} />
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {isReading ? 'PARSING' : 'SORTING'}
          </Text>
        </View>
        <Animated.Text
          key={statusText}
          entering={FadeIn.duration(280)}
          style={[styles.statusLine, { color: colors.textSecondary }]}
        >
          {statusText}
        </Animated.Text>
      </Animated.View>

      <TranscriptCard
        transcript={transcript}
        sourcePhrases={structured?.sourcePhrases ?? {}}
        scanning={isReading}
        scanPhase={scanPhase}
      />

      <View onLayout={onBinsLayout} style={styles.binsBlock}>
        <Text style={[styles.sectionEyebrow, { color: colors.textTertiary }]}>
          INTO FIELDS
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

const useStyles = makeStyles((theme) => ({
  framingBlock: {
    gap: moderateScale(6),
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  eyebrow: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  statusLine: {
    fontFamily: 'Fraunces_500Medium',
    fontStyle: 'italic',
    fontSize: fontScale(18),
    lineHeight: fontScale(24),
    letterSpacing: -0.2,
  },
  binsBlock: {
    gap: theme.spacing.s3,
  },
  sectionEyebrow: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
}));
