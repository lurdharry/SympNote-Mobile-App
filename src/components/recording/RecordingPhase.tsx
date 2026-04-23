import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import {
  fontScale,
  makeStyles,
  typography,
  useTheme,
  verticalScale,
} from '../../theme';
import { MicOrb } from '../first-recording/MicOrb';
import { WaveformCanvas } from '../animated/WaveformCanvas';
import { TranscriptCard } from '../first-recording/TranscriptCard';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { formatDuration } from '../../utils/date';

type Props = {
  meterSv: SharedValue<number>;
  liveTranscript: string;
  durationSec: number;
  onStop: () => void;
};

const WAVE_WIDTH = Math.min(Dimensions.get('window').width - 64, 320);

/**
 * Active recording scene. MicOrb acts as both visualizer and stop button.
 * Live waveform renders off the JS thread via the meter SharedValue, and
 * the transcript streams into a scrollable card below.
 */
export const RecordingPhase: React.FC<Props> = ({
  meterSv,
  liveTranscript,
  durationSec,
  onStop,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduced = useReducedMotion();

  return (
    <View style={styles.root}>
      <View style={styles.orbSlot}>
        <MicOrb phase="recording" onPress={onStop} reduced={reduced} />
      </View>

      <Text style={[styles.duration, { color: colors.coral }]}>
        {formatDuration(durationSec)}
      </Text>

      <View style={styles.waveSlot}>
        <WaveformCanvas
          level={meterSv}
          width={WAVE_WIDTH}
          height={verticalScale(48)}
          barCount={32}
          colors={['#C45C3F', 'rgba(196,92,63,0.08)']}
        />
      </View>

      {!!liveTranscript && (
        <View style={styles.transcriptSlot}>
          <TranscriptCard text={liveTranscript} autoScrollToEnd />
        </View>
      )}

      <Text style={[typography.caption, styles.caption, { color: colors.textTertiary }]}>
        Tap orb to finish
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.s4,
  },
  orbSlot: {
    marginBottom: theme.spacing.s4,
  },
  duration: {
    ...theme.typography.numberEditorial,
    fontSize: fontScale(24),
    lineHeight: fontScale(26),
  },
  waveSlot: {
    marginTop: theme.spacing.s4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptSlot: {
    flex: 1,
    alignSelf: 'stretch',
    marginTop: theme.spacing.s4,
    minHeight: verticalScale(110),
  },
  caption: {
    marginTop: theme.spacing.s3,
  },
}));
