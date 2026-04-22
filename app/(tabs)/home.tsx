import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  BadgeAlert,
  ChevronRight,
  Minus,
  Mic,
  Pill,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { TagChip } from '../../components/ui/TagChip';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import {
  daysUntil,
  formatDate,
  formatTime,
  timeGreeting,
} from '../../utils/date';
import { hapticHeavy, hapticLight } from '../../services/haptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { topTrendingSymptom } from '../../utils/insights';

/**
 * Home — daily surface (per design handoff).
 *
 *  - Header: date eyebrow + serif "Good morning" + gradient avatar that
 *    opens the Settings modal
 *  - Hero "Up-next appointment" gradient card (tappable → Prep)
 *  - Quick-log row: Medication / Symptom / Side effect tiles
 *  - Today entries: timeline card with left time column + connected dot
 *  - Insight nudge (→ Insights)
 *  - Pinned record FAB at bottom
 *
 * When the user has no real data, we render demo entries/appointment so
 * the layout always looks populated (the design handoff mocks).
 */

type QuickIconRef = typeof Pill;
const DEMO_QUICK: Array<{
  Icon: QuickIconRef;
  t: string;
  c: string;
  kind: string;
}> = [
  { Icon: Pill,       t: 'Medication',  c: '#5A8F6E', kind: 'medication' },
  { Icon: Activity,   t: 'Symptom',     c: '#E07A5F', kind: 'symptom' },
  { Icon: BadgeAlert, t: 'Side effect', c: '#F6C06A', kind: 'side-effect' },
];

type DemoEntry = {
  time: string;
  period: 'AM' | 'PM';
  text: string;
  tags: { t: string; c: string }[];
  dur?: string;
  kind: 'voice' | 'med';
};

const DEMO_TODAY: DemoEntry[] = [
  {
    time: '10:42',
    period: 'AM',
    text: 'Morning knee pain, 6/10, worse climbing stairs.',
    tags: [{ t: 'knee', c: '#E07A5F' }],
    dur: '1:24',
    kind: 'voice',
  },
  {
    time: '08:15',
    period: 'AM',
    text:
      'Fatigue returning — slept ~6h, groggy through breakfast.',
    tags: [
      { t: 'fatigue', c: '#F6C06A' },
      { t: 'sleep', c: '#5A8F6E' },
    ],
    dur: '0:48',
    kind: 'voice',
  },
  {
    time: '07:30',
    period: 'AM',
    text: 'Methotrexate 15mg + folic acid.',
    tags: [{ t: 'meds', c: '#5A8F6E' }],
    kind: 'med',
  },
];

