import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { makeStyles, moderateScale, scale, useTheme, verticalScale } from '../../theme';
import { hapticSelect } from '../../services/haptics';
import { TABS } from '../../constants/tabs';

/**
 * Bottom tab bar — 4 tabs (Home, Prep, Insights, History). Settings is
 * a modal from the Home avatar, not a tab.
 */

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();

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
              <View style={styles.bar}>
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
                      {isActive && <View style={styles.activeRule} />}
                      <cfg.Icon size={moderateScale(22)} color={tint} strokeWidth={2} />
                      <Text
                        style={[
                          styles.label,
                          {
                            color: tint,
                            fontFamily: isActive
                              ? 'DMSans_600SemiBold'
                              : 'DMSans_400Regular',
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

const useStyles = makeStyles((theme) => ({
  wrap: { overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    height: verticalScale(60),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.s3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(2),
    position: 'relative',
  },
  activeRule: {
    position: 'absolute',
    top: 0,
    width: scale(40),
    height: verticalScale(2),
    borderRadius: 1,
    backgroundColor: theme.colors.accent,
  },
  label: { ...theme.typography.caption },
}));
