import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { hapticLight } from '@/services/haptics';

interface TodayEmptyProps {
  onPress: () => void;
}

export const TodayEmpty: React.FC<TodayEmptyProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.accent + '1A' }]}>
        <Mic size={moderateScale(18)} color={colors.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
        >
          Nothing logged today
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: 2, lineHeight: fontScale(18) },
          ]}
        >
          Tap here or the mic below to log how you're feeling.
        </Text>
      </View>
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
  dashedRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    padding: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(6),
  },
}));
