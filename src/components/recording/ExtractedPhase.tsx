import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontScale, makeStyles, moderateScale, spacing, verticalScale } from '../../theme';
import { Button } from '../ui/Button';
import { FieldRow } from './FieldRow';
import { FIELDS, StructuredWithSources, fieldValue } from './types';
import { SeverityBadge } from '../clinical/SeverityBadge';
import { UrgencyChip } from '../clinical/UrgencyChip';
import { RedFlagAlert } from '../clinical/RedFlagAlert';
import { ClinicianTagPicker } from './ClinicianTagPicker';
import type { Clinician } from '../../stores/types';

type Props = {
  structured: StructuredWithSources;
  onSave: () => void;
  careTeam: Clinician[];
  clinicianName: string | null;
  onClinicianChange: (name: string | null) => void;
};

export const ExtractedPhase: React.FC<Props> = ({
  structured,
  onSave,
  careTeam,
  clinicianName,
  onClinicianChange,
}) => {
  const styles = useStyles();
  return (
    <View style={{ marginTop: spacing.s6, gap: spacing.s5 }}>
      <Header structured={structured} />

      {structured.redFlags.length > 0 && (
        <RedFlagAlert items={structured.redFlags} />
      )}

      <View style={{ gap: spacing.s3 }}>
        <Text style={styles.sectionLabel}>Details</Text>
        {FIELDS.map((f) => (
          <FieldRow
            key={f.key}
            label={f.label}
            value={fieldValue(structured, f.key)}
            active
          />
        ))}
        {structured.notes ? (
          <FieldRow label="Notes" value={structured.notes} active />
        ) : null}
      </View>

      <ClinicianTagPicker
        careTeam={careTeam}
        selected={clinicianName}
        onChange={onClinicianChange}
      />

      <Button label="Save entry" breathe haptic="heavy" onPress={onSave} />
    </View>
  );
}

interface HeaderProps {
  structured: StructuredWithSources;
}

const Header: React.FC<HeaderProps> = ({ structured }) => {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <SeverityBadge severity={structured.severity} />
        <UrgencyChip urgency={structured.urgency} />
      </View>
      {!!structured.bodySystem && (
        <View style={{ marginTop: spacing.s3 }}>
          <Text style={styles.sectionLabel}>Body system</Text>
          <Text style={styles.bodySystem}>{structured.bodySystem}</Text>
        </View>
      )}
      {structured.symptoms.length > 0 && (
        <View style={styles.symptomRow}>
          {structured.symptoms.slice(0, 4).map((s) => (
            <View key={s} style={styles.symptomChip}>
              <Text style={styles.symptomText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  header: {
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
