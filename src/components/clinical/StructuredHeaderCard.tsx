import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontScale, makeStyles, moderateScale, verticalScale } from "@/theme";
import { SeverityBadge } from "./SeverityBadge";
import { UrgencyChip } from "./UrgencyChip";
import type { StructuredEntry } from "@/stores/types";

/**
 * The "your note, parsed" card. Renders the top-of-record summary
 * the user sees on the /record confirm phase: severity badge,
 * urgency chip, body system, and the first few symptom chips.
 *
 * Shared between two surfaces:
 *   • /record's <ExtractedPhase> — full record-then-save flow
 *   • /onboarding/first-brief's <BriefReveal> — the aha moment,
 *     where the structured fields read as "AI is reading my words"
 *     more concretely than a synthesized brief can.
 *
 * Takes the base `StructuredEntry` shape so it works without source-
 * phrase metadata (which only the /record path attaches).
 */
export interface StructuredHeaderCardProps {
  structured: Pick<
    StructuredEntry,
    "severity" | "urgency" | "bodySystem" | "symptoms"
  >;
}

export const StructuredHeaderCard: React.FC<StructuredHeaderCardProps> = ({
  structured,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <SeverityBadge severity={structured.severity} />
        <UrgencyChip urgency={structured.urgency} />
      </View>
      {structured.bodySystem ? (
        <View style={styles.bodySystemSlot}>
          <Text style={styles.sectionLabel}>Body system</Text>
          <Text style={styles.bodySystem}>{structured.bodySystem}</Text>
        </View>
      ) : null}
      {structured.symptoms.length > 0 ? (
        <View style={styles.symptomRow}>
          {structured.symptoms.slice(0, 4).map((s) => (
            <View key={s} style={styles.symptomChip}>
              <Text style={styles.symptomText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s3,
    flexWrap: "wrap",
  },
  bodySystemSlot: {
    marginTop: theme.spacing.s3,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    letterSpacing: 0.3,
  },
  bodySystem: {
    ...theme.typography.serifHeadline,
    color: theme.colors.textPrimary,
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
    marginTop: moderateScale(4),
  },
  symptomRow: {
    marginTop: theme.spacing.s3,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
  symptomChip: {
    backgroundColor: theme.colors.bgMuted,
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: verticalScale(4),
    borderRadius: theme.radius.full,
  },
  symptomText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
  },
}));
