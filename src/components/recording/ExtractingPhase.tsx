import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { fontScale, makeStyles, moderateScale, scale, spacing, typography, useTheme, verticalScale } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticLight } from '../../services/haptics';
import {
  FIELDS,
  FieldKey,
  StructuredWithSources,
  fieldValue,
} from './types';

/**
 * Extracting scene — the AI literally shows its work.
 *
 * Layout:
 *  1. A transcript card at top. While Gemini is working a "scan line"
 *     sweeps top→bottom, tinting words in accent as it passes.
 *  2. When the structured result arrives, each sourcePhrase lifts out of
 *     the transcript (highlighted in place) while a COPY of its value
 *     arcs down to its labeled bin in the grid below.
 *  3. Bins sit in a 2-column responsive grid. Each bin has a label, an
 *     empty slot when waiting, a serif value once filled, and a subtle
 *     accent fill animation as it receives its word.
 *  4. A red-flag bin appears at the right edge of the grid only if the
 *     entry has any flags — rendered in error tone with a pulsing rule.
 *  5. When everything has landed, the scene settles. A later phase can
 *     swap to the final structured view.
 *
 * All motion shared values live off the JS thread so the 60fps scan,
 * glow, and arc animations don't compete with React.
 */

type Props = {
  /** null while Gemini is working; becomes non-null when done. */
  structured: StructuredWithSources | null;
  /** Original transcript text, used to show what the AI is reading. */
  transcript: string;
  onDone: () => void;
};

// Keys we're going to animate INTO bins. `medications` is optional — it
// appears only if present.
const BIN_KEYS: FieldKey[] = [
  'symptoms',
  'location',
  'duration',
  'severity',
  'triggers',
];

type BinLayout = {
  key: string; // FieldKey | 'redFlags'
  label: string;
  x: number; // top-left
  y: number;
  width: number;
  height: number;
};

type Flight = {
  id: string;
  label: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
  tone: 'accent' | 'warn';
  /** Which bin (by key) to mark as filled on arrival. */
  targetKey: string;
};

export function ExtractingPhase({
  structured,
  transcript,
  onDone,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();

  // Measure container to compute bin positions precisely.
  const [binsFrame, setBinsFrame] = useState<
    { x: number; y: number; width: number; height: number } | null
  >(null);

  // Filled-state per bin. When a flight lands, mark true.
  const [filled, setFilled] = useState<Record<string, boolean>>({});

  const scanPhase = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    scanPhase.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [reduced, scanPhase]);

  const hasFlags =
    (structured?.redFlags.length ?? 0) > 0 && structured !== null;

  // Compute bin layout given the measured bins container size.
  const bins = useMemo<BinLayout[]>(() => {
    if (!binsFrame) return [];
    const cols = 2;
    const gutter = spacing.s3;
    const cellW = (binsFrame.width - gutter * (cols - 1)) / cols;
    const cellH = 72;
    const keys = hasFlags ? [...BIN_KEYS, 'redFlags'] : BIN_KEYS;
    return keys.map((key, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const label =
        key === 'redFlags'
          ? 'Worth flagging'
          : FIELDS.find((f) => f.key === key)?.label ?? key;
      return {
        key,
        label,
        x: binsFrame.x + col * (cellW + gutter),
        y: binsFrame.y + row * (cellH + gutter),
        width: cellW,
        height: cellH,
      };
    });
  }, [binsFrame, hasFlags]);

  // Flights: only compute once structured arrives + layout known.
  const flights = useMemo<Flight[]>(() => {
    if (!structured || bins.length === 0) return [];
    const list: Flight[] = [];

    const fromYApprox = 160; // origin somewhere over the transcript card
    const fromXApprox = width / 2;

    BIN_KEYS.forEach((key, idx) => {
      const value = (() => {
        if (key === 'severity') return `${structured.severity}/10`;
        if (key === 'symptoms') return structured.symptoms[0] ?? '';
        if (key === 'triggers') return structured.triggers[0] ?? '';
        if (key === 'location') return structured.location;
        if (key === 'duration') return structured.duration;
        return '';
      })();
      if (!value) return;
      const bin = bins.find((b) => b.key === key);
      if (!bin) return;
      list.push({
        id: `f-${key}`,
        label: value,
        fromX: fromXApprox + ((idx * 37) % 120) - 60,
        fromY: fromYApprox,
        toX: bin.x + 20,
        toY: bin.y + 34,
        delay: idx * 180,
        tone: 'accent',
        targetKey: key,
      });
    });

    if (hasFlags && structured.redFlags.length > 0) {
      const bin = bins.find((b) => b.key === 'redFlags');
      if (bin) {
        list.push({
          id: `f-redFlags`,
          label: structured.redFlags[0] ?? 'flag',
          fromX: fromXApprox,
          fromY: fromYApprox,
          toX: bin.x + 20,
          toY: bin.y + 34,
          delay: BIN_KEYS.length * 180,
          tone: 'warn',
          targetKey: 'redFlags',
        });
      }
    }
    return list;
  }, [structured, bins, hasFlags, width]);

  // Kick off onDone once every flight has had time to land.
  useEffect(() => {
    if (!structured || flights.length === 0) return;
    const total = flights.reduce((max, f) => Math.max(max, f.delay), 0) + 1000;
    const id = setTimeout(onDone, total);
    return () => clearTimeout(id);
  }, [structured, flights, onDone]);

  return (
    <View style={{ gap: spacing.s5 }}>
      <TranscriptCard
        transcript={transcript}
        sourcePhrases={structured?.sourcePhrases ?? {}}
        scanning={structured === null}
        scanPhase={scanPhase}
      />

      <View
        onLayout={(e: LayoutChangeEvent) => {
          const { x, y, width: w, height: h } = e.nativeEvent.layout;
          setBinsFrame({ x, y, width: w, height: h });
        }}
      >
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, letterSpacing: 0.3, marginBottom: spacing.s3 },
          ]}
        >
          {structured
            ? hasFlags
              ? 'Sorting your words'
              : 'Sorting your words'
            : 'Sympnote is reading your words…'}
        </Text>
        <BinGrid bins={bins} structured={structured} filled={filled} />
      </View>

      {/* Absolutely-positioned flying words over the whole scene. */}
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
}

