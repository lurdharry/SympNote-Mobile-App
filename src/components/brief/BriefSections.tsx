import React from "react";
import { Text, View } from "react-native";
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

interface BriefSectionsProps {
  content: BriefContent;
}

/**
 * Renders all of a brief's content sections in clinical-scan order:
 * summary → top concerns → timeline → patterns → medications →
 * questions → flags. Each section only renders when its data is
 * non-empty so the page stays tight when the model returned a
 * sparse brief.
 */
export const BriefSections: React.FC<BriefSectionsProps> = ({ content }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <>
      {content.summary ? (
        <Section label="SUMMARY">
          <Text style={[styles.summary, { color: colors.textPrimary }]}>
            {content.summary}
          </Text>
        </Section>
      ) : null}

      {content.topConcerns.length > 0 && (
        <Section label="TOP CONCERNS">
          {content.topConcerns.map((c, i) => (
            <View key={i} style={styles.concernRow}>
              <View style={[styles.concernNum, { backgroundColor: colors.accent + "1A" }]}>
                <Text style={[styles.concernNumText, { color: colors.accent }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.concernLabel, { color: colors.textPrimary }]}>
                  {c.label}
                </Text>
                <Text style={[styles.concernDetail, { color: colors.textSecondary }]}>
                  {c.detail}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {content.timeline.length > 0 && (
        <Section label="TIMELINE">
          {content.timeline.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.accent }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>
                  {t.date}
                </Text>
                <Text style={[styles.timelineLine, { color: colors.textPrimary }]}>
                  {t.line}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {content.patterns.length > 0 && (
        <Section label="PATTERNS">
          {content.patterns.map((p, i) => (
            <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
              · {p}
            </Text>
          ))}
        </Section>
      )}

      {content.medications.length > 0 && (
        <Section label="MEDICATIONS">
          {content.medications.map((m, i) => (
            <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
              · {m}
            </Text>
          ))}
        </Section>
      )}

      {content.questions.length > 0 && (
        <Section label="QUESTIONS TO ASK">
          {content.questions.map((q, i) => (
            <Text key={i} style={[styles.bulletLine, { color: colors.textPrimary }]}>
              · {q}
            </Text>
          ))}
        </Section>
      )}

      {content.flags.length > 0 && (
        <Section label="FLAGS">
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
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ label, children }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
      {children}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  section: { marginTop: theme.spacing.s5 },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s2,
  },
  summary: {
    fontFamily: "Fraunces_400Regular",
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
    letterSpacing: -0.1,
  },
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
  timelineRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    paddingVertical: verticalScale(6),
  },
  timelineDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    marginTop: verticalScale(7),
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
  bulletLine: {
    ...typography.body,
    fontSize: fontScale(16),
    lineHeight: fontScale(24),
    paddingVertical: verticalScale(3),
  },
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
