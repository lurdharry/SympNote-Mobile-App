import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { moderateScale, useTheme } from "@/theme";
import { hapticLight } from "@/services/haptics";

interface BackButtonProps {
  onPress: () => void;
  color?: string;
  /**
   * 'contained' shows the circular background
   * 'minimal' just shows the icon with a press effect
   */
  type?: "contained" | "minimal";
  style?: StyleProp<ViewStyle>;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  color,
  type = "minimal",
  style,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    hapticLight();
    onPress();
  };

  const isContained = type === "contained";

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={isContained ? 10 : 16}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [
        styles.base,
        isContained && styles.contained,
        isContained && { backgroundColor: colors.bgMuted },
        // Visual feedback for pressing
        pressed && { opacity: 0.7, backgroundColor: colors.bgMuted },
        style,
      ]}
    >
      <ArrowLeft
        size={moderateScale(isContained ? 20 : 22)}
        color={color ?? colors.textPrimary}
        strokeWidth={2.5}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  contained: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
});
