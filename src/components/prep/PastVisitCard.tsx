import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarCheck, CalendarX, ChevronRight } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { PastVisitRow } from '@/hooks/usePrepRows';
import { hapticLight } from '@/services/haptics';

interface PastVisitCardProps {
  row: PastVisitRow;
  onPress: () => void;
}

/**
 * Compact archive row for a past appointment (attended / missed /
 * cancelled). Tapping opens the full detail screen where the user
 * can re-read the brief they used during the visit or reopen the
 * appointment if they marked it wrong.
 */
export const PastVisitCard: React.FC<PastVisitCardProps> = ({ row, onPress }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const statusMeta = (() => {
    if (row.status === 'attended') {
      return { label: 'Attended', tint: colors.success, Icon: CalendarCheck };
    }
    if (row.status === 'missed') {
      return { label: `Didn't go`, tint: colors.textTertiary, Icon: CalendarX };
    }
    return { label: 'Cancelled', tint: colors.textTertiary, Icon: CalendarX };
  })();
  const StatusIcon = statusMeta.Icon;

  const handlePress = () => {
    hapticLight();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: statusMeta.tint + '1A' }]}>
        <StatusIcon size={moderateScale(16)} color={statusMeta.tint} strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.topRow}>
          <Text
            style={[typography.bodyLarge, styles.doc, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {row.doc}
          </Text>
          <Text
            style={[
              typography.label,
              {
                color: statusMeta.tint,
                fontFamily: 'DMSans_700Bold',
                fontSize: fontScale(10),
                letterSpacing: 0.6,
              },
            ]}
          >
            {statusMeta.label.toUpperCase()}
          </Text>
        </View>
        <Text
          style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}
          numberOfLines={1}
        >
          {row.spec} · {row.dateLabel} · {row.ago}
        </Text>
      </View>

      <ChevronRight size={moderateScale(14)} color={colors.textTertiary} strokeWidth={2} />
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: verticalScale(6),
  },
  iconTile: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    justifyContent: 'space-between',
  },
  doc: {
    ...theme.typography.bodyLarge,
    flex: 1,
    fontFamily: 'DMSans_600SemiBold',
  },
}));
