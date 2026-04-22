import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { makeStyles, spacing, useTheme } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Teaser view of a clinical summary for the paywall. Shows the Chief
 * concern + a stats strip derived from the markdown sections.
 */

type TeaserData = {
  chiefConcern: string | null;
  patterns: number;
  flagged: number;
  questions: number;
  preVisitItems: number;
};

function parseTeaser(text: string): TeaserData {
  const sections = text
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  let chiefConcern: string | null = null;
  let patterns = 0;
  let flagged = 0;
  let questions = 0;
  let preVisitItems = 0;

  for (const sec of sections) {
    const [firstLine, ...rest] = sec.split('\n');
    const heading = (firstLine ?? '').replace(/^##\s*/, '').toLowerCase();
    const body = rest.join('\n').trim();
    const bulletCount = body
      .split('\n')
      .filter((l) => /^[-*⚠]/.test(l.trim())).length;

    if (heading.includes('chief')) {
      const sentence = body.split(/(?<=[.!?])\s/)[0] ?? body;
      chiefConcern = sentence.trim();
    } else if (heading.includes('pattern')) {
      patterns = bulletCount;
    } else if (heading.includes('flag')) {
      flagged = bulletCount;
    } else if (heading.includes('question')) {
      questions = bulletCount;
    } else if (heading.includes('before')) {
      preVisitItems = bulletCount;
    }
  }

  return { chiefConcern, patterns, flagged, questions, preVisitItems };
}

type Props = {
  text: string | null;
};

export function ClinicalSummaryTeaser({ text }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  const data = useMemo<TeaserData | null>(
    () => (text ? parseTeaser(text) : null),
    [text]
  );

  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(
      200,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      200,
      reduced
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 18, stiffness: 120 })
    );
  }, [opacity, ty, reduced]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  if (!data) {
    return (
      <Animated.View style={[{ marginTop: spacing.s4 }, anim]}>
        <View style={styles.card}>
          <Text style={styles.loading}>
            Your first summary is being prepared from your recording…
          </Text>
        </View>
      </Animated.View>
    );
  }

  const stats = [
    { label: 'patterns', value: data.patterns },
    { label: 'flagged', value: data.flagged, tone: 'warn' as const },
    { label: 'questions', value: data.questions },
  ].filter((s) => s.value > 0);

  return (
    <Animated.View style={[{ marginTop: spacing.s4 }, anim]}>
      <View style={styles.card}>
        <Text style={styles.chiefLabel}>Chief concern</Text>
        <Text style={styles.chiefBody}>
          {data.chiefConcern ?? 'Entry logged.'}
        </Text>

        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                <View style={styles.stat}>
                  <Text
                    style={[
                      styles.statNumber,
                      {
                        color:
                          s.tone === 'warn'
                            ? colors.error
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < stats.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.footer}>
        Subscribe to unlock your full doctor-ready summary — and every one after.
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  loading: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  chiefLabel: {
    ...theme.typography.label,
    color: theme.colors.accent,
    letterSpacing: 0.3,
  },
  chiefBody: {
    ...theme.typography.serifHeadline,
    color: theme.colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s4,
    paddingTop: theme.spacing.s4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontFamily: 'Fraunces_300Light',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.border,
  },
  footer: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.s3,
    textAlign: 'center',
  },
}));
