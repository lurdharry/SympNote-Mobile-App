import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import {
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from "@/theme";
import { findSpecialty, type Specialty } from "@/constants/specialties";
import type { Clinician } from "@/stores/types";

interface SelectableClinicianRowProps {
  clinician: Clinician;
  selected: boolean;
  onPress: () => void;
}

/**
 * Tap-to-select clinician row on /appointment-new. Mirrors
 * ClinicianCard's visual language (gradient specialty tile + name +
 * role) but with a check pip instead of a remove X — single-select
 * semantics for visit picking.
 */
export const SelectableClinicianRow: React.FC<SelectableClinicianRowProps> = ({
  clinician,
  selected,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const spec: Specialty = findSpecialty(clinician.role);
  const Icon = spec.Icon;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: colors.bgSurface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
        shadows.card,
      ]}
    >
      <View style={styles.specTile}>
        <LinearGradient
          colors={spec.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon size={moderateScale(20)} color={spec.fg} strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[typography.h3, { color: colors.textPrimary, fontFamily: "DMSans_600SemiBold" }]}
          numberOfLines={1}
        >
          {clinician.name}
        </Text>
        <Text
          style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}
          numberOfLines={1}
        >
          {clinician.role}
        </Text>
      </View>

      <View
        style={[
          styles.check,
          {
            backgroundColor: selected ? colors.accent : "transparent",
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        {selected && <Check size={moderateScale(14)} color="#FFFFFF" strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.lg,
  },
  specTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
}));
