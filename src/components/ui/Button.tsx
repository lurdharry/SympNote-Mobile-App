import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { BreathingButton } from "../animated/BreathingButton";
import { makeStyles, moderateScale, useTheme, verticalScale } from "../../theme";
import { hapticLight, hapticMedium, hapticHeavy } from "../../services/haptics";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  haptic?: "light" | "medium" | "heavy" | "none";
  breathe?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  size?: "md" | "lg";
};

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = "primary",
  haptic = "medium",
  breathe = false,
  disabled,
  loading,
  style,
  fullWidth = true,
  size = "lg",
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const bg =
    variant === "primary"
      ? colors.accent
      : variant === "secondary"
        ? colors.bgSurface
        : variant === "destructive"
          ? colors.error
          : "transparent";

  const fg = variant === "primary" || variant === "destructive" ? "#FFFFFF" : colors.textPrimary;

  const borderColor = variant === "secondary" ? colors.border : "transparent";

  const handle = () => {
    if (haptic === "light") hapticLight();
    else if (haptic === "medium") hapticMedium();
    else if (haptic === "heavy") hapticHeavy();
    onPress?.();
  };

  return (
    <BreathingButton
      breathe={breathe}
      disabled={disabled || loading}
      onPress={handle}
      hapticOnPress="none"
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          height: size === "lg" ? verticalScale(56) : verticalScale(48),
          opacity: disabled ? 0.55 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        )}
      </View>
    </BreathingButton>
  );
};

const useStyles = makeStyles((theme) => ({
  btn: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.s6,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  label: {
    ...theme.typography.label,
    letterSpacing: 0.26,
  },
}));