/* -------------------------- Transcript card -------------------------- */

function TranscriptCard({
  transcript,
  sourcePhrases,
  scanning,
  scanPhase,
}: {
  transcript: string;
  sourcePhrases: Record<string, string>;
  scanning: boolean;
  scanPhase: ReturnType<typeof useSharedValue<number>>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  // Tokenize transcript for inline highlighting: split on whitespace but
  // keep delimiters, so we can highlight matched phrases word-by-word.
  const segments = useMemo(() => splitHighlighted(transcript, sourcePhrases), [
    transcript,
    sourcePhrases,
  ]);

  const [height, setHeight] = useState(0);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanPhase.value * Math.max(0, height - 20) }],
    opacity: scanning ? 0.7 : 0,
  }));

  return (
    <View
      style={styles.card}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <Text
        style={[
          typography.bodyLarge,
          {
            color: colors.textPrimary,
            fontSize: fontScale(17),
            lineHeight: fontScale(26),
          },
        ]}
      >
        {segments.map((seg, i) =>
          seg.highlighted ? (
            <Text
              key={i}
              style={{
                backgroundColor: colors.accentLight + '66',
                color: colors.textPrimary,
              }}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          )
        )}
      </Text>

      {/* Scan-line overlay — visible only while reading. */}
      {height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.scanOverlay, scanStyle]}
        >
          <Canvas style={{ width: '100%', height: verticalScale(20) }}>
            <Rect x={0} y={0} width={1000} height={verticalScale(20)}>
              <LinearGradient
                start={vec(0, 10)}
                end={vec(1000, 10)}
                colors={[
                  'rgba(44,110,107,0)',
                  'rgba(44,110,107,0.35)',
                  'rgba(44,110,107,0)',
                ]}
              />
              <BlurMask blur={6} style="normal" />
            </Rect>
          </Canvas>
        </Animated.View>
      )}
    </View>
  );
}

type Segment = { text: string; highlighted: boolean };

function splitHighlighted(
  transcript: string,
  sourcePhrases: Record<string, string>
): Segment[] {
  const phrases = Object.values(sourcePhrases)
    .filter((p) => typeof p === 'string' && p.length > 0)
    .sort((a, b) => b.length - a.length); // longest first
  if (phrases.length === 0) {
    return [{ text: transcript, highlighted: false }];
  }
  const segments: Segment[] = [];
  let cursor = 0;
  while (cursor < transcript.length) {
    let nextIdx = -1;
    let nextPhrase: string | null = null;
    for (const p of phrases) {
      const idx = transcript.indexOf(p, cursor);
      if (idx !== -1 && (nextIdx === -1 || idx < nextIdx)) {
        nextIdx = idx;
        nextPhrase = p;
      }
    }
    if (nextIdx === -1 || !nextPhrase) {
      segments.push({ text: transcript.slice(cursor), highlighted: false });
      break;
    }
    if (nextIdx > cursor) {
      segments.push({
        text: transcript.slice(cursor, nextIdx),
        highlighted: false,
      });
    }
    segments.push({ text: nextPhrase, highlighted: true });
    cursor = nextIdx + nextPhrase.length;
  }
  return segments;
}

