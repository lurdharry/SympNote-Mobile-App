import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  ChevronDown,
  Clipboard,
  Download,
  Pill,
  Plus,
  Share as ShareIcon,
  TrendingUp,
  X as XIcon,
} from 'lucide-react-native';
import { makeStyles, shadows, spacing, typography, useTheme } from '../../theme';
import { SceneTransition } from '../../components/navigation/SceneTransition';
import { useAppointmentsStore } from '../../stores/useAppointmentsStore';
import { useRecordingsStore } from '../../stores/useRecordingsStore';
import { formatDate, formatTime, daysUntil } from '../../utils/date';
import { hapticLight, hapticSuccess } from '../../services/haptics';
import { exportBriefPdf } from '../../services/pdf';
import { deriveAppointmentBrief } from '../../utils/prep';
import {
  ConcernDemo,
  DEMO_APPTS,
  DEMO_PREP_CONTENT as DEMO_CONTENT,
  MedDemo,
  PrepContent,
  SeverityPoint,
} from '../../constants/demo/prep';

/**
 * Prep tab — per design handoff.
 *
 * Each appointment is an expandable card. Expanded state reveals an
 * inner 4-tab control (Summary / Severity / Questions / Meds) + Export
 * and Share actions tinted to the appointment's accent color.
 *
 * Demo content is used to populate inner tabs when the user hasn't
 * attached entries yet — that keeps the showcase visually dense during
 * prototype/review.
 */


type PrepRow = {
  id: string;
  /**
   * True when this row came from the local demo array rather than the
   * appointments store. Used to gate editable-state UI (add/remove
   * questions) which would otherwise fake persistence.
   */
  isDemo: boolean;
  doc: string;
  spec: string;
  dateLabel: string;
  timeLabel: string;
  inDays: number;
  color: string;
  content: PrepContent;
};

/**
 * Renders the visit brief as plain text for Share / Export. Sections are
 * included only if they have content. Doctor gets a reader-friendly
 * one-pager rather than the raw JSON.
 */
function renderBrief(row: PrepRow): string {
  const lines: string[] = [];
  lines.push(`Visit brief — ${row.doc}, ${row.spec}`);
  lines.push(`${row.dateLabel} · ${row.timeLabel}`);
  lines.push('');
  if (row.content.concerns.length > 0) {
    lines.push('Concerns');
    row.content.concerns.forEach((c) => {
      lines.push(`  • ${c.t} (${c.sev}/10) — ${c.s}`);
    });
    lines.push('');
  }
  if (row.content.timeline) {
    lines.push('Timeline');
    lines.push(`  ${row.content.timeline}`);
    lines.push('');
  }
  if (row.content.questions.length > 0) {
    lines.push('Questions for your doctor');
    row.content.questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
    lines.push('');
  }
  if (row.content.meds.length > 0) {
    lines.push('Medications');
    row.content.meds.forEach((m) => {
      lines.push(
        `  • ${m.name} ${m.dose} — ${m.freq} (last: ${m.last})`
      );
    });
    lines.push('');
  }
  lines.push('Shared from Sympnote — organizational tool, not medical advice.');
  return lines.join('\n');
}

export default function TabPrep() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const storeAppts = useAppointmentsStore((s) => s.appointments);
  const storeRecordings = useRecordingsStore((s) => s.recordings);

  const rows = useMemo<PrepRow[]>(() => {
    if (storeAppts.length > 0) {
      return storeAppts.map((a, i) => {
        // Real sections derived from the recordings attached to this
        // appointment. Empty arrays/strings cascade into empty-state
        // copy inside the Summary / Severity / Meds tabs — nothing
        // lies about having data we don't have.
        const derived = deriveAppointmentBrief(a, storeRecordings);
        return {
          id: a.id,
          isDemo: false,
          doc: a.doctorName,
          spec: a.specialty,
          dateLabel: formatDate(a.date),
          timeLabel: formatTime(a.date),
          inDays: Math.max(0, daysUntil(a.date)),
          color: i === 0 ? '#2C6E6B' : '#E07A5F',
          content: {
            concerns: derived.concerns,
            timeline: derived.timeline,
            severity: derived.severity,
            meds: derived.meds,
            questions: a.brief?.questions ?? [],
          },
        };
      });
    }
    return DEMO_APPTS.map((a) => ({
      id: a.id,
      isDemo: true,
      doc: a.doc,
      spec: a.spec,
      dateLabel: a.date,
      timeLabel: a.time,
      inDays: a.inDays,
      color: a.color,
      content: DEMO_CONTENT[a.id]!,
    }));
  }, [storeAppts, storeRecordings]);

  const [expanded, setExpanded] = useState<string | null>(rows[0]?.id ?? null);

  return (
    <SceneTransition mode="crossfade-parallax-up">
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.textPrimary }]}>
              Prep
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              AI summaries for your upcoming visits.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((r, i) => (
              <AppointmentCard
                key={r.id}
                row={r}
                open={expanded === r.id}
                onToggle={() =>
                  setExpanded(expanded === r.id ? null : r.id)
                }
                index={i}
              />
            ))}

            <Pressable
              onPress={() => {
                hapticLight();
                router.push('/appointment-new');
              }}
              style={[
                styles.addDashed,
                { borderColor: colors.border },
              ]}
            >
              <Plus size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                Add appointment
              </Text>
            </Pressable>

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
}

