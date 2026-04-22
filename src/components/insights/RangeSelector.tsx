import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, moderateScale, scale, shadows, typography, useTheme, verticalScale } from '@/theme';
import { hapticLight } from '@/services/haptics';
import { RANGES } from '@/constants/insights';
import type { InsightsRange } from '@/utils/insights';

interface RangeSelectorProps {
  range: InsightsRange;
  onChange: (range: InsightsRange) => void;
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({ range, onChange }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgMuted }]}>
      {RANGES.map((r) => {
        const active = r === range;
        return (
          <Pressable
            key={r}
            onPress={() => {
              hapticLight();
              onChange(r);
            }}
            style={[
              styles.btn,
              active && { backgroundColor: colors.bgSurface, ...shadows.card },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: active ? colors.accent : colors.textSecondary,
                  fontFamily: 'DMSans_600SemiBold',
                },
              ]}
            >
              {r}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    padding: moderateScale(4),
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  btn: {
    height: verticalScale(32),
    paddingHorizontal: scale(14),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
