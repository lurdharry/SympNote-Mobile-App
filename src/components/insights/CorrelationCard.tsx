import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import type { DemoCorrelation } from '@/constants/demo/insights';

interface CorrelationCardProps {
  corr: DemoCorrelation;
}

export const CorrelationCard: React.FC<CorrelationCardProps> = ({ corr }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const severityColor = corr.severity === 'strong' ? '#E07A5F' : '#D97706';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.pill, { backgroundColor: '#2C6E6B22' }]}>
          <Text
            style={[
              typography.caption,
              { color: '#2C6E6B', fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            {corr.a}
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary }}>↔</Text>
        <View style={[styles.pill, { backgroundColor: '#E07A5F22' }]}>
          <Text
            style={[
              typography.caption,
              { color: '#E07A5F', fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            {corr.b}
          </Text>
        </View>
        <Text
          style={[
            styles.severity,
            { color: severityColor },
          ]}
        >
          {corr.severity.toUpperCase()}
        </Text>
      </View>

      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, marginTop: 8, lineHeight: fontScale(20) },
        ]}
      >
        {corr.pattern}
      </Text>

      <View style={[styles.track, { backgroundColor: colors.bgMuted }]}>
        <View style={[styles.fill, { width: `${corr.strength * 100}%` }]}>
          <LinearGradient
            colors={['#F6C06A', '#E07A5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  pill: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: theme.radius.full,
  },
  severity: {
    fontFamily: 'DMSans_700Bold',
    fontSize: fontScale(11),
    marginLeft: 'auto',
  },
  track: {
    height: verticalScale(4),
    borderRadius: 999,
    marginTop: verticalScale(8),
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
}));
