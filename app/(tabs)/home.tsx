import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticLight } from '../../services/haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { StaggeredList } from '../../components/animated/StaggeredList';
import { RecordButton } from '../../components/RecordButton';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { formatDate, formatRelative, formatDuration } from '../../utils/date';
import { useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  // Subscribe to raw state slices (stable refs), derive with useMemo.
  // Selectors that return new arrays/objects each call (slice, sort, filter)
  // trip React 19's useSyncExternalStore infinite-loop guard.
  const appointments = useAppointmentsStore((s) => s.appointments);
  const recordings = useRecordingsStore((s) => s.recordings);
  const next = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => new Date(a.date).getTime() >= now)
      .sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())[0];
  }, [appointments]);
  const recents = useMemo(() => recordings.slice(0, 3), [recordings]);

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={[typography.label, { color: colors.textTertiary }]}>
              Today
            </Text>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/settings');
              }}
              hitSlop={12}
              style={[
                styles.settingsBtn,
                { borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 18,
                  lineHeight: 18,
                }}
              >
                ⋯
              </Text>
            </Pressable>
          </View>

          <NextAppointmentCard
            onPress={() => router.push('/(tabs)/prep')}
            appointment={next}
          />

          <View style={{ marginTop: spacing.s10, alignItems: 'center' }}>
            <Text
              style={[
                typography.h2,
                { color: colors.textPrimary, marginBottom: spacing.s5 },
              ]}
            >
              Log something
            </Text>
            <RecordButton />
          </View>

          <View style={{ marginTop: spacing.s10 }}>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginBottom: spacing.s3 },
              ]}
            >
              Today's entries
            </Text>
            {recents.length === 0 ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textTertiary },
                ]}
              >
                Your first recordings will show up here.
              </Text>
            ) : (
              <StaggeredList stagger={80} initialDelay={100}>
                {recents.map((r) => (
                  <RecentRow
                    key={r.id}
                    onPress={() => router.push(`/recording/${r.id}`)}
                    title={r.structured.symptoms[0] ?? 'Entry'}
                    meta={`${formatRelative(r.createdAt)} · ${formatDuration(r.durationSec)}`}
                    note={r.structured.notes || r.transcript.slice(0, 100)}
                  />
                ))}
              </StaggeredList>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function NextAppointmentCard({
  onPress,
  appointment,
}: {
  onPress: () => void;
  appointment: ReturnType<typeof useAppointmentsStore.getState>['appointments'][number] | undefined;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    y.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [y, reduced]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ marginTop: spacing.s2 }, s]}>
      <Animated.View
        style={[
          styles.nextCard,
          shadows.card,
          {
            backgroundColor: colors.bgSurface,
            borderRadius: radius.lg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[typography.label, { color: colors.accent }]}>
          Next appointment
        </Text>
        {appointment ? (
          <>
            <Text
              style={[
                typography.h2,
                { color: colors.textPrimary, marginTop: 6 },
              ]}
              onPress={onPress}
            >
              {appointment.doctorName}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
              {appointment.specialty} · {formatDate(appointment.date)}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.accent, marginTop: spacing.s3 },
              ]}
              onPress={onPress}
            >
              Prep →
            </Text>
          </>
        ) : (
          <>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginTop: 6 },
              ]}
            >
              No appointment scheduled
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
              onPress={onPress}
            >
              Add one in Prep →
            </Text>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function RecentRow({
  title,
  meta,
  note,
  onPress,
}: {
  title: string;
  meta: string;
  note: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
        shadows.card,
      ]}
      onTouchEnd={onPress}
    >
      <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textTertiary, marginTop: 2 },
        ]}
      >
        {meta}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.s2 },
        ]}
      >
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCard: {
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    padding: spacing.s5,
    marginBottom: spacing.s3,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
