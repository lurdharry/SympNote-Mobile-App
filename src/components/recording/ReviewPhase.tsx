import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { makeStyles, moderateScale, spacing, useTheme, verticalScale } from '../../theme';
import { Button } from '../ui/Button';
import { formatDuration } from '../../utils/date';

type Props = {
  text: string;
  onChange: (v: string) => void;
  durationSec: number;
  onProcess: () => void;
  onDiscard: () => void;
  error?: string | null;
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
  const styles = useStyles();
  const blocked = retryInSec > 0;
  const processLabel = blocked ? `Try again in ${retryInSec}s` : 'Process with AI';

  return (
    <View style={{ marginTop: spacing.s6 }}>
      <Text style={styles.caption}>
        Here's what we heard ({formatDuration(durationSec)})
      </Text>
      <View style={styles.box}>
        <TextInput
          value={text}
          onChangeText={onChange}
          multiline
          placeholder="Your transcript will appear here…"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      </View>
      <Text style={styles.hint}>
        Edit anything that got misheard before we send it to the AI. The
        transcript stays on your device unless you tap Process.
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>AI unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
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

const useStyles = makeStyles((theme) => ({
  caption: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    marginBottom: moderateScale(8),
  },
  box: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  input: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
    padding: theme.spacing.s4,
    minHeight: verticalScale(120),
    textAlignVertical: 'top',
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.s3,
  },
  errorBox: {
    marginTop: theme.spacing.s4,
    padding: theme.spacing.s4,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.bgMuted,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.md,
  },
  errorLabel: { ...theme.typography.label, color: theme.colors.error },
  errorBody: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginTop: moderateScale(4),
  },
}));
