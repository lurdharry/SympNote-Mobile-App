import React from 'react';
import { Text, View } from 'react-native';
import { Pill } from 'lucide-react-native';
import { makeStyles, moderateScale, spacing, typography, useTheme } from '@/theme';
import type { MedDemo } from '@/constants/demo/prep';

interface MedsSectionProps {
  meds: MedDemo[];
  accent: string;
}

interface MedRowProps {
  med: MedDemo;
  accent: string;
}

const MedRow: React.FC<MedRowProps> = ({ med, accent }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.row, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.icon, { backgroundColor: accent + '22' }]}>
        <Pill size={18} color={accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
          ]}
        >
          {med.name} · {med.dose}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          {med.freq} · Last: {med.last}
        </Text>
      </View>
    </View>
  );
};

export const MedsSection: React.FC<MedsSectionProps> = ({ meds, accent }) => {
  const { colors } = useTheme();

  if (meds.length === 0) {
    return (
      <Text
        style={[
          typography.body,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            paddingVertical: spacing.s6,
          },
        ]}
      >
        No medications logged.
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {meds.map((m, i) => (
        <MedRow key={`${i}-${m.name}`} med={m} accent={accent} />
      ))}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(12),
    borderRadius: theme.radius.md,
  },
  icon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
