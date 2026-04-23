import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stethoscope } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { SPECIALTIES, Specialty } from '@/constants/specialties';
import { hapticLight } from '@/services/haptics';

interface CareTeamEmptyProps {
  /**
   * Fires when the user taps a specialty shortcut. The parent opens the
   * add sheet pre-pointed at the picked specialty so the user only has
   * to type a name.
   */
  onPickSpecialty: (s: Specialty) => void;
}

/** Specialties surfaced as shortcut chips. Primary care leads. */
const SHORTCUT_IDS = [
  'primary-care',
  'cardiology',
  'neurology',
  'psychiatry',
  'dermatology',
  'ob-gyn',
  'other',
];

const SHORTCUTS: Specialty[] = SHORTCUT_IDS.map(
  (id) => SPECIALTIES.find((s) => s.id === id)!,
);

export const CareTeamEmpty: React.FC<CareTeamEmptyProps> = ({ onPickSpecialty }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const handlePick = (s: Specialty) => {
    hapticLight();
    onPickSpecialty(s);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.heroTile}>
        <LinearGradient
          colors={['#3BA79F', '#1F504E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Stethoscope size={moderateScale(28)} color="#FFFFFF" strokeWidth={1.8} />
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        Start with who you see most.
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Tap a specialty to add a clinician. You can add more later.
      </Text>

      <View style={styles.chipsRow}>
        {SHORTCUTS.map((s) => {
          const Icon = s.Icon;
          return (
            <Pressable
              key={s.id}
              onPress={() => handlePick(s)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: colors.bgPrimary,
                  borderColor: pressed ? s.grad[1] : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${s.label}`}
            >
              <View style={[styles.chipTile, { backgroundColor: s.grad[1] + '1F' }]}>
                <Icon size={moderateScale(12)} color={s.grad[1]} strokeWidth={2.2} />
              </View>
              <Text
                style={[
                  typography.label,
                  {
                    color: colors.textPrimary,
                    fontFamily: 'DMSans_600SemiBold',
                    fontSize: fontScale(12),
                  },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(20),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  heroTile: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s4,
  },
  headline: {
    ...theme.typography.h3,
    fontFamily: 'Fraunces_500Medium',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: moderateScale(6),
    marginBottom: spacing.s5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipTile: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
