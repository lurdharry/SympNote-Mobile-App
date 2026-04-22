import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontScale, makeStyles, moderateScale, scale, useTheme, verticalScale } from '../../theme';

type Props = {
  severity: number;
};

/**
 * Color-coded severity pill. Green for mild, amber for moderate, red for
 * severe.
 */
export const SeverityBadge: React.FC<Props> = ({ severity }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  let tone: 'mild' | 'moderate' | 'severe';
  if (severity <= 3) tone = 'mild';
  else if (severity <= 6) tone = 'moderate';
  else tone = 'severe';

  const toneColor =
    tone === 'mild'
      ? colors.success
      : tone === 'moderate'
      ? colors.warning
      : colors.error;

  const label =
    tone === 'mild' ? 'Mild' : tone === 'moderate' ? 'Moderate' : 'Severe';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: toneColor + '22',
          borderColor: toneColor + '66',
        },
      ]}
    >
      <Text style={[styles.numeral, { color: toneColor }]}>{severity}/10</Text>
      <Text style={[styles.label, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  numeral: {
    fontFamily: 'Fraunces_300Light',
    fontSize: fontScale(22),
    lineHeight: fontScale(22),
    letterSpacing: -0.4,
    marginRight: moderateScale(8),
  },
  label: { ...theme.typography.label, letterSpacing: 0.3 },
}));
