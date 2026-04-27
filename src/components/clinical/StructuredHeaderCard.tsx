import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  fontScale,
  makeStyles,
  moderateScale,
  useTheme,
  verticalScale,
} from "@/theme";
import { SeverityBadge } from "./SeverityBadge";
import { UrgencyChip } from "./UrgencyChip";
import type { StructuredEntry } from "@/stores/types";

/**
 * The "your note, parsed" hero card. Editorial framing meant to feel
 * weighty: a small accent eyebrow, a soft accent gradient wash at
 * the top, severity + urgency in the lead row, the body system as
 * an italic accent serif headline (the magazine title), and the
 * symptom chips along the bottom.
 *
 * Shared between two surfaces:
 *   • /record's <ExtractedPhase> — full record-then-save flow
 *   • /onboarding/first-brief's <BriefReveal> — the aha moment,
 *     where these structured fields read as "AI is reading my
 *     words" more concretely than a synthesized brief can.
 *
 * Takes the base `StructuredEntry` shape so it works without source-
 * phrase metadata (which only the /record path attaches).
 */
export interface StructuredHeaderCardProps {
  structured: Pick<
    StructuredEntry,
    "severity" | "urgency" | "bodySystem" | "symptoms"
  >;
  /**
   * Eyebrow label rendered above the lead row. Defaults to "PARSED";
   * callers can override (e.g. "READING", "JUST IN") when the
   * surrounding screen wants different framing.
   */
  eyebrow?: string;
}

export const StructuredHeaderCard: React.FC<StructuredHeaderCardProps> = ({
  structured,
  eyebrow = "PARSED",
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const showSeverity = structured.severity > 0;
  const showSymptoms = structured.symptoms.length > 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "33" },
      ]}
    >
      {/* Soft accent gradient wash at the top — adds depth without
          competing with the content. */}
      <LinearGradient
        colors={[colors.accent + "1A", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.wash}
        pointerEvents="none"
      />

      <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>

      {(showSeverity || structured.urgency) && (
        <View style={styles.leadRow}>
          {showSeverity ? <SeverityBadge severity={structured.severity} /> : null}
          <UrgencyChip urgency={structured.urgency} />
        </View>
      )}

      {structured.bodySystem ? (
        <View style={styles.bodySystemSlot}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            BODY SYSTEM
          </Text>
          <Text style={[styles.bodySystem, { color: colors.accent }]}>
            {structured.bodySystem}
          </Text>
        </View>
      ) : null}

      {showSymptoms ? (
        <View style={styles.symptomRow}>
          {structured.symptoms.slice(0, 4).map((s) => (
            <View
              key={s}
              style={[
                styles.symptomChip,
                {
                  backgroundColor: colors.accent + "10",
                  borderColor: colors.accent + "33",
                },
              ]}
            >
              <Text style={[styles.symptomText, { color: colors.textPrimary }]}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    position: "relative",
    paddingHorizontal: theme.spacing.s5,
    paddingTop: theme.spacing.s5,
    paddingBottom: theme.spacing.s5,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(80),
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    marginBottom: theme.spacing.s3,
  },
  leadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s3,
    flexWrap: "wrap",
  },
  bodySystemSlot: {
    marginTop: theme.spacing.s4,
  },
  sectionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
  },
  bodySystem: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(26),
    lineHeight: fontScale(32),
    letterSpacing: -0.4,
    marginTop: moderateScale(4),
  },
  symptomRow: {
    marginTop: theme.spacing.s4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
  symptomChip: {
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: verticalScale(5),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  symptomText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
    letterSpacing: -0.05,
  },
}));