export default function TabHome() {
  const router = useRouter();
  const { colors } = useTheme();

  const appointments = useAppointmentsStore((s) => s.appointments);
  const recordings = useRecordingsStore((s) => s.recordings);

  const next = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.date).getTime() >= now)
      .sort(
        (x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()
      )[0];
  }, [appointments]);

  const todayEntries = useMemo<DemoEntry[]>(() => {
    if (recordings.length === 0) return DEMO_TODAY;
    const now = new Date();
    const todays = recordings.filter((r) => {
      const d = new Date(r.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    if (todays.length === 0) return DEMO_TODAY;
    return todays.slice(0, 5).map<DemoEntry>((r) => {
      const d = new Date(r.createdAt);
      const h = d.getHours();
      const hour12 = ((h + 11) % 12) + 1;
      return {
        time: `${hour12.toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        period: h >= 12 ? 'PM' : 'AM',
        text: r.transcript.slice(0, 110),
        tags: r.tags.slice(0, 2).map((t) => ({ t, c: '#2C6E6B' })),
        dur: `${Math.floor(r.durationSec / 60)}:${(r.durationSec % 60)
          .toString()
          .padStart(2, '0')}`,
        kind: 'voice',
      };
    });
  }, [recordings]);

  const dateEyebrow = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const greeting = timeGreeting().replace('.', ''); // "Good morning"

  /**
   * Real insight — only shown when we have enough data to say something
   * truthful. Otherwise the card is hidden entirely rather than faking
   * a pattern.
   */
  const nudge = useMemo(() => {
    if (recordings.length < 3) return null;
    return topTrendingSymptom(recordings, '30d');
  }, [recordings]);

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[typography.label, { color: colors.textTertiary }]}
              >
                {dateEyebrow}
              </Text>
              <Text
                style={[
                  typography.h1,
                  { color: colors.textPrimary, marginTop: 2 },
                ]}
                numberOfLines={1}
              >
                {greeting}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/settings');
              }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.avatar}
            >
              <LinearGradient
                colors={['#2C6E6B', '#1F504E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.avatarLetter}>Y</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.s6,
              paddingBottom: 160,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Up-next appointment */}
            <UpNextCard
              appointment={next}
              onPress={() => router.push('/(tabs)/prep')}
            />

            {/* Quick log */}
            <View style={{ marginTop: spacing.s4 }}>
              <SectionLabel label="Quick log" />
              <View style={styles.quickRow}>
                {DEMO_QUICK.map((q) => (
                  <Pressable
                    key={q.t}
                    onPress={() => {
                      hapticLight();
                      router.push({
                        pathname: '/record',
                        params: { kind: q.kind },
                      });
                    }}
                    style={[
                      styles.quickTile,
                      {
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                      },
                      shadows.card,
                    ]}
                  >
                    <View
                      style={[
                        styles.quickIcon,
                        { backgroundColor: q.c + '22' },
                      ]}
                    >
                      <q.Icon size={18} color={q.c} strokeWidth={2} />
                    </View>
                    <Text
                      style={[
                        typography.label,
                        {
                          color: colors.textPrimary,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      {q.t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Today entries */}
            <View style={{ marginTop: spacing.s5 }}>
              <View style={styles.sectionRow}>
                <SectionLabel label="Today" />
                <Text style={[typography.label, { color: colors.textTertiary }]}>
                  {todayEntries.length} entries
                </Text>
              </View>
              <View
                style={[
                  styles.timelineCard,
                  {
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                  },
                  shadows.card,
                ]}
              >
                {todayEntries.map((e, i) => (
                  <TimelineRow
                    key={i}
                    entry={e}
                    isFirst={i === 0}
                    dotColor={e.kind === 'med' ? '#5A8F6E' : colors.accent}
                  />
                ))}
              </View>
            </View>

            {/* Insight nudge — only when we have something true to say */}
            {nudge && (
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/(tabs)/insights');
              }}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                  marginTop: spacing.s4,
                },
                shadows.card,
              ]}
            >
              <View
                style={[
                  styles.insightIcon,
                  {
                    backgroundColor:
                      nudge.trend === 'up'
                        ? colors.coral + '22'
                        : nudge.trend === 'down'
                        ? colors.success + '22'
                        : colors.accent + '22',
                  },
                ]}
              >
                {nudge.trend === 'up' ? (
                  <TrendingUp size={16} color={colors.coral} strokeWidth={2} />
                ) : nudge.trend === 'down' ? (
                  <TrendingDown size={16} color={colors.success} strokeWidth={2} />
                ) : (
                  <Minus size={16} color={colors.accent} strokeWidth={2} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.textPrimary,
                      fontFamily: 'Inter_500Medium',
                    },
                  ]}
                >
                  {nudge.name} logged {nudge.count}×{' '}
                  {nudge.trend === 'up'
                    ? '— trending up'
                    : nudge.trend === 'down'
                    ? '— easing off'
                    : 'this month'}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 2 },
                  ]}
                >
                  See pattern in Insights
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.s5,
                  paddingHorizontal: spacing.s6,
                },
              ]}
            >
              Logging little and often makes your prep summaries sharper.
            </Text>
          </ScrollView>

          {/* Pinned record FAB */}
          <RecordFAB
            onPress={() => {
              hapticHeavy();
              router.push('/record');
            }}
          />
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

/* -------------------- Up-next card -------------------- */

function UpNextCard({
  appointment,
  onPress,
}: {
  appointment:
    | ReturnType<typeof useAppointmentsStore.getState>['appointments'][number]
    | undefined;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 12 }],
  }));

  const doctor = appointment?.doctorName ?? 'Dr. Chen';
  const specialty = appointment?.specialty ?? 'Rheumatology';
  const when = appointment
    ? `${formatDate(appointment.date)}`
    : 'Fri Nov 28';
  const timeLabel = appointment
    ? `${formatTime(appointment.date)} · in ${Math.max(
        0,
        daysUntil(appointment.date)
      )}d`
    : '2:00 PM · in 7d';

  return (
    <Animated.View style={[{ marginTop: spacing.s3 }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button">
        <View style={[styles.upNextCard, shadows.elevated]}>
          <LinearGradient
            colors={['#2C6E6B', '#1F504E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(246,192,106,0.1)',
            }}
          />
          <Text
            style={[
              typography.caption,
              {
                color: 'rgba(246,192,106,0.9)',
                letterSpacing: 1.4,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            NEXT VISIT
          </Text>
          <Text
            style={[
              typography.h1,
              { color: '#FFFFFF', marginTop: 4 },
            ]}
          >
            {doctor}
          </Text>
          <Text
            style={[
              typography.body,
              { color: 'rgba(255,255,255,0.75)', marginTop: 2 },
            ]}
          >
            {specialty}
          </Text>
          <View style={styles.upNextFoot}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {when}
              </Text>
              <Text
                style={[
                  typography.h3,
                  {
                    color: '#FFFFFF',
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                {timeLabel}
              </Text>
            </View>
            <View style={styles.prepReady}>
              <Sparkles size={12} color="#F6C06A" strokeWidth={2} />
              <Text
                style={[
                  typography.label,
                  {
                    color: '#FFFFFF',
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                Prep ready
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* -------------------- Timeline row -------------------- */

function TimelineRow({
  entry,
  isFirst,
  dotColor,
}: {
  entry: DemoEntry;
  isFirst: boolean;
  dotColor: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.timelineRow,
        !isFirst && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.timeCol}>
        <Text
          style={[
            typography.body,
            {
              color: colors.textPrimary,
              fontFamily: 'Inter_600SemiBold',
              fontVariant: ['tabular-nums'],
              lineHeight: 18,
            },
          ]}
        >
          {entry.time}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {entry.period}
        </Text>
      </View>
      <View style={[styles.timelineRail, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: dotColor,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <View style={styles.timelineMeta}>
          {entry.kind === 'voice' ? (
            <View style={styles.metaInline}>
              <Mic size={10} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {entry.dur}
              </Text>
            </View>
          ) : (
            <View style={styles.metaInline}>
              <Pill size={10} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                Medication
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 4, marginLeft: 'auto' }}>
            {entry.tags.map((tg) => (
              <TagChip key={tg.t} label={tg.t} color={tg.c} />
            ))}
          </View>
        </View>
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, marginTop: 4, lineHeight: 20 },
          ]}
        >
          {entry.text}
        </Text>
      </View>
    </View>
  );
}

/* -------------------- Record FAB -------------------- */

function RecordFAB({ onPress }: { onPress: () => void }) {
  const reduced = useReducedMotion();
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const loop = (sv: typeof pulse1, delay: number) => {
      sv.value = withTiming(0, { duration: 0 });
      setTimeout(() => {
        sv.value = withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          -1,
          false
        );
      }, delay);
    };
    loop(pulse1, 0);
    loop(pulse2, 900);
  }, [reduced, pulse1, pulse2]);

  const ring = (sv: typeof pulse1, color: string) =>
    useAnimatedStyle(() => ({
      opacity: 0.45 * (1 - sv.value),
      transform: [{ scale: 1 + sv.value * 0.5 }],
      backgroundColor: color,
    }));

  const ring1Style = ring(pulse1, 'rgba(44,110,107,0.22)');
  const ring2Style = ring(pulse2, 'rgba(246,192,106,0.24)');

  return (
    <View pointerEvents="box-none" style={styles.fabWrap}>
      <View style={styles.fabInner} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[styles.fabRing, ring1Style]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.fabRing, ring2Style]}
        />
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Start voice log"
          style={styles.fab}
        >
          <LinearGradient
            colors={['#4DB8B0', '#2C6E6B']}
            start={{ x: 0.3, y: 0.3 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Mic size={28} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------- Shared bits -------------------- */

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.label,
        {
          color: colors.textTertiary,
          fontFamily: 'Inter_600SemiBold',
          letterSpacing: 1.1,
          marginBottom: 8,
        },
      ]}
    >
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.s3,
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  upNextCard: {
    borderRadius: radius.lg,
    padding: 20,
    overflow: 'hidden',
  },
  upNextFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.s4,
    gap: 12,
  },
  prepReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTile: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeCol: {
    width: 46,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  timelineRail: {
    width: 1,
    alignSelf: 'stretch',
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -3.5,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 3,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabInner: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#2C6E6B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },
});
