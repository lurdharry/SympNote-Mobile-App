import React from "react";
import { Pressable, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { makeStyles, moderateScale, typography, useTheme } from "@/theme";

interface AddClinicianRowProps {
  onPress: () => void;
}

/**
 * Trailing dashed-border card in the clinician list on
 * /appointment-new. Opens the same AddClinicianSheet the onboarding
 * flow uses.
 */
export const AddClinicianRow: React.FC<AddClinicianRowProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.bgSurface }]}
    >
      <View style={[styles.iconTile, { backgroundColor: colors.bgMuted }]}>
        <Plus size={moderateScale(18)} color={colors.accent} strokeWidth={2.4} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[typography.h3, { color: colors.textPrimary, fontFamily: "DMSans_600SemiBold" }]}
        >
          Add someone new
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>
          Pick specialty, enter their name.
        </Text>
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
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
  iconTile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
}));
