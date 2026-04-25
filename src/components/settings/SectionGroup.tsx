import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  fontScale,
  makeStyles,
  shadows,
  spacing,
  useTheme,
  verticalScale,
} from '@/theme';
import type { SettingsRow } from '@/hooks/useSettingsSections';
import { SettingsRowItem } from './SettingsRowItem';

interface SectionGroupProps {
  title: string;
  rows: SettingsRow[];
}

export const SectionGroup: React.FC<SectionGroupProps> = ({ title, rows }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>{title}</Text>
      <View
        style={[
          styles.group,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        {rows.map((row, i) => (
          <SettingsRowItem
            key={row.label}
            row={row}
            isLast={i === rows.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  section: {
    paddingHorizontal: spacing.s6,
    marginBottom: spacing.s5,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(11),
    lineHeight: fontScale(14),
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingBottom: verticalScale(8),
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
}));
