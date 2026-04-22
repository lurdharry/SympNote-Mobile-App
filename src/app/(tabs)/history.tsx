import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Search, X as XIcon } from 'lucide-react-native';
import { makeStyles, shadows, spacing, typography, useTheme } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { TagChip } from '../../components/ui/TagChip';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { formatDuration } from '../../utils/date';
import { hapticLight } from '../../services/haptics';
import { TAG_PALETTE } from '../../constants/palette';
import {
  DEMO_ALL_TAGS,
  DEMO_HISTORY_ITEMS as DEMO_ITEMS,
  HistoryItem,
} from '../../constants/demo/history';

/**
 * History — per design handoff.
 *
 *  - Header with entry count
 *  - Search input with clear-X
 *  - Horizontal scroll of tag filter pills, tinted by tag color
 *  - Date-grouped cards (Today, Yesterday, Nov 20, etc.)
 *  - Each row: Mic icon + time + duration + tag chips + body text
 */


/**
 * Palette for auto-assigned tag colors. Any tag the user has on a
 * recording gets mapped to a deterministic color via a stable hash of
 * its name, so "fatigue" always reads the same across app sessions.
 */

function colorForTag(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]!;
}

export default function TabHistory() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<string[]>([]);

  const storeRecordings = useRecordingsStore((s) => s.recordings);

  // Real entries always take priority; fall back to demo data while empty
  // so the layout is review-ready during prototyping.
  const items = useMemo<HistoryItem[]>(() => {
    if (storeRecordings.length === 0) return DEMO_ITEMS;
    return storeRecordings.map((r) => {
      const d = new Date(r.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
      const dateLabel = sameDay(d, today)
        ? 'Today'
        : sameDay(d, yesterday)
        ? 'Yesterday'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: r.id,
        date: dateLabel,
        time: d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        dur: formatDuration(r.durationSec),
        text: r.transcript,
        tags: r.tags.slice(0, 3).map((t) => ({ t, c: colorForTag(t) })),
      };
    });
  }, [storeRecordings]);

  const filtered = useMemo(
    () =>
      items.filter((it) => {
        const matchesQ =
          !q ||
          (it.text + ' ' + it.tags.map((x) => x.t).join(' '))
            .toLowerCase()
            .includes(q.toLowerCase());
        const matchesT =
          active.length === 0 ||
          it.tags.some((tg) => active.includes(tg.t));
        return matchesQ && matchesT;
      }),
    [items, q, active]
  );

  /**
   * Live filter pills — derived from every tag seen in the recordings
   * store (sorted by frequency, deduped, color assigned via stable
   * hash). Falls back to the demo palette only when the store is
   * empty, so the strip never looks dead on a fresh install.
   */
  const allTags = useMemo(() => {
    if (storeRecordings.length === 0) return DEMO_ALL_TAGS;
    const counts = new Map<string, number>();
    storeRecordings.forEach((r) =>
      r.tags.forEach((raw) => {
        const t = raw.trim().toLowerCase();
        if (!t) return;
        counts.set(t, (counts.get(t) ?? 0) + 1);
      })
    );
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([t]) => ({ t, c: colorForTag(t) }));
  }, [storeRecordings]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    filtered.forEach((it) => {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggleTag = (t: string) => {
    hapticLight();
    setActive((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));
  };

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>
              History
            </Text>
            <Text
              style={[typography.label, { color: colors.textTertiary }]}
            >
              {filtered.length} entries
            </Text>
          </View>

          {/* Search */}
          <View style={{ paddingHorizontal: spacing.s6, paddingBottom: 8 }}>
            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                },
                shadows.card,
              ]}
            >
              <Search size={16} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search notes…"
                placeholderTextColor={colors.textTertiary}
                style={[
                  typography.body,
                  { flex: 1, color: colors.textPrimary },
                ]}
              />
              {!!q && (
                <Pressable onPress={() => setQ('')} hitSlop={8}>
                  <XIcon
                    size={14}
                    color={colors.textTertiary}
                    strokeWidth={2}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Tag filter pills */}
          <View style={{ paddingBottom: 10 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {active.length > 0 && (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setActive([]);
                  }}
                  style={[
                    styles.clearPill,
                    { backgroundColor: colors.textPrimary },
                  ]}
                >
                  <XIcon size={10} color="#FFFFFF" strokeWidth={2.5} />
                  <Text
                    style={[
                      typography.label,
                      {
                        color: '#FFFFFF',
                        fontFamily: 'Inter_600SemiBold',
                      },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              )}
              {allTags.map((tg) => {
                const isActive = active.includes(tg.t);
                return (
                  <Pressable
                    key={tg.t}
                    onPress={() => toggleTag(tg.t)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isActive ? tg.c : tg.c + '20',
                        borderColor: isActive ? tg.c : tg.c + '55',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.label,
                        {
                          color: isActive ? '#FFFFFF' : tg.c,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      #{tg.t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {groups.map(([date, arr]) => (
              <View key={date} style={{ marginBottom: 8 }}>
                <View style={styles.groupHeader}>
                  <Text
                    style={[
                      typography.label,
                      {
                        color: colors.textTertiary,
                        fontFamily: 'Inter_600SemiBold',
                        letterSpacing: 1,
                      },
                    ]}
                  >
                    {date.toUpperCase()}
                  </Text>
                  <Text
                    style={[typography.label, { color: colors.textTertiary }]}
                  >
                    {arr.length}
                  </Text>
                </View>
                <View
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: colors.bgSurface,
                      borderColor: colors.border,
                    },
                    shadows.card,
                  ]}
                >
                  {arr.map((it, i) => (
                    <View
                      key={it.id}
                      style={[
                        styles.entryRow,
                        i > 0 && {
                          borderTopColor: colors.border,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <View style={styles.entryMeta}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Mic
                            size={10}
                            color={colors.textTertiary}
                            strokeWidth={2}
                          />
                          <Text
                            style={[
                              typography.label,
                              { color: colors.textTertiary },
                            ]}
                          >
                            {it.time}
                          </Text>
                          <Text
                            style={[
                              typography.label,
                              { color: colors.textTertiary },
                            ]}
                          >
                            ·
                          </Text>
                          <Text
                            style={[
                              typography.label,
                              { color: colors.textTertiary },
                            ]}
                          >
                            {it.dur}
                          </Text>
                        </View>
                        <View
                          style={{ flexDirection: 'row', gap: 4 }}
                        >
                          {it.tags.map((tg) => (
                            <TagChip key={tg.t} label={tg.t} color={tg.c} />
                          ))}
                        </View>
                      </View>
                      <Text
                        style={[
                          typography.body,
                          {
                            color: colors.textPrimary,
                            marginTop: 6,
                            lineHeight: 20,
                          },
                        ]}
                      >
                        {it.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {filtered.length === 0 && (
              <View style={{ paddingHorizontal: spacing.s6, paddingTop: spacing.s10, alignItems: 'center' }}>
                <View
                  style={[
                    styles.noMatchIcon,
                    { backgroundColor: colors.bgMuted },
                  ]}
                >
                  <Search
                    size={22}
                    color={colors.textTertiary}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  style={[
                    typography.body,
                    {
                      color: colors.textPrimary,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
                  No matches
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 2 },
                  ]}
                >
                  Try a different tag or search term
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchRow: {
    height: 44,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: 4,
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupHeader: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCard: {
    marginHorizontal: theme.spacing.s6,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  entryRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noMatchIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
}));
