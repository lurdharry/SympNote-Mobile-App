import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, moderateScale, verticalScale } from '../../theme';
import { VoiceReactiveOrb } from './VoiceReactiveOrb';
import { hapticLight } from '../../services/haptics';
import { RECORDING_PROMPTS as PROMPTS } from '../../constants/prompts';

type Props = {
  onStart: () => void;
  onTypeInstead?: () => void;
};

export const IdlePhase: React.FC<Props> = ({ onStart, onTypeInstead }) => {
  const styles = useStyles();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % PROMPTS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View>
      <View style={styles.promptSlot}>
        <Text key={idx} style={styles.prompt}>
          {PROMPTS[idx]}
        </Text>
      </View>

      <View style={styles.orbArea}>
        <VoiceReactiveOrb active={false} onPress={onStart} size={moderateScale(220)} />
        <Text style={styles.caption}>Tap to record</Text>

        {onTypeInstead && (
          <Pressable
            onPress={() => {
              hapticLight();
              onTypeInstead();
            }}
            style={styles.typePress}
            hitSlop={8}
          >
            <Text style={styles.typeText}>Or type instead</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  promptSlot: { minHeight: verticalScale(56), marginTop: theme.spacing.s3 },
  prompt: { ...theme.typography.body, color: theme.colors.textTertiary },
  orbArea: { alignItems: 'center', marginVertical: theme.spacing.s10 },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.s5,
  },
  typePress: { marginTop: theme.spacing.s5, padding: theme.spacing.s2 },
  typeText: {
    ...theme.typography.label,
    color: theme.colors.accent,
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
  },
}));
