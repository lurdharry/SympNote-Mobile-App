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
import type { Clinician } from "@/stores/types";

interface AudienceChipsProps {
  careTeam: Clinician[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * "Share with" audience chips on /brief/new — Everyone (active when
 * none selected) plus one chip per care-team member. Tap to toggle.
 * Hidden entirely when the user has no clinicians yet.
 */
export const AudienceChips: React.FC<AudienceChipsProps> = ({ careTeam, selected, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (careTeam.length === 0) return null;

  const everyoneActive = selected.length === 0;
  const toggle = (id: string) => {
    hapticLight();
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>SHARE WITH</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            hapticLight();
            onChange([]);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: everyoneActive ? colors.accent + "1A" : "transparent",
              borderColor: everyoneActive ? colors.accent : colors.border,
              borderStyle: everyoneActive ? "solid" : "dashed",
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: everyoneActive ? colors.accent : colors.textTertiary },
            ]}
          >
            Everyone
          </Text>
        </Pressable>
        {careTeam.map((c) => {
          const active = selected.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
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
                {c.name}
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
