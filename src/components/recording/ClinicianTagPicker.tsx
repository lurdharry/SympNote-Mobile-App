import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { findSpecialty } from '@/constants/specialties';
import type { Clinician } from '@/stores/types';
import { hapticLight } from '@/services/haptics';

interface ClinicianTagPickerProps {
  careTeam: Clinician[];
  selected: string | null;
  onChange: (name: string | null) => void;
}

/**
 * Optional clinician tagger shown below the extracted fields on the
 * record flow. Lets the user mark this entry as "for Dr. Chen" so the
 * visit-brief generator can prefer it over the generic 30-day window
 * when drafting that doctor's next brief. Tapping a chip toggles; tap
 * again to untag. When the care team is empty the picker renders
 * nothing (no affordance to offer).
 */
export const ClinicianTagPicker: React.FC<ClinicianTagPickerProps> = ({
  careTeam,
  selected,
  onChange,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (careTeam.length === 0) return null;

  const pick = (name: string) => {
    hapticLight();
    onChange(selected === name ? null : name);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Users size={moderateScale(12)} color={colors.textTertiary} strokeWidth={2.2} />
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, fontFamily: 'DMSans_700Bold', letterSpacing: 0.8 },
          ]}
        >
          TAG FOR CLINICIAN
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginLeft: 'auto', fontStyle: 'italic' },
          ]}
        >
          Optional
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {careTeam.map((c, i) => {
          const active = selected === c.name;
          const specialty = findSpecialty(c.role);
          return (
            <Pressable
              key={`${c.name}-${i}`}
              onPress={() => pick(c.name)}
              style={[
                styles.chip,
                {
                  borderColor: active ? specialty.grad[1] : colors.border,
                  backgroundColor: active ? specialty.grad[1] + '14' : colors.bgSurface,
                },
              ]}
            >
              <View style={styles.chipTile}>
                <LinearGradient
                  colors={specialty.grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={{ minWidth: 0 }}>
                <Text
                  style={[
                    typography.label,
                    {
                      color: active ? specialty.grad[1] : colors.textPrimary,
                      fontFamily: 'DMSans_600SemiBold',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.textTertiary, fontSize: fontScale(11) }]}
                  numberOfLines={1}
                >
                  {c.role}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  wrap: {
    gap: moderateScale(8),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  row: {
    gap: moderateScale(8),
    paddingRight: spacing.s3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipTile: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    overflow: 'hidden',
  },
}));
