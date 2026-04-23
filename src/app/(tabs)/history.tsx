import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, spacing, typography, useTheme } from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { useHistoryData } from '@/hooks/useHistoryData';
import { SearchBar } from '@/components/history/SearchBar';
import { TagFilterStrip } from '@/components/history/TagFilterStrip';
import { HistoryGroupCard } from '@/components/history/HistoryGroupCard';
import { NoMatches } from '@/components/history/NoMatches';
import { HistoryEmpty } from '@/components/empty/HistoryEmpty';

const TabHistory: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string[]>([]);

  const { filtered, allTags, groups, isEmpty } = useHistoryData(query, active);

  const toggleTag = (tag: string) =>
    setActive((a) => (a.includes(tag) ? a.filter((x) => x !== tag) : [...a, tag]));

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>History</Text>
            {!isEmpty && (
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
              </Text>
            )}
          </View>

          {isEmpty ? (
            <HistoryEmpty />
          ) : (
            <>
              <View style={styles.searchSlot}>
                <SearchBar value={query} onChangeText={setQuery} />
              </View>

              <View style={styles.tagSlot}>
                <TagFilterStrip
                  tags={allTags}
                  active={active}
                  onToggle={toggleTag}
                  onClear={() => setActive([])}
                />
              </View>

              <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
              >
                {groups.map((group) => (
                  <HistoryGroupCard key={group.date} group={group} />
                ))}
                {filtered.length === 0 && <NoMatches />}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default TabHistory;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: 8,
  },
  tagSlot: {
    paddingBottom: 10,
  },
  scroll: {
    paddingBottom: 120,
  },
}));
