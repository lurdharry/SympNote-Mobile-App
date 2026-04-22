import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { moderateScale, useTheme } from "@/theme";
import { hapticLight } from "@/services/haptics";

interface BackButtonProps {
  onPress: () => void;
  color?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, color }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.bgMuted }]}
    >
      <ArrowLeft size={moderateScale(22)} color={color ?? colors.textPrimary} strokeWidth={2} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    padding: moderateScale(8),
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});
