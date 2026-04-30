import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, typography, useTheme, verticalScale } from '@/theme';
import { hapticLight } from '@/services/haptics';
import type { SettingsRow } from '@/hooks/useSettingsSections';

interface SettingsRowItemProps {
  row: SettingsRow;
  isLast: boolean;
}

export const SettingsRowItem: React.FC<SettingsRowItemProps> = ({ row, isLast }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const content = (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.mascot}>
        <row.Mascot size={moderateScale(36)} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.labelRow}>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, fontFamily: 'DMSans_500Medium' },
            ]}
          >
            {row.label}
          </Text>
          {row.badge && (
            <View style={styles.plusBadge}>
              <LinearGradient
                colors={['#E07A5F', '#F6C06A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text
                style={[
                  typography.caption,
                  { color: '#FFFFFF', fontFamily: 'DMSans_700Bold' },
                ]}
              >
                {row.badge}
              </Text>
            </View>
          )}
        </View>
        {row.value && (
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {row.value}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
    </View>
  );

  if (row.onPress) {
    return (
      <Pressable
        onPress={() => {
          hapticLight();
          row.onPress?.();
        }}
      >
        {content}
      </Pressable>
    );
  }
  return content;
};

const useStyles = makeStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    minHeight: verticalScale(56),
  },
  mascot: {
    width: moderateScale(36),
    height: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  plusBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
}));
