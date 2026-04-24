import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarPlus, ChevronRight } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
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
            <Text style={[typography.h1, { color: colors.textPrimary }]}>Prep</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
              AI summaries for your upcoming visits.
            </Text>
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

            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/appointment-new');
              }}
              style={[
                styles.addCard,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
                shadows.card,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add appointment"
            >
              <View
                style={[styles.addIcon, { backgroundColor: colors.accent + '1A' }]}
              >
                <CalendarPlus
                  size={moderateScale(18)}
                  color={colors.accent}
                  strokeWidth={2.2}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[
                    typography.h3,
                    {
                      color: colors.textPrimary,
                      fontFamily: 'DMSans_600SemiBold',
                    },
                  ]}
                  numberOfLines={1}
                >
                  Add appointment
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: 1 },
                  ]}
                  numberOfLines={1}
                >
                  We'll prep a brief for your next visit.
                </Text>
              </View>
              <ChevronRight
                size={moderateScale(16)}
                color={colors.textTertiary}
                strokeWidth={2}
              />
            </Pressable>

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
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: verticalScale(120),
  },
  addCard: {
    marginTop: theme.spacing.s4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastSection: {
    marginTop: theme.spacing.s6,
    gap: verticalScale(6),
  },
}));
