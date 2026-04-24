import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { BodySystemSlice } from '@/utils/insights';

interface BodySystemBreakdownCardProps {
  slices: BodySystemSlice[];
}

/**
 * Stacked horizontal bar + ranked list of body systems touched by
 * the user's entries. Skipped when no entry had a body system
 * classified.
 */
export const BodySystemBreakdownCard: React.FC<BodySystemBreakdownCardProps> = ({
  slices,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  if (slices.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.bar}>
        {slices.map((s) => (
          <View
            key={s.name}
            style={{
              width: `${s.pct}%`,
              height: '100%',
              backgroundColor: s.color,
            }}
          />
        ))}
      </View>

      <View style={styles.list}>
        {slices.map((s) => (
          <View key={s.name} style={styles.row}>
            <View style={styles.title}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textPrimary,
                    fontFamily: 'DMSans_500Medium',
                  },
                ]}
                numberOfLines={1}
              >
                {s.name}
              </Text>
            </View>
            <Text
              style={[typography.caption, { color: colors.textTertiary }]}
            >
              {s.pct}% · {s.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    height: verticalScale(10),
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: theme.colors.bgMuted,
  },
  list: {
    marginTop: theme.spacing.s4,
    gap: verticalScale(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
}));
