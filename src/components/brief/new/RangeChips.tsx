import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  useTheme,
  verticalScale,
} from "@/theme";
import { hapticLight } from "@/services/haptics";

export type DateRange = "all" | "7d" | "30d" | "90d";

interface RangeOption {
  id: DateRange;
  label: string;
  days?: number;
}

export const RANGE_OPTIONS: RangeOption[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time" },
];

interface RangeChipsProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
}

/**
 * Date-range filter chips on /brief/new. Drives which recordings are
 * visible in the picker and pre-selected on mount.
 */
export const RangeChips: React.FC<RangeChipsProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>RANGE</Text>
      <View style={styles.row}>
        {RANGE_OPTIONS.map((r) => {
          const active = value === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => {
                hapticLight();
                onChange(r.id);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent + "1A" : "transparent",
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.accent : colors.textPrimary },
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  block: {
    marginTop: theme.spacing.s5,
    gap: theme.spacing.s2,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: fontScale(12),
  },
}));
