import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fontScale,
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { hapticHeavy, hapticLight } from '@/services/haptics';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { UpNextCard } from '@/components/home/UpNextCard';
import { QuickLogRow } from '@/components/home/QuickLogRow';
import { TimelineCard } from '@/components/home/TimelineCard';
import { TodayEmpty } from '@/components/home/TodayEmpty';
import { InsightNudge } from '@/components/home/InsightNudge';
import { FirstEntryHero } from '@/components/home/FirstEntryHero';
import { PostVisitPrompt } from '@/components/home/PostVisitPrompt';
import { RecordFAB } from '@/components/home/RecordFAB';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';

const TabHome: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const {
    nextAppointment,
    todayEntries,
    nudge,
    dateEyebrow,
    greeting,
    recordingsCount,
    firstRecording,
    unresolvedVisit,
  } = useHomeDashboard();

  const markAttended = useAppointmentsStore((s) => s.markAttended);
  const markMissed = useAppointmentsStore((s) => s.markMissed);
  const markCancelled = useAppointmentsStore((s) => s.markCancelled);

  const firstEntryHeroDismissed = useProfileStore(
    (s) => s.firstEntryHeroDismissed,
  );
  const dismissFirstEntryHero = useProfileStore(
    (s) => s.dismissFirstEntryHero,
  );
  const showFirstEntryHero =
    recordingsCount === 1 &&
    !!firstRecording &&
    !firstEntryHeroDismissed;

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                {dateEyebrow}
              </Text>
              <Text
                style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}
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
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {unresolvedVisit && (
              <View style={{ marginBottom: spacing.s4 }}>
                <PostVisitPrompt
                  appointment={unresolvedVisit}
                  onAttended={() => markAttended(unresolvedVisit.id)}
                  onMissed={() => markMissed(unresolvedVisit.id)}
                  onCancelled={() => markCancelled(unresolvedVisit.id)}
                />
              </View>
            )}

            {showFirstEntryHero && firstRecording && (
              <View style={{ marginBottom: spacing.s4 }}>
                <FirstEntryHero
                  recording={firstRecording}
                  nextAppointment={nextAppointment}
                  onDismiss={dismissFirstEntryHero}
                />
              </View>
            )}

            <UpNextCard
              appointment={nextAppointment}
              onPress={() => router.push('/(tabs)/prep')}
              onAdd={() => router.push('/appointment-new')}
            />

            <View style={{ marginTop: spacing.s4 }}>
              <QuickLogRow />
            </View>

            <View style={{ marginTop: spacing.s5 }}>
              <View style={styles.sectionRow}>
                <SectionLabel label="Today" />
                {todayEntries.length > 0 && (
                  <Text style={[typography.label, { color: colors.textTertiary }]}>
                    {todayEntries.length}{' '}
                    {todayEntries.length === 1 ? 'entry' : 'entries'}
                  </Text>
                )}
              </View>
              {todayEntries.length > 0 ? (
                <TimelineCard entries={todayEntries} />
              ) : (
                <TodayEmpty onPress={() => router.push('/record')} />
              )}
            </View>

            {nudge && (
              <InsightNudge
                nudge={nudge}
                onPress={() => router.push('/(tabs)/insights')}
              />
            )}

            {!showFirstEntryHero && (
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
            )}
          </ScrollView>

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
};

export default TabHome;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(16),
  },
  scroll: {
    paddingHorizontal: spacing.s6,
    paddingBottom: 160,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
