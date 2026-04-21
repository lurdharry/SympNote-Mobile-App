import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme, radius, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';
import { formatDuration } from '../../utils/date';

type Props = {
  text: string;
  onChange: (v: string) => void;
  durationSec: number;
  onProcess: () => void;
  onDiscard: () => void;
  /** Human-readable error from the last process attempt, or null. */
  error?: string | null;
  /** Seconds until retry is allowed (quota backoff). 0 = retry allowed. */
  retryInSec?: number;
};

export function ReviewPhase({
  text,
  onChange,
  durationSec,
  onProcess,
  onDiscard,
  error,
  retryInSec = 0,
}: Props) {
  const { colors } = useTheme();
  const blocked = retryInSec > 0;
  const processLabel = blocked ? `Try again in ${retryInSec}s` : 'Process with AI';

  return (
    <View style={{ marginTop: spacing.s6 }}>
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, marginBottom: 8 },
        ]}
      >
        Here's what we heard ({formatDuration(durationSec)})
      </Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={onChange}
          multiline
          placeholder="Your transcript will appear here…"
          placeholderTextColor={colors.textTertiary}
          style={[
            typography.bodyLarge,
            {
              color: colors.textPrimary,
              padding: spacing.s4,
              minHeight: 120,
              textAlignVertical: 'top',
            },
          ]}
        />
      </View>
      <Text
        style={[
          typography.caption,
          { color: colors.textTertiary, marginTop: spacing.s3 },
        ]}
      >
        Edit anything that got misheard before we send it to the AI. The
        transcript stays on your device unless you tap Process.
      </Text>

      {error && (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: colors.bgMuted,
              borderColor: colors.error,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text style={[typography.label, { color: colors.error }]}>
            AI unavailable
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textPrimary, marginTop: 4 },
            ]}
          >
            {error}
          </Text>
        </View>
      )}

      <View style={{ marginTop: spacing.s5 }}>
        <Button
          label={processLabel}
          onPress={onProcess}
          haptic="medium"
          disabled={blocked}
        />
        <View style={{ height: spacing.s3 }} />
        <Button
          label="Discard & re-record"
          variant="secondary"
          haptic="light"
          onPress={onDiscard}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth },
  errorBox: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
