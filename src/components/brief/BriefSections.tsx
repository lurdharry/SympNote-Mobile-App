import React from "react";
import { Text, View } from "react-native";
import {
  AlertTriangle,
  Clock,
  HelpCircle,
  Pill as PillIcon,
  Sparkles,
  Target,
} from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import type { BriefContent } from "@/stores/types";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface BriefSectionsProps {
  content: BriefContent;
}

/**
 * Renders all of a brief's content sections in clinical-scan order:
 * summary → top concerns → timeline → patterns → medications →
 * questions → flags. Each section only renders when its data is
 * non-empty so the page stays tight when the model returned a
 * sparse brief.
 *
 * Two layers of visual identity break the notebook-uniform feel:
 *   1. A small lucide icon next to the section label, tinted accent
 *      (coral on FLAGS) so each section is identifiable at a glance.
 *   2. Per-section content treatment — pill chips for medications,
 *      hanging-question-mark indent for questions, vertical spine
 *      on the timeline, numbered badges for concerns, coral cards
 *      for flags. Adjacent sections never share a visual rhythm.
 */
export const BriefSections: React.FC<BriefSectionsProps> = ({ content }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <>
      {content.summary ? (
        <Section label="SUMMARY" Icon={Sparkles}>
          <Text style={[styles.summary, { color: colors.textPrimary }]}>
            {content.summary}
          </Text>
        </Section>
      ) : null}

      {content.topConcerns.length > 0 && (
        <Section label="TOP CONCERNS" Icon={Target}>
          {content.topConcerns.map((c, i) => (
            <View key={i} style={styles.concernRow}>
              <View style={[styles.concernNum, { backgroundColor: colors.accent + "1A" }]}>
                <Text style={[styles.concernNumText, { color: colors.accent }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.concernLabel, { color: colors.textPrimary }]}>{c.label}</Text>
                <Text style={[styles.concernDetail, { color: colors.textSecondary }]}>
                  {c.detail}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {content.timeline.length > 0 && (
        <Section label="TIMELINE" Icon={Clock}>
          <View style={styles.timelineWrap}>
            {/* Continuous spine connecting the dots — anchors this section
                visually as a "chronology", not a generic list. */}
            <View
              pointerEvents="none"
              style={[styles.timelineSpine, { backgroundColor: colors.accent + "44" }]}
            />
            {content.timeline.map((t, i) => (
              <View key={i} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.bgPrimary,
                    },
                  ]}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                    {t.date}
                  </Text>
                  <Text style={[styles.timelineLine, { color: colors.textPrimary }]}>{t.line}</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>
      )}

      {content.patterns.length > 0 && (
        <Section label="PATTERNS" Icon={Sparkles}>
          {content.patterns.map((p, i) => (
            <View key={i} style={styles.observationRow}>
              <View
                style={[styles.observationDot, { backgroundColor: colors.accent + "33" }]}
              />
              <Text style={[styles.observationText, { color: colors.textPrimary }]}>{p}</Text>
            </View>
          ))}
        </Section>
      )}

      {content.medications.length > 0 && (
        <Section label="MEDICATIONS" Icon={PillIcon}>
          <View style={styles.chipRow}>
            {content.medications.map((m) => (
              <View
                key={m}
                style={[
                  styles.medChip,
                  { backgroundColor: colors.accent + "14", borderColor: colors.accent + "44" },
                ]}
              >
                <Text style={[styles.medChipText, { color: colors.accent }]}>{m}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {content.questions.length > 0 && (
        <Section label="QUESTIONS TO ASK" Icon={HelpCircle}>
          {content.questions.map((q, i) => (
            <View key={i} style={styles.questionRow}>
              <Text style={[styles.questionMark, { color: colors.accent }]}>?</Text>
              <Text style={[styles.questionText, { color: colors.textPrimary }]}>{q}</Text>
            </View>
          ))}
        </Section>
      )}

      {content.flags.length > 0 && (
        <Section label="FLAGS" Icon={AlertTriangle} tone="coral">
          {content.flags.map((f, i) => (
            <View
              key={i}
              style={[
                styles.flagRow,
                { backgroundColor: colors.coral + "12", borderColor: colors.coral + "55" },
              ]}
            >
              <Text style={[styles.flagText, { color: colors.textPrimary }]}>{f}</Text>
            </View>
          ))}
        </Section>
      )}
    </>
  );
};

interface SectionProps {
  label: string;
  Icon: LucideIcon;
  children: React.ReactNode;
  /** Header tint. Default `accent` everywhere except FLAGS, which
   *  uses `coral` to signal urgency. */
  tone?: "accent" | "coral";
}

const Section: React.FC<SectionProps> = ({ label, Icon, children, tone = "accent" }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const headerColor = tone === "coral" ? colors.coral : colors.accent;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon size={moderateScale(14)} color={headerColor} strokeWidth={2.4} />
        <Text style={[styles.sectionLabel, { color: headerColor }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  section: {
    marginTop: theme.spacing.s5,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(7),
    marginBottom: theme.spacing.s2,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
  },

  // SUMMARY
  summary: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },

  // TOP CONCERNS
  concernRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(8),
  },
  concernNum: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },
  concernNumText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
  },
  concernLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(16),
    lineHeight: fontScale(22),
  },
  concernDetail: {
    ...typography.body,
    fontSize: fontScale(15),
    marginTop: 3,
    lineHeight: fontScale(21),
  },

  // TIMELINE
  timelineWrap: {
    position: "relative",
    paddingLeft: moderateScale(2),
  },
  timelineSpine: {
    position: "absolute",
    left: moderateScale(5),
    top: verticalScale(10),
    bottom: verticalScale(10),
    width: 2,
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(6),
  },
  timelineDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginTop: verticalScale(6),
    borderWidth: 2,
  },
  timelineDate: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(11),
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  timelineLine: {
    ...typography.body,
    fontSize: fontScale(15),
    marginTop: 3,
    lineHeight: fontScale(21),
  },

  // PATTERNS — observation rows with a tinted dot, like an open eye
  observationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(10),
    paddingVertical: verticalScale(5),
  },
  observationDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(8),
  },
  observationText: {
    flex: 1,
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
  },

  // MEDICATIONS — pill chips (medications are categorical, not narrative)
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
  medChip: {
    paddingHorizontal: moderateScale(11),
    paddingVertical: verticalScale(6),
    borderRadius: 999,
    borderWidth: 1,
  },
  medChipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(13),
    letterSpacing: 0.1,
  },

  // QUESTIONS TO ASK — hanging-question-mark indent so each line
  // reads as a thing the patient should ask, not a generic bullet.
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(10),
    paddingVertical: verticalScale(5),
  },
  questionMark: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(20),
    lineHeight: fontScale(24),
    width: moderateScale(14),
    textAlign: "center",
  },
  questionText: {
    flex: 1,
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(22),
  },

  // FLAGS — coral cards (kept; coral stripe pairs with these)
  flagRow: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: verticalScale(3),
  },
  flagText: {
    ...typography.body,
    fontSize: fontScale(15),
    lineHeight: fontScale(21),
  },
}));
