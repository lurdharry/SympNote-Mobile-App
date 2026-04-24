import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { SceneTransition } from '@/components/navigation/SceneTransition';
import { AppointmentCard } from '@/components/prep/AppointmentCard';
import { PastVisitCard } from '@/components/prep/PastVisitCard';
import { PrepEmpty } from '@/components/empty/PrepEmpty';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { usePrepRows } from '@/hooks/usePrepRows';
import { hapticLight } from '@/services/haptics';

const TabPrep: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { upcoming, past } = usePrepRows();

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h1, { color: colors.textPrimary }]}>Prep</Text>
              <Text
                style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}
              >
                AI summaries for your upcoming visits.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/appointment-new');
              }}
              hitSlop={10}
              style={[styles.headerAdd, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Add appointment"
            >
              <Plus size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {upcoming.length === 0 && past.length === 0 ? (
              <PrepEmpty />
            ) : (
              upcoming.map((r) => <AppointmentCard key={r.id} row={r} />)
            )}

            {past.length > 0 && (
              <View style={styles.pastSection}>
                <SectionLabel label="Past visits" />
                {past.map((p) => (
                  <PastVisitCard
                    key={p.id}
                    row={p}
                    onPress={() => router.push(`/appointment/${p.id}`)}
                  />
                ))}
              </View>
            )}

            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.s4,
                  paddingHorizontal: spacing.s6,
                },
              ]}
            >
              Summaries are organizational tools · not medical advice
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </SceneTransition>
  );
};

export default TabPrep;

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  headerAdd: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.accentGlow,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: verticalScale(120),
  },
  pastSection: {
    marginTop: theme.spacing.s6,
    gap: verticalScale(6),
  },
}));
