import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../../theme';
import { Button } from '../ui/Button';

export function PrivacyPhase({ onAccept }: { onAccept: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Before your first recording</Text>
      <Text style={styles.body}>
        Your voice is transcribed on-device — no audio leaves your phone. You'll
        see the transcript and get to review it before any AI processing
        happens. Only text you approve is sent to our AI provider. This is not
        medical advice.
      </Text>
      <View style={styles.cta}>
        <Button label="I understand" breathe onPress={onAccept} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.s6,
    justifyContent: 'center',
  },
  heading: { ...theme.typography.h1, color: theme.colors.textPrimary },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.s4,
  },
  cta: { marginTop: theme.spacing.s8 },
}));
