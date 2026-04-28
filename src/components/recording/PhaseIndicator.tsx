import React from "react";
import { Text, View } from "react-native";
import { fontScale, makeStyles, moderateScale, useTheme } from "@/theme";
import type { Phase } from "./types";

const STEP_ORDER: { label: string; phase: Phase }[] = [
  { label: "Write", phase: "review" },
  { label: "Analyze", phase: "extracting" },
  { label: "Confirm", phase: "extracted" },
];

const indexForPhase = (phase: Phase): number => {
  const idx = STEP_ORDER.findIndex((step) => step.phase === phase);
  return idx === -1 ? 0 : idx;
};

interface PhaseIndicatorProps {
  phase: Phase;
}

/**
 * Top-bar progress indicator on /record. Three dots — past phases
 * fade to a low-opacity accent, the active phase widens into a pill
 * with its label, future phases stay neutral. One source of truth
 * for the order so phase transitions stay coherent.
 */
export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const active = indexForPhase(phase);
  return (
    <View style={styles.row}>
      {STEP_ORDER.map((step, i) => {
        const isActive = i === active;
        const isPast = i < active;
        return (
          <View key={step.label} style={styles.cell}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isActive
                    ? colors.accent
                    : isPast
                      ? colors.accent + "66"
                      : colors.border,
                  width: isActive ? moderateScale(20) : moderateScale(6),
                },
              ]}
            />
            {isActive && (
              <Text style={[styles.label, { color: colors.accent }]}>{step.label}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  dot: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
}));
