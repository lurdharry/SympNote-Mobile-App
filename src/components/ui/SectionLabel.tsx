import React from 'react';
import { Text } from 'react-native';
import { typography, useTheme } from '@/theme';

interface SectionLabelProps {
  label: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typography.label,
        {
          color: colors.textTertiary,
          fontFamily: 'DMSans_600SemiBold',
          letterSpacing: 1.1,
          marginBottom: 8,
          textTransform: 'uppercase',
        },
      ]}
    >
      {label}
    </Text>
  );
};
