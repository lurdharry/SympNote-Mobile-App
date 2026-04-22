import React from 'react';
import { Text, View } from 'react-native';
import { fontScale, makeStyles, moderateScale, typography, useTheme, verticalScale } from '@/theme';
import type { ConcernDemo } from '@/constants/demo/prep';

interface ConcernRowProps {
  concern: ConcernDemo;
  accent: string;
}

const severityTone = (sev: number, accent: string): string => {
  if (sev >= 7) return '#E07A5F';
  if (sev >= 5) return '#D97706';
  return accent;
};

export const ConcernRow: React.FC<ConcernRowProps> = ({ concern, accent }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const tone = severityTone(concern.sev, accent);

  return (
    <View style={[styles.row, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            {concern.t}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {concern.s}
          </Text>
        </View>
        <Text style={[styles.sevValue, { color: tone }]}>
          {concern.sev}/10
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
        <View
          style={{
            width: `${concern.sev * 10}%`,
            height: '100%',
            backgroundColor: tone,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
  },
  sevValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(11),
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: verticalScale(6),
    borderRadius: 999,
    overflow: 'hidden',
  },
}));
