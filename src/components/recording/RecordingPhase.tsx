import React from 'react';
import { Text, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { fontScale, makeStyles, moderateScale, verticalScale } from '../../theme';
import { VoiceReactiveOrb } from './VoiceReactiveOrb';
import { formatDuration } from '../../utils/date';

type Props = {
  meterSv: SharedValue<number>;
  liveTranscript: string;
  durationSec: number;
  onStop: () => void;
};

/**
 * Active recording scene. The orb is both the visualizer and stop
 * button. Live transcript streams underneath.
 */
export function RecordingPhase({
  meterSv,
  liveTranscript,
  durationSec,
  onStop,
}: Props) {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <VoiceReactiveOrb active meterSv={meterSv} onPress={onStop} size={moderateScale(240)} />

      <Text style={styles.duration}>{formatDuration(durationSec)}</Text>

      {!!liveTranscript && (
        <View style={styles.transcriptWrap}>
          <Text style={styles.transcript}>{liveTranscript}</Text>
        </View>
      )}

      <Text style={styles.caption}>Tap to finish</Text>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  root: { alignItems: 'center', marginVertical: theme.spacing.s8 },
  duration: {
    ...theme.typography.numberEditorial,
    color: theme.colors.warning,
    marginTop: theme.spacing.s5,
    fontSize: fontScale(24),
    lineHeight: fontScale(26),
  },
  transcriptWrap: {
    marginTop: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s4,
  },
  transcript: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    minHeight: verticalScale(26),
    fontSize: fontScale(18),
    lineHeight: fontScale(26),
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.s5,
  },
}));
