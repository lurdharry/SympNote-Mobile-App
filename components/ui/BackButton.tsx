import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { hapticLight } from '../../services/haptics';

/**
 * 40×40 circular back button with ArrowLeft icon.
 * Transparent by default; pressed state shows bg-muted.
 */
type Props = {
  onPress: () => void;
  color?: string;
};

export function BackButton({ onPress, color }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed }) => [
        styles.btn,
        pressed && { backgroundColor: colors.bgMuted },
      ]}
    >
      <ArrowLeft size={22} color={color ?? colors.textPrimary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
