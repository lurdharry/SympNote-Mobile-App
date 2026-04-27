import React from "react";
import { Text, View } from "react-native";
import { makeStyles, spacing } from "../../theme";
import { Button } from "../ui/Button";
import { FieldRow } from "./FieldRow";
import { FIELDS, StructuredWithSources, fieldValue } from "./types";
import { RedFlagAlert } from "../clinical/RedFlagAlert";
import { StructuredHeaderCard } from "../clinical/StructuredHeaderCard";
import { ClinicianTagRow } from "./ClinicianTagRow";
import type { Clinician } from "../../stores/types";

type Props = {
  structured: StructuredWithSources;
  onSave: () => void;
  careTeam: Clinician[];
  selectedClinicians: string[];
  onToggleClinician: (name: string) => void;
};

export const ExtractedPhase: React.FC<Props> = ({
  structured,
  onSave,
  careTeam,
  selectedClinicians,
  onToggleClinician,
}) => {
  const styles = useStyles();

  // Only render fields that actually have a value. Severity is hidden
  // when the patient reported no symptom (header already says so);
  // location/duration/triggers/symptoms hide when their string value
  // is empty.
  const visibleFields = FIELDS.filter((f) => {
    if (f.key === "severity") return structured.severity > 0;
    return fieldValue(structured, f.key).length > 0;
  });
  const hasDetails = visibleFields.length > 0 || !!structured.notes;

  return (
    <View style={{ marginTop: spacing.s6, gap: spacing.s5 }}>
      <StructuredHeaderCard structured={structured} />

      {structured.redFlags.length > 0 && <RedFlagAlert items={structured.redFlags} />}

      {hasDetails && (
        <View style={{ gap: spacing.s3 }}>
          <Text style={styles.sectionLabel}>Details</Text>
          {visibleFields.map((f) => (
            <FieldRow key={f.key} label={f.label} value={fieldValue(structured, f.key)} active />
          ))}
          {structured.notes ? <FieldRow label="Notes" value={structured.notes} active /> : null}
        </View>
      )}

      <ClinicianTagRow
        careTeam={careTeam}
        selected={selectedClinicians}
        onToggle={onToggleClinician}
      />

      <Button label="Save entry" breathe haptic="heavy" onPress={onSave} />
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    letterSpacing: 0.3,
  },
}));
