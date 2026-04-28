import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fontScale, makeStyles, spacing, typography, useTheme } from "@/theme";
import { SceneTransition } from "@/components/navigation/SceneTransition";
import { useHistoryData, type FeedDateRange, type FeedFilter } from "@/hooks/useHistoryData";
import { SearchBar } from "@/components/history/SearchBar";
import { HistoryGroupCard } from "@/components/history/HistoryGroupCard";
import { FeedFilterChips } from "@/components/history/FeedFilterChips";
import { DateRangePill } from "@/components/history/DateRangePill";
import { NoMatches } from "@/components/history/NoMatches";
import { HistoryEmpty } from "@/components/empty/HistoryEmpty";

/**
 * History tab — a unified chronological activity feed of notes
 * (recordings) and briefs interleaved. Tells the user the story of
 * their tracking instead of presenting two parallel lists. Filter
 * chips at the top scope the feed; search runs across both row types.
 */
const TabHistory: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [dateRange, setDateRange] = useState<FeedDateRange>("all");

  const { filtered, groups, notesCount, briefsCount, isEmpty } = useHistoryData(
    query,
    filter,
    dateRange,
  );

  // One-line summary surfacing the two facts that matter at a glance:
  // how many of each artifact the user has built. Falls back to a
  // single-count line when only one kind exists.
  const summary = useMemo(() => {
    if (isEmpty) return "";
    const noteWord = `${notesCount} ${notesCount === 1 ? "note" : "notes"}`;
    const briefWord = `${briefsCount} ${briefsCount === 1 ? "brief" : "briefs"}`;
    if (notesCount === 0) return briefWord;
    if (briefsCount === 0) return noteWord;
    return `${noteWord} · ${briefWord}`;
  }, [notesCount, briefsCount, isEmpty]);

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR JOURNEY</Text>
            <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}>
              History
            </Text>
            {!isEmpty && summary ? (
              <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text>
            ) : null}
          </View>

          {isEmpty ? (
            <HistoryEmpty />
          ) : (
            <>
              <View style={styles.searchRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <SearchBar value={query} onChangeText={setQuery} />
                </View>
                <DateRangePill range={dateRange} onChange={setDateRange} />
              </View>

              <FeedFilterChips
                filter={filter}
                onChange={setFilter}
                notesCount={notesCount}
                briefsCount={briefsCount}
              />

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
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
  },
  summary: {
    ...theme.typography.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    paddingHorizontal: spacing.s6,
    paddingBottom: 8,
  },
  scroll: {
    paddingTop: 4,
    paddingBottom: 120,
  },
}));
