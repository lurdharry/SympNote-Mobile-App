import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme, spacing, typography } from '../../theme';
import { ShimmerText } from '../animated/ShimmerText';
import { FlyingWord } from '../animated/FlyingWord';
import { FieldRow } from './FieldRow';
import { FIELDS, FlightItem, StructuredWithSources, fieldValue } from './types';
import { hapticLight } from '../../services/haptics';

type Props = {
  /**
   * null while Gemini is still working; once populated, the flying-word
   * animation plays and `onDone` fires to advance the phase.
   */
  structured: StructuredWithSources | null;
  onDone: () => void;
};

export function ExtractingPhase({ structured, onDone }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [landed, setLanded] = useState<Record<string, boolean>>({});

  const flights = useMemo<FlightItem[]>(() => {
    if (!structured) return [];
    const list: FlightItem[] = [];
    FIELDS.forEach((f, i) => {
      const wordValue =
        f.key === 'severity'
          ? `${structured.severity}/10`
          : f.key === 'symptoms'
          ? structured.symptoms[0] ?? ''
          : f.key === 'triggers'
          ? structured.triggers[0] ?? ''
          : (structured[f.key] as string) ?? '';
      if (!wordValue) return;
      const fromX = 48 + ((i * 37) % Math.max(60, width - 120));
      const fromY = 260 + (i % 2) * 30;
      const toX = spacing.s6 + 100;
      const toY = 120 + i * 48;
      list.push({
        key: f.key,
        label: wordValue,
        from: { x: fromX, y: fromY },
        to: { x: toX, y: toY },
        delay: i * 180,
        fieldKey: f.key,
      });
    });
    return list;
  }, [structured, width]);

  useEffect(() => {
    if (!structured || flights.length === 0) return;
    const totalMs = 180 * flights.length + 900;
    const id = setTimeout(onDone, totalMs);
    return () => clearTimeout(id);
  }, [structured, flights.length, onDone]);

  return (
    <View style={{ marginTop: spacing.s6 }}>
      {structured ? (
        FIELDS.map((f) => (
          <FieldRow
            key={f.key}
            label={f.label}
            value={fieldValue(structured, f.key)}
            active={landed[f.key]}
          />
        ))
      ) : (
        <View style={{ alignItems: 'center', marginTop: spacing.s6 }}>
          <ShimmerText
            text="Structuring your entry..."
            textStyle={{
              ...typography.bodyLarge,
              color: colors.textSecondary,
            }}
          />
        </View>
      )}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {flights.map((f, i) => (
          <FlyingWord
            key={f.key}
            word={f.label}
            from={f.from}
            to={f.to}
            delay={f.delay}
            duration={900}
            color={colors.accent}
            fontSize={14}
            onLand={() => {
              // Only haptic the first and last landings — five consecutive
              // buzzes in half a second is overwhelming.
              if (i === 0 || i === flights.length - 1) hapticLight();
              setLanded((prev) => ({ ...prev, [f.fieldKey]: true }));
            }}
          />
        ))}
      </View>
    </View>
  );
}
