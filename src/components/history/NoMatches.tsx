import React from 'react';
import { Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';

export const NoMatches: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.bgMuted }]}>
        <Search size={22} color={colors.textTertiary} strokeWidth={2} />
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
        ]}
      >
        No matches
      </Text>
      <Text
        style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}
      >
        Try a different tag or search term
      </Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s10,
    alignItems: 'center',
  },
  icon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
}));
