import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';
import { DEMO_QUICK_TILES } from '@/constants/demo/home';
import { hapticLight } from '@/services/haptics';
import { SectionLabel } from '@/components/ui/SectionLabel';

export const QuickLogRow: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();

  return (
    <View>
      <SectionLabel label="Quick log" />
      <View style={styles.row}>
        {DEMO_QUICK_TILES.map((q) => (
          <Pressable
            key={q.t}
            onPress={() => {
              hapticLight();
              router.push({
                pathname: '/record',
                params: { kind: q.kind },
              });
            }}
            style={[
              styles.tile,
              { backgroundColor: colors.bgSurface, borderColor: colors.border },
              shadows.card,
            ]}
          >
            <View style={[styles.icon, { backgroundColor: q.c + '22' }]}>
              <q.Icon size={18} color={q.c} strokeWidth={2} />
            </View>
            <Text
              style={[
                typography.label,
                { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
              ]}
            >
              {q.t}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  tile: {
    flex: 1,
    padding: moderateScale(12),
    alignItems: 'center',
    gap: moderateScale(6),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
