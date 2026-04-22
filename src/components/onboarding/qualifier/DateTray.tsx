import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'lucide-react-native';
import { makeStyles, spacing, useTheme } from '../../../theme';
import { Option } from '../../../constants/onboarding';

type Props = {
  onAnswer: (o: Option) => void;
  disabled: boolean;
};

/** Answer UI for the appointment-date question — a prefilled 7-days-out
 *  card plus "Not scheduled" escape hatch. */
export function DateTray({ onAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const scheduled = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);
  const dateLabel = scheduled.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={{ gap: spacing.s2 }}>
      <View style={styles.card}>
        <View style={styles.iconTile}>
          <Calendar size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Appointment date</Text>
          <Text style={styles.dateValue}>{dateLabel}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.caption}>in</Text>
          <Text style={styles.countdown}>7 days</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.s2 }}>
        <Pressable
          onPress={() => onAnswer({ t: 'Not scheduled yet', v: 'none' })}
          disabled={disabled}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { opacity: pressed || disabled ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Not scheduled yet"
        >
          <Text style={styles.secondaryLabel}>Not scheduled</Text>
        </Pressable>
        <Pressable
          onPress={() => onAnswer({ t: dateLabel, v: 'scheduled' })}
          disabled={disabled}
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: pressed || disabled ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Use ${dateLabel}`}
        >
          <LinearGradient
            colors={['#3BA79F', '#2C6E6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.primaryLabel}>Use this date →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent + '1A',
  },
  label: { ...theme.typography.label, color: theme.colors.textTertiary },
  dateValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  caption: { ...theme.typography.caption, color: theme.colors.textTertiary },
  countdown: {
    ...theme.typography.h3,
    color: theme.colors.accent,
    marginTop: 2,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgMuted,
  },
  secondaryLabel: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  primaryBtn: {
    flex: 2,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryLabel: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
}));
