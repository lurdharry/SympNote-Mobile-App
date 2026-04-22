import React from 'react';
import { StyleSheet, View } from 'react-native';
import { makeStyles, moderateScale, scale, verticalScale } from '../../../theme';
import { TypingDots } from '../../ui/TypingDots';
import { AssistantAvatar } from './AssistantAvatar';

/** Bot message bubble containing the "…" typing indicator. */
export function TypingBubble() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <AssistantAvatar />
      <View style={styles.bubble}>
        <TypingDots />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(8),
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderRadius: theme.radius.lg,
    borderTopLeftRadius: moderateScale(6),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: theme.colors.bgSurface,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
}));
