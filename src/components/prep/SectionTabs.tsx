import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, moderateScale, typography, useTheme, verticalScale } from '@/theme';
import { PREP_SECTION_TABS, PrepSectionId } from '@/constants/prep';
import { hapticLight } from '@/services/haptics';

interface SectionTabsProps {
  value: PrepSectionId;
  onChange: (value: PrepSectionId) => void;
  accent: string;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({ value, onChange, accent }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.tabs, { backgroundColor: colors.bgMuted }]}>
      {PREP_SECTION_TABS.map((t) => {
        const active = value === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              hapticLight();
              onChange(t.id);
            }}
            style={[styles.tab, active && { backgroundColor: accent }]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: active ? '#FFFFFF' : colors.textSecondary,
                  fontFamily: 'DMSans_600SemiBold',
                },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  tabs: {
    flexDirection: 'row',
    padding: moderateScale(4),
    borderRadius: theme.radius.full,
    gap: moderateScale(4),
  },
  tab: {
    flex: 1,
    height: verticalScale(36),
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
