import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, radius, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { FieldRow } from './FieldRow';
import { FIELDS, StructuredWithSources, fieldValue } from './types';
import { SeverityBadge } from '../clinical/SeverityBadge';
import { UrgencyChip } from '../clinical/UrgencyChip';
import { RedFlagAlert } from '../clinical/RedFlagAlert';

type Props = {
  structured: StructuredWithSources;
  onSave: () => void;
};

/**
 * Shown after Gemini structures the transcript. Goes beyond the flat
 * fields: leads with severity + urgency + body system at the top, a red
 * flag alert (if any), then the detail rows below. This is where the user
 * sees the AI isn't just re-listing what they said — it's *classifying*.
 */
export function ExtractedPhase({ structured, onSave }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: spacing.s6, gap: spacing.s5 }}>
      <Header structured={structured} />

      {structured.redFlags.length > 0 && (
        <RedFlagAlert items={structured.redFlags} />
      )}

      <View style={{ gap: spacing.s3 }}>
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, letterSpacing: 0.3 },
          ]}
        >
          Details
        </Text>
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

      <Button
        label="Save entry"
        breathe
        haptic="heavy"
        onPress={onSave}
      />
    </View>
  );
}

function Header({ structured }: { structured: StructuredWithSources }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <SeverityBadge severity={structured.severity} />
        <UrgencyChip urgency={structured.urgency} />
      </View>
      {!!structured.bodySystem && (
        <View style={{ marginTop: spacing.s3 }}>
          <Text
            style={[typography.label, { color: colors.textTertiary, letterSpacing: 0.3 }]}
          >
            Body system
          </Text>
          <Text
            style={[
              typography.serifHeadline,
              {
                color: colors.textPrimary,
                fontSize: 22,
                lineHeight: 28,
                marginTop: 4,
              },
            ]}
          >
            {structured.bodySystem}
          </Text>
        </View>
      )}
      {structured.symptoms.length > 0 && (
        <View style={{ marginTop: spacing.s3, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {structured.symptoms.slice(0, 4).map((s) => (
            <View
              key={s}
              style={{
                backgroundColor: colors.bgMuted,
                paddingHorizontal: spacing.s3,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <Text style={[typography.bodySmall, { color: colors.textPrimary }]}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    flexWrap: 'wrap',
  },
});
