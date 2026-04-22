import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../../theme';
import { Option } from '../../../constants/onboarding';

type Props = {
  options: Option[];
  onAnswer: (o: Option) => void;
  disabled: boolean;
};

/** Row of tappable chips — the default answer UI for multiple-choice questions. */
export function ChipTray({ options, onAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {options.map((opt) => (
        <Pressable
          key={opt.v}
          onPress={() => onAnswer(opt)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            {
              borderColor: pressed ? colors.accent : colors.border,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={opt.t}
        >
          <Text style={styles.label}>{opt.t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
}));
