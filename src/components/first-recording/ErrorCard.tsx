import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  radius,
  shadows,
  typography,
  useTheme,
} from '@/theme';

interface ErrorCardProps {
  message: string;
  retryInSec: number;
  onRetry: () => void;
  onStartOver: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  message,
  retryInSec,
  onRetry,
  onStartOver,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const disabled = retryInSec > 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <Text
        style={[
          typography.label,
          {
            color: colors.coral,
            letterSpacing: 0.8,
            marginBottom: 6,
            fontFamily: 'DMSans_700Bold',
          },
        ]}
      >
        STRUCTURING FAILED
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, lineHeight: fontScale(20), marginBottom: 12 },
        ]}
      >
        {message}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onRetry}
          disabled={disabled}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: disabled ? colors.bgMuted : colors.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              typography.label,
              {
                color: disabled ? colors.textTertiary : '#FFFFFF',
                fontFamily: 'DMSans_600SemiBold',
              },
            ]}
          >
            {disabled ? `Retry in ${retryInSec}s` : 'Retry'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onStartOver}
          style={({ pressed }) => [
            styles.action,
            {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.bgPrimary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              typography.label,
              { color: colors.textPrimary, fontFamily: 'DMSans_600SemiBold' },
            ]}
          >
            Start over
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.s4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
}));
