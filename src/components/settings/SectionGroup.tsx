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
  voiceOnly: boolean;
  setVoiceOnly: (value: boolean) => void;
}

export const SectionGroup: React.FC<SectionGroupProps> = ({
  title,
  rows,
  voiceOnly,
  setVoiceOnly,
}) => {
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
            voiceOnly={voiceOnly}
            setVoiceOnly={setVoiceOnly}
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
    fontFamily: 'DMSans_600SemiBold',
    fontSize: fontScale(13),
    lineHeight: fontScale(16),
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingBottom: verticalScale(8),
  },
  group: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
}));
