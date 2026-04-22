import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mic, Pill } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { TagChip } from '@/components/ui/TagChip';
import type { DemoEntry } from '@/constants/demo/home';

interface TimelineCardProps {
  entries: DemoEntry[];
}

interface TimelineRowProps {
  entry: DemoEntry;
  isFirst: boolean;
  dotColor: string;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ entry, isFirst, dotColor }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.row,
        !isFirst && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.timeCol}>
        <Text
          style={[
            typography.body,
            {
              color: colors.textPrimary,
              fontFamily: 'DMSans_600SemiBold',
              fontVariant: ['tabular-nums'],
              lineHeight: fontScale(18),
            },
          ]}
        >
          {entry.time}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {entry.period}
        </Text>
      </View>
      <View style={[styles.rail, { backgroundColor: colors.border }]}>
        <View
          style={[styles.dot, { backgroundColor: dotColor, borderColor: '#FFFFFF' }]}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <View style={styles.meta}>
          {entry.kind === 'voice' ? (
            <View style={styles.metaInline}>
              <Mic size={10} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {entry.dur}
              </Text>
            </View>
          ) : (
            <View style={styles.metaInline}>
              <Pill size={10} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                Medication
              </Text>
            </View>
          )}
          <View style={styles.tags}>
            {entry.tags.map((tg) => (
              <TagChip key={tg.t} label={tg.t} color={tg.c} />
            ))}
          </View>
        </View>
        <Text
          style={[
            typography.body,
            {
              color: colors.textPrimary,
              marginTop: 4,
              lineHeight: fontScale(20),
            },
          ]}
        >
          {entry.text}
        </Text>
      </View>
    </View>
  );
};

export const TimelineCard: React.FC<TimelineCardProps> = ({ entries }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      {entries.map((e, i) => (
        <TimelineRow
          key={i}
          entry={e}
          isFirst={i === 0}
          dotColor={e.kind === 'med' ? '#5A8F6E' : colors.accent}
        />
      ))}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  timeCol: {
    width: scale(46),
    alignItems: 'flex-end',
    paddingTop: moderateScale(2),
  },
  rail: {
    width: 1,
    alignSelf: 'stretch',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    left: -3.5,
    top: moderateScale(6),
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    borderWidth: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
  },
}));
