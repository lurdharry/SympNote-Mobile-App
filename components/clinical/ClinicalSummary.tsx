import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Renders a Gemini-authored clinical summary (markdown-ish) into a
 * scannable set of editorial section cards. Each section has an accent
 * rule that draws in, a serif heading, and richly formatted body.
 *
 * Special-cases:
 * - "Worth flagging" section → red accent + ⚠ list
 * - "Before your visit" section → checklist rendering with hollow circles
 * - Any **bold** prefix on a bullet gets rendered in accent color
 *
 * When `stagger` is true (default), sections animate in sequentially so
 * the user feels the AI "composing" the note. Pass stagger={false} for
 * static rendering (e.g. on the appointment detail screen).
 */

type Section = {
  heading: string;
  body: string;
  variant: 'normal' | 'flag' | 'checklist';
};

type Props = {
  text: string;
  stagger?: boolean;
  initialDelay?: number;
};

function parseSections(text: string): Section[] {
  const parts = text
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((sec) => {
    const [firstLine, ...rest] = sec.split('\n');
    const heading = (firstLine ?? '').replace(/^##\s*/, '').trim();
    const body = rest.join('\n').trim();
    const lower = heading.toLowerCase();
    const variant =
      lower.includes('flag') || lower.includes('worth flagging')
        ? 'flag'
        : lower.startsWith('before')
        ? 'checklist'
        : 'normal';
    return { heading, body, variant };
  });
}

export function ClinicalSummary({
  text,
  stagger = true,
  initialDelay = 0,
}: Props) {
  const sections = useMemo(() => parseSections(text), [text]);

  return (
    <View style={{ gap: spacing.s6 }}>
      {sections.map((section, i) => (
        <SectionCard
          key={`${i}-${section.heading}`}
          section={section}
          index={i}
          delay={stagger ? initialDelay + i * 220 : 0}
        />
      ))}
    </View>
  );
}

function SectionCard({
  section,
  delay,
}: {
  section: Section;
  index: number;
  delay: number;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const ruleWidth = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: reduced ? 200 : 380,
        easing: Easing.out(Easing.cubic),
      })
    );
    ruleWidth.value = withDelay(
      delay,
      withTiming(1, {
        duration: reduced ? 200 : 480,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, opacity, ruleWidth, reduced]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 6 }],
  }));
  const ruleStyle = useAnimatedStyle(() => ({
    width: ruleWidth.value * 28,
  }));

  const accent =
    section.variant === 'flag' ? colors.error : colors.accent;

  return (
    <Animated.View style={cardStyle}>
      <View style={styles.headingRow}>
        <Animated.View
          style={[
            styles.rule,
            { backgroundColor: accent },
            ruleStyle,
          ]}
        />
        <Text
          style={[
            typography.label,
            { color: accent, letterSpacing: 0.3 },
          ]}
        >
          {section.heading}
        </Text>
      </View>

      <View
        style={[
          styles.body,
          {
            backgroundColor: colors.bgSurface,
            borderColor:
              section.variant === 'flag'
                ? colors.error + '55'
                : colors.border,
            borderRadius: radius.lg,
          },
          section.variant === 'flag' ? null : shadows.card,
        ]}
      >
        <SectionBody body={section.body} variant={section.variant} />
      </View>
    </Animated.View>
  );
}

function SectionBody({
  body,
  variant,
}: {
  body: string;
  variant: Section['variant'];
}) {
  const { colors } = useTheme();
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const isBulleted = lines.every((l) => /^[-*⚠]/.test(l));

  if (!isBulleted) {
    // Narrative paragraph
    return (
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, lineHeight: 22 },
        ]}
      >
        {body}
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.s3 }}>
      {lines.map((line, i) => (
        <Bullet
          key={`${i}-${line.slice(0, 10)}`}
          text={line.replace(/^[-*⚠]\s*/, '')}
          variant={variant}
        />
      ))}
    </View>
  );
}

function Bullet({
  text,
  variant,
}: {
  text: string;
  variant: Section['variant'];
}) {
  const { colors } = useTheme();

  // Extract leading **bold:** prefix as the "hook".
  const match = text.match(/^\*\*(.+?):\*\*\s*(.*)$/);
  const hook = match?.[1] ?? null;
  const rest = match?.[2] ?? text;
  const cleanRest = rest.replace(/\*\*(.+?)\*\*/g, '$1');

  const marker =
    variant === 'flag' ? '⚠' : variant === 'checklist' ? '○' : '•';
  const markerColor =
    variant === 'flag'
      ? colors.error
      : variant === 'checklist'
      ? colors.accent
      : colors.accent;

  return (
    <View style={styles.bulletRow}>
      <Text
        style={{
          color: markerColor,
          fontSize: variant === 'checklist' ? 16 : 14,
          marginRight: spacing.s3,
          marginTop: variant === 'checklist' ? 0 : 2,
          width: 14,
        }}
      >
        {marker}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, flex: 1, lineHeight: 22 },
        ]}
      >
        {hook && (
          <Text
            style={{
              color: variant === 'flag' ? colors.error : colors.textPrimary,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            {hook}:{' '}
          </Text>
        )}
        {cleanRest}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    marginBottom: spacing.s3,
  },
  rule: {
    height: 2,
    borderRadius: 1,
  },
  body: {
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
