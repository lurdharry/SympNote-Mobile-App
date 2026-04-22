import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Inline `#tag` pill. Tinted at 15% alpha of the tag color; text uses
 * the full tag color. Falls back to bg-muted / text-secondary when no
 * color is provided.
 */
type Props = {
  label: string;
  color?: string;
};

export function TagChip({ label, color }: Props) {
  const { colors } = useTheme();
  const tint = color ? color + '26' : colors.bgMuted; // 0x26 ~ 15%
  const fg = color ?? colors.textSecondary;
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <Text style={[styles.text, { color: fg }]}>#{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
  },
});
