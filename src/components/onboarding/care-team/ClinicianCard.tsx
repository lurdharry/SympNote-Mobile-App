import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X as XIcon } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
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
