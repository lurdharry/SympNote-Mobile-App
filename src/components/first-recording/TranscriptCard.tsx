import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { fontScale, makeStyles, moderateScale, shadows, typography, useTheme } from '@/theme';

interface TranscriptCardProps {
  text: string;
  typing: boolean;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({ text, typing }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <Mic size={12} color={colors.textTertiary} />
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, letterSpacing: 0.8 },
          ]}
        >
          TRANSCRIPT
        </Text>
      </View>
      <Text
        style={[
          typography.body,
          { color: colors.textPrimary, lineHeight: fontScale(22) },
        ]}
      >
        {text}
        {typing && <Text style={{ color: colors.accent }}>▍</Text>}
      </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
}));
