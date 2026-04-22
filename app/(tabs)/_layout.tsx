import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Clipboard, History, Home, LineChart } from 'lucide-react-native';
import { useTheme, spacing, typography } from '../../theme';
import { hapticSelect } from '../../services/haptics';

/**
 * Bottom tab bar — per design handoff.
 *
 *  - 4 tabs: Home · Prep · Insights · History (Settings is a modal from
 *    the Home avatar, NOT a tab)
 *  - Lucide stroke icons, 22px
 *  - Active state: top-aligned accent rule (40×2, rounded) + accent icon
 *    + 600-weight label
 *  - Hairline top border on a blurred bg-surface surface (95% opacity)
 */
const TABS = [
  { name: 'home',     label: 'Home',     Icon: Home },
  { name: 'prep',     label: 'Prep',     Icon: Clipboard },
  { name: 'insights', label: 'Insights', Icon: LineChart },
  { name: 'history',  label: 'History',  Icon: History },
] as const;

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

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
          <View style={styles.wrap}>
            <BlurView
              intensity={30}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.bgSurface + 'F2' },
              ]}
            />
            <SafeAreaView edges={['bottom']}>
              <View style={[styles.bar, { borderTopColor: colors.border }]}>
                {state.routes.map((route, i) => {
                  const isActive = i === activeIndex;
                  const cfg = TABS.find((t) => t.name === route.name);
                  if (!cfg) return null;
                  const tint = isActive ? colors.accent : colors.textTertiary;
                  return (
                    <Pressable
                      key={route.key}
                      onPress={() => {
                        if (!isActive) {
                          hapticSelect();
                          navigation.navigate(route.name);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={cfg.label}
                      accessibilityState={{ selected: isActive }}
                      style={styles.tab}
                    >
                      {isActive && (
                        <View
                          style={[
                            styles.activeRule,
                            { backgroundColor: colors.accent },
                          ]}
                        />
                      )}
                      <cfg.Icon size={22} color={tint} strokeWidth={2} />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: tint,
                            fontFamily: isActive
                              ? 'Inter_600SemiBold'
                              : 'Inter_400Regular',
                          },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SafeAreaView>
          </View>
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="prep" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.s3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
  },
  activeRule: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 2,
    borderRadius: 1,
  },
});
