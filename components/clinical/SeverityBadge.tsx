import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, typography } from '../../theme';

type Props = {
  severity: number; // 1-10
};

/**
 * Color-coded severity pill. Green for mild, amber for moderate, red for
 * severe. Numerical display uses the Fraunces light numeral to match the
 * editorial style of the rest of the app.
 */
export function SeverityBadge({ severity }: Props) {
  const { colors } = useTheme();

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
      <Text
        style={{
          fontFamily: 'Fraunces_300Light',
          fontSize: 22,
          lineHeight: 22,
          color: toneColor,
          letterSpacing: -0.4,
          marginRight: 8,
        }}
      >
        {severity}/10
      </Text>
      <Text
        style={[
          typography.label,
          { color: toneColor, letterSpacing: 0.3 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
});
