import React from 'react';
import { Text, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useTheme, spacing, typography } from '../../theme';
import { VoiceReactiveOrb } from './VoiceReactiveOrb';
import { formatDuration } from '../../utils/date';

type Props = {
  meterSv: SharedValue<number>;
  liveTranscript: string;
  durationSec: number;
  onStop: () => void;
};

/**
 * Active recording scene. The VoiceReactiveOrb does double duty as both
 * the visualizer AND the stop button — no separate waveform bar, no
 * separate affordance. The live transcript streams underneath.
 */
export function RecordingPhase({
  meterSv,
  liveTranscript,
  durationSec,
  onStop,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', marginVertical: spacing.s8 }}>
      <VoiceReactiveOrb active meterSv={meterSv} onPress={onStop} size={240} />

      <Text
        style={[
          typography.numberEditorial,
          {
            color: colors.warning,
            marginTop: spacing.s5,
            fontSize: 24,
            lineHeight: 26,
          },
        ]}
      >
        {formatDuration(durationSec)}
      </Text>

      {!!liveTranscript && (
        <View
          style={{ marginTop: spacing.s4, paddingHorizontal: spacing.s4 }}
        >
          <Text
            style={[
              typography.bodyLarge,
              {
                color: colors.textPrimary,
                textAlign: 'center',
                minHeight: 26,
                fontSize: 18,
                lineHeight: 26,
              },
            ]}
          >
            {liveTranscript}
          </Text>
        </View>
      )}

      <Text
        style={[
          typography.caption,
          { color: colors.textTertiary, marginTop: spacing.s5 },
        ]}
      >
        Tap to finish
      </Text>
    </View>
  );
}
