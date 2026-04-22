import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontScale, scale, useTheme, verticalScale } from '@/theme';

interface TagChipProps {
  label: string;
  color?: string;
}

/**
 * Inline `#tag` pill. Tinted at 15% alpha of the tag color; text uses
 * the full tag color. Falls back to bg-muted / text-secondary when no
 * color is provided.
 */
export const TagChip: React.FC<TagChipProps> = ({ label, color }) => {
  const { colors } = useTheme();
  const tint = color ? color + '26' : colors.bgMuted;
  const fg = color ?? colors.textSecondary;
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <Text style={[styles.text, { color: fg }]}>#{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: fontScale(11),
    lineHeight: fontScale(14),
  },
});