/* -------------------- Appointment card -------------------- */

function AppointmentCard({
  row,
  open,
  onToggle,
  index,
}: {
  row: PrepRow;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [section, setSection] = useState<
    'summary' | 'chart' | 'questions' | 'meds'
  >('summary');
  const rotate = useSharedValue(0);
  React.useEffect(() => {
    rotate.value = withTiming(open ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, rotate]);
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 180}deg` }],
  }));

  const enter = useSharedValue(0);
  React.useEffect(() => {
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
          styles.apptCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
          },
          shadows.card,
        ]}
      >
        <Pressable onPress={onToggle} style={styles.apptHeader}>
          <View
            style={[
              styles.apptIcon,
              { backgroundColor: row.color + '22' },
            ]}
          >
            <Clipboard size={20} color={row.color} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.apptHeaderRow}>
              <Text
                style={[typography.h3, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {row.doc}
              </Text>
              <View
                style={[
                  styles.countdownPill,
                  { backgroundColor: row.color + '22' },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: row.color,
                      fontFamily: 'Inter_700Bold',
                    },
                  ]}
                >
                  in {row.inDays}d
                </Text>
              </View>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary },
              ]}
            >
              {row.spec}
            </Text>
            <View style={styles.apptMeta}>
              <Calendar
                size={12}
                color={colors.textTertiary}
                strokeWidth={2}
              />
              <Text
                style={[typography.label, { color: colors.textTertiary }]}
              >
                {row.dateLabel} · {row.timeLabel}
              </Text>
            </View>
          </View>
          <Animated.View style={chevron}>
            <ChevronDown
              size={18}
              color={colors.textTertiary}
              strokeWidth={2}
            />
          </Animated.View>
        </Pressable>

        {open && (
          <View
            style={[
              styles.apptBody,
              { borderTopColor: colors.border },
            ]}
          >
            <View style={{ padding: 16 }}>
              <SectionTabs
                value={section}
                onChange={setSection}
                accent={row.color}
              />
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
                <SeverityChart
                  data={row.content.severity}
                  accent={row.color}
                />
              )}
              {section === 'questions' && (
                <QuestionsSection
                  questions={row.content.questions}
                  accent={row.color}
                  appointmentId={row.isDemo ? null : row.id}
                />
              )}
              {section === 'meds' && (
                <MedsSection meds={row.content.meds} accent={row.color} />
              )}
            </View>
            <View style={styles.actionsRow}>
              <Pressable
                onPress={async () => {
                  hapticLight();
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
                }}
                style={[
                  styles.secondaryAction,
                  { backgroundColor: colors.bgMuted },
                ]}
              >
                <Download
                  size={14}
                  color={colors.textPrimary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    typography.label,
                    {
                      color: colors.textPrimary,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
                  Export PDF
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticLight();
                  Share.share({
                    message: renderBrief(row),
                  }).catch(() => {});
                }}
                style={[
                  styles.primaryAction,
                  { backgroundColor: row.color },
                ]}
              >
                <ShareIcon size={14} color="#FFFFFF" strokeWidth={2} />
                <Text
                  style={[
                    typography.label,
                    {
                      color: '#FFFFFF',
                      fontFamily: 'Inter_600SemiBold',
                    },
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
}

function SectionTabs({
  value,
  onChange,
  accent,
}: {
  value: string;
  onChange: (v: 'summary' | 'chart' | 'questions' | 'meds') => void;
  accent: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tabs = [
    { id: 'summary',   label: 'Summary' },
    { id: 'chart',     label: 'Severity' },
    { id: 'questions', label: 'Questions' },
    { id: 'meds',      label: 'Meds' },
  ] as const;
  return (
    <View
      style={[
        styles.innerTabs,
        { backgroundColor: colors.bgMuted },
      ]}
    >
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              hapticLight();
              onChange(t.id);
            }}
            style={[
              styles.innerTab,
              active && { backgroundColor: accent },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: active ? '#FFFFFF' : colors.textSecondary,
                  fontFamily: 'Inter_600SemiBold',
                },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummarySection({
  concerns,
  timeline,
  accent,
}: {
  concerns: ConcernDemo[];
  timeline: string;
  accent: string;
}) {
  const { colors } = useTheme();
  const isEmpty = concerns.length === 0 && !timeline;
  if (isEmpty) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s6,
            lineHeight: 20,
          },
        ]}
      >
        Log entries leading up to this visit and they'll be summarized
        here.
      </Text>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {concerns.map((c, i) => (
        <ConcernRow key={i} concern={c} accent={accent} />
      ))}
      {!!timeline && (
        <View style={{ marginTop: 6 }}>
          <Text
            style={[
              typography.label,
              {
                color: colors.textTertiary,
                fontFamily: 'Inter_600SemiBold',
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
              { color: colors.textPrimary, lineHeight: 20 },
            ]}
          >
            {timeline}
          </Text>
        </View>
      )}
    </View>
  );
}

function ConcernRow({
  concern,
  accent,
}: {
  concern: ConcernDemo;
  accent: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone =
    concern.sev >= 7 ? '#E07A5F' : concern.sev >= 5 ? '#D97706' : accent;
  return (
    <View
      style={[
        styles.concernRow,
        { backgroundColor: colors.bgPrimary },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {concern.t}
          </Text>
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
          >
            {concern.s}
          </Text>
        </View>
        <Text
          style={{
            color: tone,
            fontFamily: 'Inter_700Bold',
            fontSize: 11,
            fontVariant: ['tabular-nums'],
          }}
        >
          {concern.sev}/10
        </Text>
      </View>
      <View
        style={[styles.concernTrack, { backgroundColor: colors.bgMuted }]}
      >
        <View
          style={{
            width: `${concern.sev * 10}%`,
            height: '100%',
            backgroundColor: tone,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

function SeverityChart({
  data,
  accent,
}: {
  data: SeverityPoint[];
  accent: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (data.length === 0) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s8,
          },
        ]}
      >
        No severity data yet.
      </Text>
    );
  }
  const avg = (data.reduce((s, d) => s + d.v, 0) / data.length).toFixed(1);
  const peak = Math.max(...data.map((d) => d.v));

  return (
    <View>
      <View style={styles.chartStats}>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Average
          </Text>
          <Text
            style={[
              typography.h2,
              { color: colors.textPrimary, fontVariant: ['tabular-nums'] },
            ]}
          >
            {avg}
            <Text
              style={[
                typography.body,
                { color: colors.textTertiary },
              ]}
            >
              /10
            </Text>
          </Text>
        </View>
        <View>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Peak
          </Text>
          <Text
            style={[
              typography.h2,
              { color: colors.coral, fontVariant: ['tabular-nums'] },
            ]}
          >
            {peak}
            <Text
              style={[
                typography.body,
                { color: colors.textTertiary },
              ]}
            >
              /10
            </Text>
          </Text>
        </View>
        <View style={styles.trendInline}>
          <TrendingUp size={12} color={colors.coral} strokeWidth={2} />
          <Text
            style={[
              typography.caption,
              {
                color: colors.coral,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            Trending up
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={styles.yAxis}>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>10</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>5</Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>0</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { justifyContent: 'space-between' },
            ]}
          >
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  opacity: 0.6,
                }}
              />
            ))}
          </View>
          <View style={styles.barsRow}>
            {data.map((d, i) => {
              const severe = d.v >= 7;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: `${(d.v / 10) * 100}%`,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={
                      severe ? ['#E07A5F', '#C45C3F'] : ['#A8C4C2', accent]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.xAxis}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {data[0]!.d}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>
              {data[data.length - 1]!.d}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function QuestionsSection({
  questions,
  accent,
  /**
   * Real appointment id when this card represents a persisted
   * appointment. Demo rows pass null and the add/remove UI is hidden
   * so we never fake persistence.
   */
  appointmentId,
}: {
  questions: string[];
  accent: string;
  appointmentId: string | null;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    if (!appointmentId) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setAdding(false);
      setDraft('');
      return;
    }
    useAppointmentsStore.getState().addQuestion(appointmentId, trimmed);
    hapticSuccess();
    setDraft('');
    setAdding(false);
  };

  const remove = (i: number) => {
    if (!appointmentId) return;
    hapticLight();
    useAppointmentsStore.getState().removeQuestion(appointmentId, i);
  };

  const canEdit = appointmentId !== null;

  return (
    <View style={{ gap: 6 }}>
      {questions.map((q, i) => (
        <View
          key={`${i}-${q.slice(0, 10)}`}
          style={[
            styles.questionRow,
            { backgroundColor: colors.bgPrimary },
          ]}
        >
          <View
            style={[
              styles.questionIdx,
              { backgroundColor: accent + '22' },
            ]}
          >
            <Text
              style={{
                color: accent,
                fontFamily: 'Inter_700Bold',
                fontSize: 11,
              }}
            >
              {i + 1}
            </Text>
          </View>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, flex: 1, lineHeight: 20 },
            ]}
          >
            {q}
          </Text>
          {canEdit && (
            <Pressable hitSlop={8} onPress={() => remove(i)}>
              <XIcon
                size={14}
                color={colors.textTertiary}
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>
      ))}

      {canEdit && adding && (
        <View
          style={[
            styles.questionRow,
            {
              backgroundColor: colors.bgPrimary,
              borderColor: accent,
              borderWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.questionIdx,
              { backgroundColor: accent + '22' },
            ]}
          >
            <Text
              style={{
                color: accent,
                fontFamily: 'Inter_700Bold',
                fontSize: 11,
              }}
            >
              {questions.length + 1}
            </Text>
          </View>
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            placeholder="Type your question…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            style={[
              typography.body,
              {
                flex: 1,
                color: colors.textPrimary,
                padding: 0,
                lineHeight: 20,
              },
            ]}
          />
        </View>
      )}

      {canEdit && !adding && (
        <Pressable
          onPress={() => {
            hapticLight();
            setAdding(true);
          }}
          style={[
            styles.addQuestion,
            { borderColor: colors.border },
          ]}
        >
          <Plus size={14} color={colors.textTertiary} strokeWidth={2} />
          <Text
            style={[
              typography.label,
              {
                color: colors.textTertiary,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            Add question
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function MedsSection({
  meds,
  accent,
}: {
  meds: MedDemo[];
  accent: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (meds.length === 0) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s6,
          },
        ]}
      >
        No medications logged.
      </Text>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {meds.map((m, i) => (
        <View
          key={i}
          style={[
            styles.medRow,
            { backgroundColor: colors.bgPrimary },
          ]}
        >
          <View
            style={[
              styles.medIcon,
              { backgroundColor: accent + '22' },
            ]}
          >
            <Pill size={18} color={accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textPrimary,
                  fontFamily: 'Inter_600SemiBold',
                },
              ]}
            >
              {m.name} · {m.dose}
            </Text>
            <Text
              style={[typography.caption, { color: colors.textTertiary }]}
            >
              {m.freq} · Last: {m.last}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: theme.spacing.s3,
  },
  content: {
    paddingHorizontal: theme.spacing.s6,
    paddingBottom: 120,
  },
  apptCard: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  apptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  apptIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countdownPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  apptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  apptBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(251,248,242,0.4)',
  },
  innerTabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 9999,
    gap: 4,
  },
  innerTab: {
    flex: 1,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  concernRow: {
    padding: 12,
    borderRadius: theme.radius.md,
  },
  concernTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  secondaryAction: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryAction: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  chartStats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 12,
  },
  trendInline: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yAxis: {
    width: 16,
    height: 112,
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'flex-end',
  },
  barsRow: {
    height: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  questionIdx: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  addQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDashed: {
    marginTop: theme.spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
}));
