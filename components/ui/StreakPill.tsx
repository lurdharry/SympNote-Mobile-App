import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flame, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Gold flame + day count pill. `compact` is for top-chrome use
 * (smaller, with a white border so it reads as an add-on).
 */
type StreakProps = {
  days?: number;
  compact?: boolean;
};

export function StreakPill({ days = 5, compact = false }: StreakProps) {
  return (
    <View
      style={[
        styles.pill,
        compact && styles.compact,
        compact && { borderColor: '#FFFFFF', borderWidth: 2 },
      ]}
    >
      <LinearGradient
        colors={['#FFE0B2', '#F6C06A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Flame size={compact ? 10 : 12} color="#B45309" fill="#B45309" />
      <Text
        style={[
          styles.text,
          { color: '#7C2D12', fontSize: compact ? 10 : 12 },
        ]}
      >
        {days}
      </Text>
    </View>
  );
}

/**
 * Teal + gold XP pill — accent bolt + XP count.
 */
type XPProps = { xp?: number };

export function XPPill({ xp = 340 }: XPProps) {
  return (
    <View style={[styles.pill, { backgroundColor: '#2C6E6B' }]}>
      <Zap size={10} color="#FFE6B0" fill="#FFE6B0" />
      <Text style={[styles.text, { color: '#FFFFFF', fontSize: 12 }]}>
        {xp} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  text: {
    fontFamily: 'Inter_700Bold',
  },
});
