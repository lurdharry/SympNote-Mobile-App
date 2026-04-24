import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Download,
  Share as ShareIcon,
  Sparkles,
} from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { PrepRow } from '@/hooks/usePrepRows';
import type { AppointmentBrief } from '@/stores/types';
import type { PrepSectionId } from '@/constants/prep';
import { findSpecialty } from '@/constants/specialties';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { renderBrief } from '@/utils/prepBrief';
import { exportBriefPdf } from '@/services/pdf';
import { hapticLight } from '@/services/haptics';
import { ConcernRow } from './ConcernRow';
import { SectionTabs } from './SectionTabs';
import { SeverityChart } from './SeverityChart';
import { QuestionsSection } from './QuestionsSection';
import { MedsSection } from './MedsSection';

interface AppointmentCardProps {
  row: PrepRow;
  open: boolean;
  onToggle: () => void;
}

/**
 * Synthesize an AppointmentBrief shell from the prep card's heuristic
 * preview data. Used when the user hits Export PDF before having
 * generated the real AI brief — the PDF still renders something
 * concrete instead of erroring out.
 */
const shellBriefFromRow = (row: PrepRow): AppointmentBrief => ({
  summary: '',
  topConcerns: row.content.concerns.map((c) => ({
    label: c.t,
    detail: [c.s, `Peak severity ${c.sev}/10`].filter(Boolean).join('. '),
  })),
  timeline: row.content.timeline
    ? [{ date: 'Recent', line: row.content.timeline }]
    : [],
  patterns: [],
  medications: row.content.meds.map((m) =>
    [m.name, m.dose && m.dose !== '—' ? m.dose : '', m.freq]
      .filter(Boolean)
      .join(' ')
      .trim(),
  ),
  questions: row.content.questions,
  flags: [],
});

