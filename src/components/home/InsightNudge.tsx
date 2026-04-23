import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  shadows,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { hapticLight } from '@/services/haptics';

export interface NudgeData {
  name: string;
  count: number;
  trend: 'up' | 'flat' | 'down';
}

interface InsightNudgeProps {
  nudge: NudgeData;
  onPress: () => void;
}

const trendSuffix = (trend: NudgeData['trend']): string => {
  if (trend === 'up') return 'trending up';
  if (trend === 'down') return 'easing off';
  return 'this month';
};

export const InsightNudge: React.FC<InsightNudgeProps> = ({ nudge, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const iconBg =
    nudge.trend === 'up'
      ? colors.coral + '22'
      : nudge.trend === 'down'
        ? colors.success + '22'
        : colors.accent + '22';

  const TrendIcon =
    nudge.trend === 'up' ? TrendingUp : nudge.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    nudge.trend === 'up'
      ? colors.coral
      : nudge.trend === 'down'
        ? colors.success
        : colors.accent;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.border,
          marginTop: spacing.s4,
        },
        shadows.card,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <TrendIcon size={16} color={trendColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, fontFamily: 'DMSans_500Medium' },
          ]}
        >
          {nudge.name} logged {nudge.count}× {trendSuffix(nudge.trend)}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          See pattern in Insights
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
