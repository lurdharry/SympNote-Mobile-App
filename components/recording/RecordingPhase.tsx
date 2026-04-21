import React from 'react';
import { Text, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useTheme, spacing, typography } from '../../theme';
import { WaveformCanvas } from '../animated/WaveformCanvas';
import { MicButton } from './MicButton';
import { formatDuration } from '../../utils/date';

type Props = {
  meterSv: SharedValue<number>;
  liveTranscript: string;
  durationSec: number;
  onStop: () => void;
};

export function RecordingPhase({
  meterSv,
  liveTranscript,
  durationSec,
  onStop,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', marginVertical: spacing.s8 }}>
      <MicButton active onPress={onStop} />

      <View style={{ alignItems: 'center', marginTop: spacing.s4 }}>
        <WaveformCanvas level={meterSv} width={260} height={60} active />
        <Text
          style={[
            typography.number,
            {
              color: colors.warning,
              marginTop: spacing.s2,
              fontSize: 15,
            },
          ]}
        >
          {formatDuration(durationSec)}
        </Text>
        {!!liveTranscript && (
          <View style={{ marginTop: spacing.s3, paddingHorizontal: spacing.s4 }}>
            <Text
              style={[
                typography.body,
                {
                  color: colors.textPrimary,
                  textAlign: 'center',
                  minHeight: 22,
                },
              ]}
            >
              {liveTranscript}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          typography.caption,
          { color: colors.textTertiary, marginTop: spacing.s4 },
        ]}
      >
        Tap to finish
      </Text>
    </View>
  );
}
