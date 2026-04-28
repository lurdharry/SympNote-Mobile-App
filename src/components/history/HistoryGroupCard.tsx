import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  makeStyles,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { FeedGroup } from '@/hooks/useHistoryData';
import { FeedRow } from './FeedRow';

interface HistoryGroupCardProps {
  group: FeedGroup;
}

export const HistoryGroupCard: React.FC<HistoryGroupCardProps> = ({ group }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text
          style={[
            typography.label,
            {
              color: colors.textTertiary,
              fontFamily: 'DMSans_600SemiBold',
              letterSpacing: 1,
            },
          ]}
        >
          {group.date.toUpperCase()}
        </Text>
        <Text style={[typography.label, { color: colors.textTertiary }]}>
          {group.entries.length}
        </Text>
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurface, borderColor: colors.border },
          shadows.card,
        ]}
      >
        {group.entries.map((entry, i) => (
          <FeedRow key={`${entry.kind}-${entry.id}`} entry={entry} isFirst={i === 0} />
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: theme.spacing.s6,
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    marginHorizontal: theme.spacing.s6,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
}));
