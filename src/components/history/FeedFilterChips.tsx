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
import type { FeedFilter } from "@/hooks/useHistoryData";

interface FeedFilterChipsProps {
  filter: FeedFilter;
  onChange: (next: FeedFilter) => void;
  notesCount: number;
  briefsCount: number;
}

interface ChipDef {
  v: FeedFilter;
  label: string;
  count: number;
}

/**
 * Kind-filter chips at the top of the History feed. Three options:
 * All / Notes / Briefs. Counts surface inline so the user knows
 * exactly how much each filter narrows down to.
 */
export const FeedFilterChips: React.FC<FeedFilterChipsProps> = ({
  filter,
  onChange,
  notesCount,
  briefsCount,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const chips: ChipDef[] = [
    { v: "all", label: "All", count: notesCount + briefsCount },
    { v: "notes", label: "Notes", count: notesCount },
    { v: "briefs", label: "Briefs", count: briefsCount },
  ];

  return (
    <View style={styles.row}>
      {chips.map((c) => {
        const active = filter === c.v;
        return (
          <Pressable
            key={c.v}
            onPress={() => {
              hapticLight();
              onChange(c.v);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.accent + "1A" : "transparent",
                borderColor: active ? colors.accent : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.accent : colors.textPrimary },
              ]}
            >
              {c.label}
            </Text>
            <Text
              style={[
                styles.count,
                { color: active ? colors.accent : colors.textTertiary },
              ]}
            >
              {c.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: "row",
    gap: moderateScale(8),
    paddingHorizontal: theme.spacing.s6,
    paddingVertical: theme.spacing.s2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  label: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: -0.05,
  },
  count: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(12),
    letterSpacing: 0.2,
  },
}));
