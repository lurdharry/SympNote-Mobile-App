import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, typography } from '../../theme';
import { SharedTabIndicator } from '../../components/animated/SharedTabIndicator';
import { hapticSelect } from '../../services/haptics';

const TABS = [
  { name: 'home', label: 'Home', icon: '●' },
  { name: 'prep', label: 'Prep', icon: '◆' },
  { name: 'history', label: 'History', icon: '▲' },
] as const;

export default function TabsLayout() {
  const { colors } = useTheme();
  const [barWidth, setBarWidth] = useState(0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bgPrimary },
        animation: 'fade',
      }}
      tabBar={({ state, navigation }) => {
        const activeIndex = state.index;
        return (
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bgSurface }}>
            <View
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              style={[styles.bar, { borderTopColor: colors.border }]}
            >
              {state.routes.map((route, i) => {
                const isActive = i === activeIndex;
                const cfg = TABS.find((t) => t.name === route.name);
                if (!cfg) return null;
                return (
                  <Pressable
                    key={route.key}
                    onPress={() => {
                      if (!isActive) {
                        hapticSelect();
                        navigation.navigate(route.name);
                      }
                    }}
                    style={styles.tab}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        color: isActive ? colors.accent : colors.textTertiary,
                        marginBottom: 2,
                      }}
                    >
                      {cfg.icon}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isActive ? colors.accent : colors.textTertiary,
                        },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
              {barWidth > 0 && (
                <SharedTabIndicator
                  count={TABS.length}
                  activeIndex={activeIndex}
                  containerWidth={barWidth}
                  color={colors.accent}
                  height={3}
                  bottomInset={0}
                />
              )}
            </View>
          </SafeAreaView>
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="prep" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.s3,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s2,
  },
});