const exportRowPdf = async (
  row: PrepRow,
  brief: AppointmentBrief | null,
): Promise<void> => {
  try {
    await exportBriefPdf({
      doctor: row.doc,
      specialty: row.spec,
      dateLabel: row.dateLabel,
      timeLabel: row.timeLabel,
      brief: brief ?? shellBriefFromRow(row),
    });
  } catch (e) {
    Alert.alert('Export failed', String(e));
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ row, open, onToggle }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const aiBrief = useAppointmentsStore((s) => s.getById(row.id)?.brief ?? null);
  const specialty = findSpecialty(row.spec);
  const SpecIcon = specialty.Icon;
  const [section, setSection] = useState<PrepSectionId>('summary');

  const { concerns, timeline, severity, questions, meds } = row.content;
  const isStale = row.briefState === 'stale';

  const openFullBrief = () => {
    hapticLight();
    router.push(`/appointment/${row.id}`);
  };

  const briefLabel =
    row.briefState === 'none'
      ? 'Draft your visit brief'
      : isStale
        ? 'Refresh brief · new entries'
        : 'View your visit brief';

  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withTiming(open ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, rotate]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 180}deg` }],
  }));

  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [enter]);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 10 }],
  }));

  return (
    <Animated.View style={[enterStyle, { marginBottom: spacing.s4 }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.elevated,
        ]}
      >
        {/* Gradient hero band carries the specialty identity at a glance. */}
        <View style={styles.hero}>
          <LinearGradient
            colors={specialty.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.heroBlob} />
          <View style={styles.heroRow}>
            <View style={styles.specTile}>
              <SpecIcon size={moderateScale(20)} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.docName} numberOfLines={1}>
                {row.doc}
              </Text>
              <Text style={styles.specLabel} numberOfLines={1}>
                {row.spec}
              </Text>
            </View>
            <View style={styles.countdown}>
              <Text style={styles.countdownNum}>{row.inDays}</Text>
              <Text style={styles.countdownLabel}>
                {row.inDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={onToggle} style={styles.metaRow}>
          <Calendar size={moderateScale(13)} color={colors.textTertiary} strokeWidth={2} />
          <Text
            style={[typography.label, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {row.dateLabel} · {row.timeLabel}
          </Text>
          <View style={{ flex: 1 }} />
          <Animated.View style={chevron}>
            <ChevronDown
              size={moderateScale(16)}
              color={colors.textTertiary}
              strokeWidth={2}
            />
          </Animated.View>
        </Pressable>

        <Pressable onPress={openFullBrief} style={styles.briefCTA}>
          <LinearGradient
            colors={isStale ? ['#F6C06A', '#D9964A'] : specialty.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.briefCTAText} numberOfLines={1}>
            {briefLabel}
          </Text>
          <ArrowRight size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>

        {open && (
          <View style={[styles.body, { borderTopColor: colors.border }]}>
            <View style={styles.tabsSlot}>
              <SectionTabs
                value={section}
                onChange={setSection}
                accent={row.color}
              />
            </View>
            <View style={styles.tabContent}>
              {section === 'summary' && (
                <>
                  {concerns.length === 0 && !timeline ? (
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.textTertiary,
                          textAlign: 'center',
                          paddingVertical: spacing.s6,
                          lineHeight: fontScale(20),
                        },
                      ]}
                    >
                      Log entries leading up to this visit and they'll be
                      summarized here.
                    </Text>
                  ) : (
                    <View style={{ gap: moderateScale(8) }}>
                      {concerns.map((c, i) => (
                        <ConcernRow
                          key={`${i}-${c.t}`}
                          concern={c}
                          accent={row.color}
                        />
                      ))}
                      {!!timeline && (
                        <View style={{ marginTop: moderateScale(6) }}>
                          <Text
                            style={[
                              typography.label,
                              {
                                color: colors.textTertiary,
                                fontFamily: 'DMSans_700Bold',
                                letterSpacing: 1,
                                marginBottom: 4,
                              },
                            ]}
                          >
                            TIMELINE
                          </Text>
                          <Text
                            style={[
                              typography.body,
                              {
                                color: colors.textPrimary,
                                lineHeight: fontScale(20),
                              },
                            ]}
                          >
                            {timeline}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
              {section === 'chart' && (
                <SeverityChart data={severity} accent={row.color} />
              )}
              {section === 'questions' && (
                <QuestionsSection
                  questions={questions}
                  accent={row.color}
                  appointmentId={row.id}
                />
              )}
              {section === 'meds' && (
                <MedsSection meds={meds} accent={row.color} />
              )}
            </View>

            <View
              style={[styles.actions, { borderTopColor: colors.border }]}
            >
              <Pressable
                onPress={() => {
                  hapticLight();
                  exportRowPdf(row, aiBrief);
                }}
                style={[styles.iconAction, { backgroundColor: colors.bgMuted }]}
                accessibilityRole="button"
                accessibilityLabel="Export PDF"
              >
                <Download size={moderateScale(16)} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticLight();
                  Share.share({ message: renderBrief(row) }).catch(() => {});
                }}
                style={styles.primaryAction}
              >
                <LinearGradient
                  colors={specialty.grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <ShareIcon size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryActionText}>Share with doctor</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  hero: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    overflow: 'hidden',
  },
  heroBlob: {
    position: 'absolute',
    right: -scale(40),
    top: -verticalScale(40),
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  specTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    ...theme.typography.h3,
    fontFamily: 'Fraunces_500Medium',
    color: '#FFFFFF',
    fontSize: fontScale(19),
    lineHeight: fontScale(24),
    letterSpacing: -0.3,
  },
  specLabel: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  countdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    minWidth: moderateScale(54),
  },
  countdownNum: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: fontScale(22),
    lineHeight: fontScale(24),
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  countdownLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(10),
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.6,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
  },
  briefCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  briefCTAText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabsSlot: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(14),
  },
  tabContent: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconAction: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
    overflow: 'hidden',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
}));
