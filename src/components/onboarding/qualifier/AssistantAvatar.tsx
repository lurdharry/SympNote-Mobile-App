import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { makeStyles, moderateScale, useTheme } from '../../../theme';

/** 28px round gradient tile with a gold sparkle — the assistant's "face". */
export function AssistantAvatar() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.avatar}>
      <LinearGradient
        colors={['#3BA79F', '#1F504E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Sparkles size={moderateScale(12)} color={colors.gold} fill={colors.gold} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  avatar: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
