import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  fontScale,
  makeStyles,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { splitHighlighted } from '@/utils/highlightTranscript';

interface TranscriptCardProps {
  transcript: string;
  sourcePhrases: Record<string, string>;
  scanning: boolean;
  scanPhase: SharedValue<number>;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({
  transcript,
  sourcePhrases,
  scanning,
  scanPhase,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const segments = useMemo(
    () => splitHighlighted(transcript, sourcePhrases),
    [transcript, sourcePhrases],
  );

  const [height, setHeight] = useState(0);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanPhase.value * Math.max(0, height - 20) }],
    opacity: scanning ? 0.7 : 0,
  }));

  return (
    <View
      style={styles.card}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <Text
        style={[
          typography.bodyLarge,
          {
            color: colors.textPrimary,
            fontSize: fontScale(17),
            lineHeight: fontScale(26),
          },
        ]}
      >
        {segments.map((seg, i) =>
          seg.highlighted ? (
            <Text
              key={i}
              style={{
                backgroundColor: colors.accentLight + '66',
                color: colors.textPrimary,
              }}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          ),
        )}
      </Text>

      {height > 0 && (
        <Animated.View pointerEvents="none" style={[styles.scanOverlay, scanStyle]}>
          <Canvas style={{ width: '100%', height: verticalScale(20) }}>
            <Rect x={0} y={0} width={1000} height={verticalScale(20)}>
              <LinearGradient
                start={vec(0, 10)}
                end={vec(1000, 10)}
                colors={[
                  'rgba(44,110,107,0)',
                  'rgba(44,110,107,0.35)',
                  'rgba(44,110,107,0)',
                ]}
              />
              <BlurMask blur={6} style="normal" />
            </Rect>
          </Canvas>
        </Animated.View>
      )}
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.s5,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
  },
  scanOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: verticalScale(20),
  },
}));
