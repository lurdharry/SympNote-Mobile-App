import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, typography } from '../../theme';
import { MicButton } from './MicButton';
import { hapticLight } from '../../services/haptics';

const PROMPTS = [
  'My knee has been hurting when I climb stairs...',
  "I've been getting headaches in the afternoon...",
  'I feel more tired than usual...',
];

type Props = {
  onStart: () => void;
  onTypeInstead?: () => void;
};

export function IdlePhase({ onStart, onTypeInstead }: Props) {
  const { colors } = useTheme();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % PROMPTS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View>
      <View style={{ minHeight: 56, marginTop: spacing.s3 }}>
        <Text
          key={idx}
          style={[typography.body, { color: colors.textTertiary }]}
        >
          {PROMPTS[idx]}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginVertical: spacing.s8 }}>
        <MicButton active={false} onPress={onStart} />
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginTop: spacing.s4 },
          ]}
        >
          Tap to record
        </Text>

        {onTypeInstead && (
          <Pressable
            onPress={() => {
              hapticLight();
              onTypeInstead();
            }}
            style={{ marginTop: spacing.s5, padding: spacing.s2 }}
            hitSlop={8}
          >
            <Text
              style={[
                typography.label,
                {
                  color: colors.accent,
                  textDecorationLine: 'underline',
                  letterSpacing: 0.3,
                },
              ]}
            >
              Or type instead
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
