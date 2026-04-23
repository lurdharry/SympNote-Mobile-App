import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, typography, useTheme } from '../../theme';
import { MicOrb } from '../first-recording/MicOrb';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticLight } from '../../services/haptics';
import { RECORDING_PROMPTS as PROMPTS } from '../../constants/prompts';

type Props = {
  onStart: () => void;
  onTypeInstead?: () => void;
};

export const IdlePhase: React.FC<Props> = ({ onStart, onTypeInstead }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % PROMPTS.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.root}>
      <Text style={[typography.body, styles.prompt, { color: colors.textTertiary }]}>
        {PROMPTS[idx]}
      </Text>

      <View style={styles.orbSlot}>
        <MicOrb phase="idle" onPress={onStart} reduced={reduced} />
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Tap to record
      </Text>

      {onTypeInstead && (
        <Pressable
          onPress={() => {
            hapticLight();
            onTypeInstead();
          }}
          style={styles.typePress}
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
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.s4,
  },
  prompt: {
    textAlign: 'center',
    fontStyle: 'italic',
    minHeight: theme.spacing.s6,
  },
  orbSlot: {
    marginTop: theme.spacing.s6,
    marginBottom: theme.spacing.s5,
  },
  typePress: {
    marginTop: theme.spacing.s5,
    padding: theme.spacing.s2,
  },
}));
