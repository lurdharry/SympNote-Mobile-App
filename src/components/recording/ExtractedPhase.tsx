import React from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import {
  Activity,
  Clock,
  Flame,
  MapPin,
  Pencil,
  Sparkles,
} from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  spacing,
  useTheme,
} from "../../theme";
import { Button } from "../ui/Button";
import { FieldRow } from "./FieldRow";
import { FIELDS, StructuredWithSources, fieldValue } from "./types";
import { RedFlagAlert } from "../clinical/RedFlagAlert";
import { StructuredHeaderCard } from "../clinical/StructuredHeaderCard";
import { ClinicianTagRow } from "./ClinicianTagRow";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { Clinician } from "../../stores/types";

type Props = {
  structured: StructuredWithSources;
  onSave: () => void;
  careTeam: Clinician[];
  selectedClinicians: string[];
  onToggleClinician: (name: string) => void;
};

/**
 * Per-field iconography for the Details section. Each glyph is the
 * shorthand the eye lands on before reading the label/value text —
 * symptom = pulse, location = pin, duration = clock, triggers = flame,
 * notes = pencil.
 *
 * Severity is intentionally absent: it's already the hero of
 * <StructuredHeaderCard> above, repeating it as a row would just be
 * noise. The fields list still includes severity, but the renderer
 * filters it out.
 */
const FIELD_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  symptoms: Activity,
  location: MapPin,
  duration: Clock,
  triggers: Flame,
  notes: Pencil,
};

export const ExtractedPhase: React.FC<Props> = ({
  structured,
  onSave,
  careTeam,
  selectedClinicians,
  onToggleClinician,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotion();

  // Severity is the hero of StructuredHeaderCard — don't repeat it
  // here as a detail row.
  const visibleFields = FIELDS.filter((f) => {
    if (f.key === "severity") return false;
    return fieldValue(structured, f.key).length > 0;
  });
  const hasDetails = visibleFields.length > 0 || !!structured.notes;

  const d = (n: number) => (reduced ? 0 : n);

  // Stagger entrances across the screen so the user reads the result
  // top-to-bottom — header lands first, then the alert, then details,
  // then care team, then the save CTA. Quick enough to feel snappy
  // (~700ms total) but slow enough to feel composed.
  return (
    <View style={{ marginTop: spacing.s6, gap: spacing.s5 }}>
      <Animated.View
        entering={FadeInDown.delay(d(40)).duration(420).easing(Easing.out(Easing.cubic))}
      >
        <StructuredHeaderCard structured={structured} />
      </Animated.View>

      {structured.redFlags.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(d(180)).duration(420).easing(Easing.out(Easing.cubic))}
        >
          <RedFlagAlert items={structured.redFlags} />
        </Animated.View>
      ) : null}

      {hasDetails ? (
        <Animated.View
          entering={FadeInDown.delay(d(320)).duration(420).easing(Easing.out(Easing.cubic))}
          style={styles.detailsBlock}
        >
          <View style={styles.eyebrowRow}>
            <Sparkles size={12} color={colors.accent} strokeWidth={2.4} />
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
              EXTRACTED DETAILS
            </Text>
          </View>
          <View style={styles.detailsList}>
            {visibleFields.map((f) => (
              <FieldRow
                key={f.key}
                Icon={FIELD_ICONS[f.key]}
                label={f.label}
                value={fieldValue(structured, f.key)}
                active
              />
            ))}
            {structured.notes ? (
              <FieldRow
                Icon={FIELD_ICONS.notes}
                label="Notes"
                value={structured.notes}
                active
              />
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(d(460)).duration(420).easing(Easing.out(Easing.cubic))}
      >
        <ClinicianTagRow
          careTeam={careTeam}
          selected={selectedClinicians}
          onToggle={onToggleClinician}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(d(600)).duration(420).easing(Easing.out(Easing.cubic))}
      >
        <Button label="Save to your record" breathe haptic="heavy" onPress={onSave} />
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  detailsBlock: {
    gap: theme.spacing.s3,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  sectionEyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  detailsList: {
    gap: 0,
  },
}));
