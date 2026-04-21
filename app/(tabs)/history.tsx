import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { StaggeredList } from '../../components/animated/StaggeredList';
import { SharedElementCard } from '../../components/navigation/SharedElementCard';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { formatRelative, formatDuration } from '../../utils/date';
import { hapticMedium } from '../../services/haptics';
import { Recording } from '../../stores/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function History() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();
  const recordings = useRecordingsStore((s) => s.recordings);
  const remove = useRecordingsStore((s) => s.remove);

  const filtered = useMemo(() => {
    if (!query.trim()) return recordings;
    const q = query.toLowerCase();
    return recordings.filter(
      (r) =>
        r.transcript.toLowerCase().includes(q) ||
        r.structured.symptoms.some((s) => s.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, recordings]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const searchWidth = useSharedValue(1);
  React.useEffect(() => {
    searchWidth.value = withSpring(focused ? 1 : 0.95, {
      damping: 18,
      stiffness: 140,
    });
  }, [focused, searchWidth]);

  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: searchWidth.value }],
    transformOrigin: 'left' as any,
  }));

  const parallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: reduced
          ? 0
          : interpolate(
              scrollY.value,
              [0, 300],
              [0, -40],
              Extrapolation.CLAMP
            ),
      },
    ],
    opacity: reduced
      ? 1
      : interpolate(scrollY.value, [0, 200], [1, 0.7], Extrapolation.CLAMP),
  }));

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ paddingHorizontal: spacing.s6, paddingTop: spacing.s4 }}>
          <Animated.Text
            style={[typography.h1, { color: colors.textPrimary }, parallax]}
          >
            History
          </Animated.Text>
          <Animated.View
            style={[
              styles.search,
              {
                backgroundColor: colors.bgSurface,
                borderColor: focused ? colors.accent : colors.border,
                borderRadius: radius.md,
              },
              searchStyle,
            ]}
          >
            <RNTextInput
              placeholder="Search symptoms, tags…"
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[
                typography.body,
                { color: colors.textPrimary, padding: spacing.s3 },
              ]}
            />
          </Animated.View>
        </View>

        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text
              style={[
                typography.body,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.s12,
                },
              ]}
            >
              {query ? 'No matches.' : 'Your recordings will appear here.'}
            </Text>
          ) : (
            <StaggeredList stagger={60}>
              {filtered.map((r) => (
                <HistoryRow
                  key={r.id}
                  recording={r}
                  onPress={() => {
                    hapticMedium();
                    router.push(`/recording/${r.id}`);
                  }}
                  onLongPress={() => {
                    Alert.alert('Delete recording?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => remove(r.id),
                      },
                    ]);
                  }}
                />
              ))}
            </StaggeredList>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function HistoryRow({
  recording,
  onPress,
  onLongPress,
}: {
  recording: Recording;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.s3 }}>
      <SharedElementCard onPress={onPress}>
        <Pressable onLongPress={onLongPress} delayLongPress={500}>
          <View
            style={[
              styles.row,
              shadows.card,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {formatRelative(recording.createdAt)}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {formatDuration(recording.durationSec)}
              </Text>
            </View>
            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginTop: 4 },
              ]}
              numberOfLines={1}
            >
              {recording.structured.symptoms[0] ?? 'Entry'}
            </Text>
            <Text
              style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}
              numberOfLines={2}
            >
              {recording.structured.notes || recording.transcript}
            </Text>
            {recording.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.s3, gap: 6 }}>
                {recording.tags.map((t) => (
                  <View
                    key={t}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.bgMuted,
                        borderRadius: radius.sm,
                      },
                    ]}
                  >
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </SharedElementCard>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s12,
  },
  search: {
    marginTop: spacing.s3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
  },
});
