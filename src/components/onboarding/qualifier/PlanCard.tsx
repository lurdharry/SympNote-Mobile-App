import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { makeStyles, moderateScale, scale, useTheme, verticalScale } from '../../../theme';
import { PlanItem } from '../../../constants/onboarding';
import { PlanRow } from './PlanRow';

type Props = {
  items: PlanItem[];
  total: number;
};

/** "Your Sympnote plan" card pinned under the top bar. Empty state
 *  shows placeholder copy; each answered question adds a PlanRow. */
export function PlanCard({ items, total }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[colors.bgSurface, '#FDFBF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <View style={styles.headerTile}>
          <LinearGradient
            colors={['#2C6E6B', '#1F504E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={moderateScale(10)} color={colors.gold} fill={colors.gold} />
        </View>
        <Text style={styles.heading}>YOUR SYMPNOTE PLAN</Text>
        <Text style={styles.counter}>
          {items.length}/{total}
        </Text>
      </View>
      <View style={styles.body}>
        {items.length === 0 ? (
          <Text style={styles.emptyCopy}>
            Tell me a bit about you — I'll build this as we go.
          </Text>
        ) : (
          items.map((p, i) => (
            <PlanRow key={`${p.title}-${i}`} item={p} index={i} />
          ))
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(6),
  },
  headerTile: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(6),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentDark,
  },
  heading: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1.2,
  },
  counter: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingHorizontal: scale(14),
    paddingBottom: verticalScale(12),
    minHeight: verticalScale(60),
    gap: moderateScale(6),
  },
  emptyCopy: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
}));
