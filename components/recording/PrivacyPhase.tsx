import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';

export function PrivacyPhase({ onAccept }: { onAccept: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[typography.h1, { color: colors.textPrimary }]}>
        Before your first recording
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.s4 },
        ]}
      >
        Your voice is transcribed on-device — no audio leaves your phone. You'll
        see the transcript and get to review it before any AI processing
        happens. Only text you approve is sent to our AI provider. This is not
        medical advice.
      </Text>
      <View style={{ marginTop: spacing.s8 }}>
        <Button label="I understand" breathe onPress={onAccept} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.s6,
    justifyContent: 'center',
  },
});
