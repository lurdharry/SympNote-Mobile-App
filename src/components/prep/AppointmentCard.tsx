import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Calendar,
  ChevronDown,
  Clipboard,
  Download,
  Share as ShareIcon,
} from 'lucide-react-native';
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
import type { PrepRow } from '@/hooks/usePrepRows';
import type { PrepSectionId } from '@/constants/prep';
import { renderBrief } from '@/utils/prepBrief';
import { exportBriefPdf } from '@/services/pdf';
import { hapticLight } from '@/services/haptics';
import { SectionTabs } from './SectionTabs';
import { SummarySection } from './SummarySection';
import { SeverityChart } from './SeverityChart';
import { QuestionsSection } from './QuestionsSection';
import { MedsSection } from './MedsSection';

interface AppointmentCardProps {
  row: PrepRow;
  open: boolean;
  onToggle: () => void;
}

const exportRowPdf = async (row: PrepRow): Promise<void> => {
  try {
    await exportBriefPdf({
      doctor: row.doc,
      specialty: row.spec,
      dateLabel: row.dateLabel,
      timeLabel: row.timeLabel,
      concerns: row.content.concerns.map((c) => ({
        title: c.t,
        detail: c.s,
        severity: c.sev,
      })),
      timeline: row.content.timeline,
      questions: row.content.questions,
      meds: row.content.meds.map((m) => ({
        name: m.name,
        dose: m.dose,
        freq: m.freq,
        last: m.last,
      })),
    });
  } catch (e) {
    Alert.alert('Export failed', String(e));
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ row, open, onToggle }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [section, setSection] = useState<PrepSectionId>('summary');

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
    <Animated.View style={[enterStyle, { marginBottom: spacing.s3 }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        <Pressable onPress={onToggle} style={styles.header}>
          <View style={[styles.icon, { backgroundColor: row.color + '22' }]}>
            <Clipboard size={20} color={row.color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.headerRow}>
              <Text
                style={[typography.h3, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {row.doc}
              </Text>
              <View style={[styles.countdown, { backgroundColor: row.color + '22' }]}>
                <Text
                  style={[
                    typography.caption,
                    { color: row.color, fontFamily: 'DMSans_700Bold' },
                  ]}
                >
                  in {row.inDays}d
                </Text>
              </View>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {row.spec}
            </Text>
            <View style={styles.meta}>
              <Calendar size={12} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.label, { color: colors.textTertiary }]}>
                {row.dateLabel} · {row.timeLabel}
              </Text>
            </View>
          </View>
          <Animated.View style={chevron}>
            <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />
          </Animated.View>
        </Pressable>

        {open && (
          <View style={[styles.body, { borderTopColor: colors.border }]}>
            <View style={{ padding: 16 }}>
              <SectionTabs value={section} onChange={setSection} accent={row.color} />
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {section === 'summary' && (
                <SummarySection
                  concerns={row.content.concerns}
                  timeline={row.content.timeline}
                  accent={row.color}
                />
              )}
              {section === 'chart' && (
                <SeverityChart data={row.content.severity} accent={row.color} />
              )}
              {section === 'questions' && (
                <QuestionsSection
                  questions={row.content.questions}
                  accent={row.color}
                  appointmentId={row.id}
                />
              )}
              {section === 'meds' && (
                <MedsSection meds={row.content.meds} accent={row.color} />
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  exportRowPdf(row);
                }}
                style={[styles.secondaryAction, { backgroundColor: colors.bgMuted }]}
              >
                <Download size={14} color={colors.textPrimary} strokeWidth={2} />
                <Text
                  style={[
                    typography.label,
                    { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
                  ]}
                >
                  Export PDF
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticLight();
                  Share.share({ message: renderBrief(row) }).catch(() => {});
                }}
                style={[styles.primaryAction, { backgroundColor: row.color }]}
              >
                <ShareIcon size={14} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={[
                    typography.label,
                    { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
                  ]}
                >
                  Share
                </Text>
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
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
    padding: moderateScale(16),
  },
  icon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  countdown: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: theme.radius.full,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(4),
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(251,248,242,0.4)',
  },
  actions: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
  },
  secondaryAction: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(6),
  },
  primaryAction: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(6),
  },
}));
