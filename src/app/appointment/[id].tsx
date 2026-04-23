import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  AlertTriangle,
  CalendarDays,
  Copy as CopyIcon,
  Download,
  MessageCircleQuestion,
  MoreVertical,
  Pencil,
  Pill,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
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
import { SharedElementScene } from '@/components/navigation/SharedElementScene';
import { StaggeredList } from '@/components/animated/StaggeredList';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { generateAppointmentBrief } from '@/services/ai';
import {
  briefSourceWindowLabel,
  isBriefStale,
  recordingsForAppointmentBrief,
} from '@/utils/briefSource';
import { briefToPlainText } from '@/utils/briefExport';
import { exportBriefPdf } from '@/services/pdf';
import { formatDate, formatTime } from '@/utils/date';
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from '@/services/haptics';
import { useTransition } from '@/components/navigation/TransitionContext';
import type { AppointmentBrief, AppointmentStatus } from '@/stores/types';
import { daysUntil } from '@/utils/date';
import {
  CalendarCheck,
  CalendarX,
  RotateCcw,
} from 'lucide-react-native';

const AppointmentDetail: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const appt = useAppointmentsStore((s) => s.getById(id!));
  const allAppointments = useAppointmentsStore((s) => s.appointments);
  const setBrief = useAppointmentsStore((s) => s.setBrief);
  const remove = useAppointmentsStore((s) => s.remove);
  const markAttended = useAppointmentsStore((s) => s.markAttended);
  const markMissed = useAppointmentsStore((s) => s.markMissed);
  const markCancelled = useAppointmentsStore((s) => s.markCancelled);
  const reopenAppointment = useAppointmentsStore((s) => s.reopenAppointment);
  const allRecordings = useRecordingsStore((s) => s.recordings);
  const personalization = useProfileStore((s) => s.personalization);
  const { closeScene } = useTransition();
  const insets = useSafeAreaInsets();

  const [generating, setGenerating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const goBack = async () => {
    hapticLight();
    await closeScene();
    router.back();
  };

  if (!appt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Appointment not found.
          </Text>
          <View style={{ height: spacing.s4 }} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const sourceRecordings = recordingsForAppointmentBrief(
    appt,
    allRecordings,
    allAppointments,
  );
  const sourceWindowLabel = briefSourceWindowLabel(appt, allAppointments);
  const stale = isBriefStale(appt, allRecordings);
  const brief = appt.brief;
  const days = daysUntil(appt.date);

  // When the appointment is in a terminal status, the badge reflects
  // that state instead of a relative-time countdown. Countdown only
  // applies to 'upcoming' visits.
  const pill = (() => {
    if (appt.status === 'attended') {
      return { label: 'Attended', tint: colors.success };
    }
    if (appt.status === 'missed') {
      return { label: `Didn't go`, tint: colors.textTertiary };
    }
    if (appt.status === 'cancelled') {
      return { label: 'Cancelled', tint: colors.textTertiary };
    }
    const label =
      days > 0 ? `in ${days}d` : days === 0 ? 'today' : `${Math.abs(days)}d ago`;
    const tint =
      days < 0 ? colors.coral : days <= 3 ? colors.coral : colors.accent;
    return { label, tint };
  })();

  const generate = async () => {
    if (sourceRecordings.length === 0) {
      Alert.alert(
        'No entries yet',
        'Record at least one entry about what you want to discuss before drafting the brief.',
        [{ text: 'OK' }],
      );
      return;
    }
    hapticMedium();
    setGenerating(true);
    try {
      const fresh = await generateAppointmentBrief(
        appt,
        sourceRecordings,
        personalization,
      );
      setBrief(appt.id, fresh, sourceRecordings.map((r) => r.id));
      hapticSuccess();
    } catch (e) {
      Alert.alert('Brief failed', String(e));
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!brief) return;
    await Clipboard.setStringAsync(briefToPlainText(appt, brief));
    hapticLight();
  };

  const share = () => {
    if (!brief) return;
    Share.share({ message: briefToPlainText(appt, brief) }).catch(() => {});
  };

  const exportPdf = async () => {
    if (!brief) return;
    hapticLight();
    try {
      await exportBriefPdf({
        doctor: appt.doctorName,
        specialty: appt.specialty,
        dateLabel: formatDate(appt.date),
        timeLabel: formatTime(appt.date),
        brief,
      });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const del = () => {
    Alert.alert('Delete appointment?', 'This removes the brief too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(appt.id);
          router.back();
        },
      },
    ]);
  };

  const editAppointment = () => {
    hapticLight();
    router.push(`/appointment-new?editId=${appt.id}`);
  };

  const attend = () => {
    markAttended(appt.id);
    hapticSuccess();
  };

  const missed = () => {
    Alert.alert(
      `Mark "Didn't go"?`,
      'This moves the appointment out of your upcoming list. You can reopen it if this was a mistake.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Didn't go`,
          onPress: () => {
            markMissed(appt.id);
            hapticLight();
          },
        },
      ],
    );
  };

  const cancelled = () => {
    Alert.alert(
      'Mark cancelled?',
      'The appointment stays in your past visits but no longer counts as an upcoming one.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancelled',
          onPress: () => {
            markCancelled(appt.id);
            hapticLight();
          },
        },
      ],
    );
  };

  const reopen = () => {
    reopenAppointment(appt.id);
    hapticLight();
  };

  return (
    <SharedElementScene style={{ backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Sticky top bar — always tappable, never scrolls away.
            Explicit paddingTop from insets so the bar clears the status
            bar even when SharedElementScene's positioning confuses the
            nested SafeAreaView during the expand transition. */}
        <View style={[styles.topBar, { paddingTop: insets.top + verticalScale(6) }]}>
          <BackButton onPress={goBack} />
          <Text
            style={[
              typography.label,
              {
                color: colors.textTertiary,
                letterSpacing: 1,
                fontFamily: 'DMSans_700Bold',
                fontSize: fontScale(11),
              },
            ]}
          >
            VISIT BRIEF
          </Text>
          <Pressable
            onPress={() => {
              hapticLight();
              setMenuOpen(true);
            }}
            hitSlop={10}
            style={[styles.menuBtn, { backgroundColor: colors.bgMuted }]}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            <MoreVertical size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                  {appt.doctorName}
                </Text>
                <Text
                  style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}
                >
                  {appt.specialty}
                </Text>
              </View>
              <View
                style={[
                  styles.countdown,
                  { backgroundColor: pill.tint + '1A', borderColor: pill.tint + '55' },
                ]}
              >
                <Text
                  style={[
                    typography.label,
                    {
                      color: pill.tint,
                      fontFamily: 'DMSans_700Bold',
                    },
                  ]}
                >
                  {pill.label}
                </Text>
              </View>
            </View>
            <View style={styles.heroMeta}>
              <CalendarDays size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {formatDate(appt.date)} · {formatTime(appt.date)}
              </Text>
            </View>
          </View>

          {/* Source caption — lets the user see what the brief is drawing
              from without needing to curate recordings by hand. */}
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, marginTop: spacing.s2, marginBottom: spacing.s3 },
            ]}
          >
            Drawing from{' '}
            <Text style={{ fontFamily: 'DMSans_600SemiBold', color: colors.textSecondary }}>
              {sourceRecordings.length}{' '}
              {sourceRecordings.length === 1 ? 'entry' : 'entries'}
            </Text>{' '}
            · {sourceWindowLabel}
          </Text>

          {/* Brief body */}
          {!brief ? (
            <GenerateCTA
              generating={generating}
              sourceCount={sourceRecordings.length}
              onPress={generate}
            />
          ) : (
            <>
              {stale && (
                <StaleBanner
                  onRegenerate={generate}
                  regenerating={generating}
                />
              )}
              <BriefView brief={brief} />
            </>
          )}

          <Text
            style={[
              typography.caption,
              {
                color: colors.textTertiary,
                marginTop: spacing.s6,
                textAlign: 'center',
                fontStyle: 'italic',
              },
            ]}
          >
            Not medical advice. Review with your doctor.
          </Text>
        </ScrollView>

        {/* Sticky primary action — only when brief exists */}
        {brief && (
          <View style={[styles.ctaBar, { borderTopColor: colors.border, backgroundColor: colors.bgPrimary }]}>
            <View style={{ flex: 1 }}>
              <Button
                label="Share with doctor"
                onPress={share}
              />
            </View>
            <Pressable
              onPress={exportPdf}
              hitSlop={8}
              style={[styles.iconAction, { backgroundColor: colors.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Export as PDF"
            >
              <Download size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={copy}
              hitSlop={8}
              style={[styles.iconAction, { backgroundColor: colors.bgMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Copy as text"
            >
              <CopyIcon size={moderateScale(18)} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
        )}

        <ActionMenu
          visible={menuOpen}
          hasBrief={!!brief}
          regenerating={generating}
          status={appt.status}
          onClose={() => setMenuOpen(false)}
          onRegenerate={() => {
            setMenuOpen(false);
            generate();
          }}
          onEdit={() => {
            setMenuOpen(false);
            editAppointment();
          }}
          onDelete={() => {
            setMenuOpen(false);
            del();
          }}
          onAttend={() => {
            setMenuOpen(false);
            attend();
          }}
          onMissed={() => {
            setMenuOpen(false);
            missed();
          }}
          onCancelled={() => {
            setMenuOpen(false);
            cancelled();
          }}
          onReopen={() => {
            setMenuOpen(false);
            reopen();
          }}
        />
      </SafeAreaView>
    </SharedElementScene>
  );
};

export default AppointmentDetail;

/* ──────────── Sub-components ──────────── */

interface GenerateCTAProps {
  generating: boolean;
  sourceCount: number;
  onPress: () => void;
}

const GenerateCTA: React.FC<GenerateCTAProps> = ({
  generating,
  sourceCount,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.generateCard,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={[styles.sparkleTile, { backgroundColor: colors.accent + '1A' }]}>
        <Sparkles size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
      </View>
      <Text style={[styles.generateHeadline, { color: colors.textPrimary }]}>
        Draft your visit brief.
      </Text>
      <Text style={[styles.generateSub, { color: colors.textSecondary }]}>
        {sourceCount > 0
          ? 'Your doctor will read the structured brief built from your recent entries.'
          : 'Record at least one entry before drafting. Your brief comes from your voice logs.'}
      </Text>
      <View style={{ marginTop: spacing.s4, alignSelf: 'stretch' }}>
        <Button
          label={generating ? 'Drafting…' : 'Generate brief'}
          disabled={generating || sourceCount === 0}
          onPress={onPress}
        />
      </View>
    </View>
  );
};

interface StaleBannerProps {
  onRegenerate: () => void;
  regenerating: boolean;
}

const StaleBanner: React.FC<StaleBannerProps> = ({ onRegenerate, regenerating }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={regenerating ? undefined : onRegenerate}
      style={[
        styles.staleBanner,
        {
          backgroundColor: colors.gold + '1A',
          borderColor: colors.gold + '55',
        },
      ]}
    >
      <Sparkles size={moderateScale(14)} color={colors.gold} strokeWidth={2.2} />
      <Text style={[typography.caption, { color: colors.textPrimary, flex: 1 }]}>
        New entries since this was drafted.{' '}
        <Text style={{ fontFamily: 'DMSans_700Bold' }}>
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </Text>
      </Text>
    </Pressable>
  );
};

interface BriefViewProps {
  brief: AppointmentBrief;
}

const BriefView: React.FC<BriefViewProps> = ({ brief }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <StaggeredList stagger={90} initialDelay={80}>
      {brief.summary ? (
        <View style={[styles.section, { marginTop: spacing.s6 }]}>
          <SectionHeader Icon={Target} label="Summary" tint={colors.accent} />
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
            {brief.summary}
          </Text>
        </View>
      ) : null}

      {brief.flags.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader Icon={AlertTriangle} label="Worth flagging" tint={colors.coral} />
          <View
            style={[
              styles.flagBox,
              {
                backgroundColor: colors.coral + '10',
                borderColor: colors.coral + '55',
              },
            ]}
          >
            {brief.flags.map((f, i) => (
              <View key={i} style={styles.flagRow}>
                <Text style={[typography.body, { color: colors.coral, marginRight: 6 }]}>⚠</Text>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {brief.topConcerns.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader Icon={Target} label="Top concerns" tint="#E07A5F" />
          {brief.topConcerns.map((c, i) => (
            <View key={i} style={styles.concernRow}>
              <View style={[styles.concernDot, { backgroundColor: '#E07A5F' }]} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.body,
                    { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
                  ]}
                >
                  {c.label}
                </Text>
                {c.detail ? (
                  <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
                    {c.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {brief.timeline.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader Icon={CalendarDays} label="Timeline" tint="#D97706" />
          {brief.timeline.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textTertiary,
                    fontFamily: 'DMSans_700Bold',
                    minWidth: moderateScale(56),
                  },
                ]}
              >
                {t.date}
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                {t.line}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {brief.patterns.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader Icon={Sparkles} label="Patterns" tint="#5A8F6E" />
          {brief.patterns.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[typography.body, { color: colors.textTertiary, marginRight: 8 }]}>
                •
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {brief.medications.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader Icon={Pill} label="Medications" tint="#2C6E6B" />
          <View style={styles.medsRow}>
            {brief.medications.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.medChip,
                  { backgroundColor: colors.bgMuted, borderColor: colors.border },
                ]}
              >
                <Text style={[typography.caption, { color: colors.textPrimary }]}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {brief.questions.length > 0 ? (
        <View style={[styles.section, { marginTop: spacing.s5 }]}>
          <SectionHeader
            Icon={MessageCircleQuestion}
            label="Questions to ask"
            tint={colors.accent}
          />
          {brief.questions.map((q, i) => (
            <View key={i} style={styles.questionRow}>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.accent,
                    fontFamily: 'DMSans_700Bold',
                    marginRight: 8,
                    minWidth: moderateScale(20),
                  },
                ]}
              >
                {i + 1}.
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                {q}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </StaggeredList>
  );
};

interface SectionHeaderProps {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  tint: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ Icon, label, tint }) => {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Icon size={moderateScale(14)} color={tint} strokeWidth={2.2} />
      <Text style={[styles.sectionLabel, { color: tint }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

interface ActionMenuProps {
  visible: boolean;
  hasBrief: boolean;
  regenerating: boolean;
  status: AppointmentStatus;
  onClose: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAttend: () => void;
  onMissed: () => void;
  onCancelled: () => void;
  onReopen: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  hasBrief,
  regenerating,
  status,
  onClose,
  onRegenerate,
  onEdit,
  onDelete,
  onAttend,
  onMissed,
  onCancelled,
  onReopen,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (!visible) return null;
  const isUpcoming = status === 'upcoming';
  return (
    <Pressable onPress={onClose} style={styles.menuBackdrop}>
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={[
          styles.menuCard,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        {isUpcoming ? (
          <>
            <MenuRow
              Icon={CalendarCheck}
              label="Mark attended"
              tint={colors.success}
              onPress={onAttend}
            />
            <MenuRow
              Icon={CalendarX}
              label="Didn't go"
              tint={colors.textSecondary}
              onPress={onMissed}
            />
            <MenuRow
              Icon={CalendarX}
              label="Cancelled"
              tint={colors.textSecondary}
              onPress={onCancelled}
            />
          </>
        ) : (
          <MenuRow
            Icon={RotateCcw}
            label="Reopen as upcoming"
            tint={colors.accent}
            onPress={onReopen}
          />
        )}
        {hasBrief && (
          <MenuRow
            Icon={RefreshCw}
            label={regenerating ? 'Regenerating…' : 'Regenerate brief'}
            tint={colors.accent}
            disabled={regenerating}
            onPress={onRegenerate}
          />
        )}
        <MenuRow
          Icon={Pencil}
          label="Edit appointment"
          tint={colors.textPrimary}
          onPress={onEdit}
        />
        <MenuRow
          Icon={Trash2}
          label="Delete appointment"
          tint={colors.coral}
          destructive
          onPress={onDelete}
        />
      </Pressable>
    </Pressable>
  );
};

interface MenuRowProps {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  tint: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ Icon, label, tint, disabled, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.menuRow,
        { borderBottomColor: colors.border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Icon size={moderateScale(16)} color={tint} strokeWidth={2} />
      <Text
        style={[
          typography.body,
          { color: tint, flex: 1, fontFamily: 'DMSans_500Medium' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  topBar: {
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  menuBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s10,
  },
  hero: {
    marginBottom: spacing.s4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  heroName: {
    ...theme.typography.h1,
    fontFamily: 'Fraunces_500Medium',
    letterSpacing: -0.5,
  },
  countdown: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: verticalScale(6),
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(8),
  },
  generateCard: {
    marginTop: spacing.s5,
    padding: moderateScale(20),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  sparkleTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s3,
  },
  generateHeadline: {
    ...theme.typography.h3,
    fontFamily: 'Fraunces_500Medium',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  generateSub: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: moderateScale(4),
    paddingHorizontal: theme.spacing.s3,
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.s5,
  },
  section: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  sectionLabel: {
    ...theme.typography.label,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
    fontSize: fontScale(11),
  },
  summaryText: {
    ...theme.typography.body,
    fontFamily: 'Fraunces_300Light',
    fontSize: fontScale(17),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
  flagBox: {
    padding: moderateScale(14),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: moderateScale(8),
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(8),
    gap: moderateScale(10),
  },
  concernDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: verticalScale(8),
  },
  timelineRow: {
    flexDirection: 'row',
    paddingVertical: verticalScale(6),
    gap: moderateScale(10),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(4),
  },
  medsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  medChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(6),
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconAction: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
    paddingTop: verticalScale(56),
    paddingRight: theme.spacing.s5,
  },
  menuCard: {
    minWidth: moderateScale(220),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
}));
