import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  typography,
  useTheme,
} from '@/theme';

interface TranscriptCardProps {
  text: string;
  /**
   * When true (use during live recording) the card scrolls to the
   * bottom every time `text` changes, so the user always sees the
   * latest words as they're transcribed. Card is always read-only —
   * editing happens on the summary screen.
   */
  autoScrollToEnd?: boolean;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({
  text,
  autoScrollToEnd = false,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!autoScrollToEnd) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [text, autoScrollToEnd]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.border },
        shadows.card,
      ]}
    >
      <View style={styles.header}>
        <Mic size={12} color={colors.textTertiary} />
        <Text
          style={[
            typography.label,
            { color: colors.textTertiary, letterSpacing: 0.8 },
          ]}
        >
          TRANSCRIPT
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <Text
          style={[
            typography.body,
            { color: colors.textPrimary, lineHeight: fontScale(22) },
          ]}
          selectable
        >
          {text}
        </Text>
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  scroll: {
    flex: 1,
  },
}));