/* ------------------------------ Bins ------------------------------ */

function BinGrid({
  bins,
  structured,
  filled,
}: {
  bins: BinLayout[];
  structured: StructuredWithSources | null;
  filled: Record<string, boolean>;
}) {
  const styles = useStyles();
  if (bins.length === 0) {
    // Render static placeholders while layout hasn't been measured yet
    // so the onLayout fires with the correct frame.
    const keys = ['symptoms', 'location', 'duration', 'severity', 'triggers'];
    return (
      <View style={styles.binRow}>
        {keys.map((key) => (
          <BinCell key={key} label={labelFor(key)} />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.binRow}>
      {bins.map((bin) => {
        const isFlag = bin.key === 'redFlags';
        const value = structured
          ? isFlag
            ? structured.redFlags[0] ?? ''
            : fieldValue(structured, bin.key as FieldKey)
          : '';
        return (
          <BinCell
            key={bin.key}
            label={bin.label}
            value={value}
            filled={!!filled[bin.key]}
            tone={isFlag ? 'warn' : 'accent'}
          />
        );
      })}
    </View>
  );
}

function labelFor(key: string): string {
  return FIELDS.find((f) => f.key === key)?.label ?? key;
}

function BinCell({
  label,
  value,
  filled,
  tone = 'accent',
}: {
  label: string;
  value?: string;
  filled?: boolean;
  tone?: 'accent' | 'warn';
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();
  const fill = useSharedValue(0);

  useEffect(() => {
    if (filled) {
      fill.value = reduced
        ? withTiming(1, { duration: 200 })
        : withSequence(
            withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
            withTiming(0.35, { duration: 500, easing: Easing.in(Easing.cubic) })
          );
    }
  }, [filled, fill, reduced]);

  const toneColor = tone === 'warn' ? colors.error : colors.accent;

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.value * 0.85,
  }));

  return (
    <View
      style={[
        styles.bin,
        {
          borderColor: filled ? toneColor + '99' : colors.border,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.binFill,
          { backgroundColor: toneColor + '22' },
          fillStyle,
        ]}
      />
      <Text
        style={[
          typography.label,
          { color: filled ? toneColor : colors.textTertiary, letterSpacing: 0.3 },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          {
            fontFamily: 'Fraunces_500Medium',
            fontSize: fontScale(18),
            lineHeight: fontScale(22),
            color: filled ? colors.textPrimary : colors.textTertiary,
            marginTop: moderateScale(4),
            letterSpacing: -0.2,
          },
        ]}
        numberOfLines={1}
      >
        {filled ? value || '—' : '•'}
      </Text>
    </View>
  );
}

/* ---------------------------- Flight ---------------------------- */

function FlyingWord({
  flight,
  onLand,
}: {
  flight: Flight;
  onLand: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      flight.delay,
      withTiming(
        1,
        {
          duration: reduced ? 260 : 850,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            // worklet callback — schedule JS callback on completion
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onLandWrapper;
          }
        }
      )
    );
    const timeout = setTimeout(onLand, flight.delay + (reduced ? 260 : 820));
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onLandWrapper = onLand; // keeps TS happy on the worklet callback above

  const style = useAnimatedStyle(() => {
    const p = t.value;
    const x = flight.fromX + (flight.toX - flight.fromX) * p;
    const y = flight.fromY + (flight.toY - flight.fromY) * p;
    const arc = reduced ? 0 : -80 * Math.sin(Math.PI * p);
    const scale = reduced
      ? 0.95 + p * 0.05
      : 1 + 0.22 * Math.sin(Math.PI * p);
    const rot = reduced ? 0 : (p - 0.5) * 18;
    const opacity = p < 0.08 ? p / 0.08 : p > 0.94 ? Math.max(0, 1 - (p - 0.94) * 16) : 1;
    return {
      transform: [
        { translateX: x },
        { translateY: y + arc },
        { rotateZ: `${rot}deg` },
        { scale },
      ],
      opacity,
    };
  });

  const toneColor = flight.tone === 'warn' ? colors.error : colors.accent;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: toneColor + '22',
          borderColor: toneColor + '55',
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: scale(10),
          paddingVertical: verticalScale(4),
          borderRadius: 999,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: toneColor,
          fontFamily: 'DMSans_600SemiBold',
          fontSize: fontScale(13),
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {flight.label}
      </Text>
    </Animated.View>
  );
}

/* ---------------------------- styles ---------------------------- */

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  scanOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: verticalScale(20),
  },
  binRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
  bin: {
    width: '48%',
    minHeight: verticalScale(72),
    padding: theme.spacing.s4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.md,
  },
  binFill: {
    borderRadius: theme.radius.md,
  },
}));
