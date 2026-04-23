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

export const ReviewPhase: React.FC<Props> = ({
  text,
  onChange,
  durationSec,
  onProcess,
  onDiscard,
  error,
  retryInSec = 0,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const blocked = retryInSec > 0;
  const continueLabel = blocked ? `Try again in ${retryInSec}s` : 'Continue';

  return (
    <View style={{ marginTop: spacing.s5 }}>
      <Text style={styles.caption}>{formatDuration(durationSec)} captured · tap to edit</Text>
      <View style={styles.box}>
        <TextInput
          value={text}
          onChangeText={onChange}
          multiline
          placeholder="Your words will appear here…"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>Couldn't process that</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      )}

      <View style={{ marginTop: spacing.s5 }}>
        <Button
          label={continueLabel}
          onPress={onProcess}
          haptic="medium"
          disabled={blocked}
        />
        <View style={{ height: spacing.s3 }} />
        <Button
          label="Start over"
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
