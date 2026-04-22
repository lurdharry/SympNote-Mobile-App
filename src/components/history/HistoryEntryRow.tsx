import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  scale,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { TagChip } from '@/components/ui/TagChip';
import type { HistoryItem } from '@/constants/demo/history';

interface HistoryEntryRowProps {
  entry: HistoryItem;
  isFirst: boolean;
}

export const HistoryEntryRow: React.FC<HistoryEntryRowProps> = ({ entry, isFirst }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.row,
        !isFirst && {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.meta}>
        <View style={styles.inline}>
          <Mic size={10} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            {entry.time}
          </Text>
          <Text style={[typography.label, { color: colors.textTertiary }]}>·</Text>
          <Text style={[typography.label, { color: colors.textTertiary }]}>
            {entry.dur}
          </Text>
        </View>
        <View style={styles.tags}>
          {entry.tags.map((tg) => (
            <TagChip key={tg.t} label={tg.t} color={tg.c} />
          ))}
        </View>
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, marginTop: 6, lineHeight: fontScale(20) },
        ]}
      >
        {entry.text}
      </Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
  },
}));
