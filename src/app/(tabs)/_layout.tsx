import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  fontScale,
  makeStyles,
  moderateScale,
  shadows,
  useTheme,
  verticalScale,
} from "../../theme";
import { hapticSelect } from "../../services/haptics";
import { TABS } from "../../constants/tabs";

/**
 * Modern tab bar — replaces the early-iOS hairline + underline style.
 * Active tab gets an accent-tinted pill behind the icon (icon turns
 * white) and the label sits below in accent. Inactive tabs are quiet
 * neutrals. No shared indicator — each tab owns its own active
 * affordance.
 */
const TabsLayout: React.FC = () => {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bgPrimary },
        animation: "fade",
      }}
      tabBar={({ state, navigation }) => {
        const activeIndex = state.index;
        return (
          <View style={styles.wrap}>
            <BlurView
              intensity={30}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgSurface + "F2" }]} />
            <SafeAreaView
              edges={[]}
              style={{ paddingBottom: moderateScale(bottom ? bottom / 3 : 10) }}
            >
              <View style={styles.bar}>
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
                      accessibilityRole="button"
                      accessibilityLabel={cfg.label}
                      accessibilityState={{ selected: isActive }}
                      style={styles.tab}
                    >
                      <View
                        style={[
                          styles.iconPill,
                          isActive && [
                            { backgroundColor: colors.accent },
                            shadows.accentGlow,
                          ],
                        ]}
                      >
                        <cfg.Icon
                          size={moderateScale(20)}
                          color={isActive ? "#FFFFFF" : colors.textTertiary}
                          strokeWidth={isActive ? 2.4 : 2}
                        />
                      </View>
                      <Text
                        style={[
                          styles.label,
                          {
                            color: isActive ? colors.accent : colors.textTertiary,
                            fontFamily: isActive ? "DMSans_700Bold" : "DMSans_500Medium",
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
      <Tabs.Screen name="settings" />
    </Tabs>
  );
};

export default TabsLayout;

const useStyles = makeStyles((theme) => ({
  wrap: {
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    height: verticalScale(64),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.s2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(3),
    position: "relative",
  },
  iconPill: {
    width: moderateScale(48),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: fontScale(10),
    letterSpacing: 0.2,
  },
}));
