import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X as XIcon } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
import { findSpecialty } from '@/constants/specialties';
import { hapticLight } from '@/services/haptics';

export interface Clinician {
  id: string;
  name: string;
  role: string;
}

interface ClinicianCardProps {
  clinician: Clinician;
  onRemove: (id: string) => void;
}

export const ClinicianCard: React.FC<ClinicianCardProps> = ({
  clinician,
  onRemove,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const specialty = findSpecialty(clinician.role);
  const Icon = specialty.Icon;

  const handleRemove = () => {
    hapticLight();
    onRemove(clinician.id);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.tile}>
        <LinearGradient
          colors={specialty.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon size={moderateScale(20)} color={specialty.fg} strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            typography.h3,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
          numberOfLines={1}
        >
          {clinician.name}
        </Text>
        <Text
          style={[styles.role, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {clinician.role}
        </Text>
      </View>

      <Pressable
        onPress={handleRemove}
        hitSlop={8}
        style={[styles.removeBtn, { backgroundColor: colors.bgMuted }]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${clinician.name}`}
      >
        <XIcon size={moderateScale(14)} color={colors.textTertiary} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(12),
    paddingRight: moderateScale(10),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  role: {
    ...theme.typography.caption,
    fontSize: fontScale(12),
    marginTop: 1,
  },
  removeBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
