import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles, moderateScale, useTheme, verticalScale } from '../../../theme';

type Props = {
  step: number;
  total: number;
};

/** Segmented progress strip — fully filled past, half-filled current,
 *  empty future. */
export const ProgressBar: React.FC<Props> = ({ step, total }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: colors.bgMuted }]}
        >
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#3BA79F', '#2C6E6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: i < step ? '100%' : i === step ? '50%' : '0%',
                height: '100%',
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: moderateScale(4),
  },
  segment: {
    flex: 1,
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
}));
