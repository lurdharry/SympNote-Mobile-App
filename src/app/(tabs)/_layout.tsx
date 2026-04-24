import React, { useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Tabs } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { makeStyles, moderateScale, spacing, useTheme, verticalScale } from "../../theme";
import { hapticSelect } from "../../services/haptics";
import { TABS } from "../../constants/tabs";
import { SharedTabIndicator } from "../../components/animated/SharedTabIndicator";

const TabsLayout: React.FC = () => {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const { bottom } = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

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
              <View style={styles.bar} onLayout={onBarLayout}>
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
                      <cfg.Icon size={moderateScale(22)} color={tint} strokeWidth={2} />
                      <Text
                        style={[
                          styles.label,
                          {
                            color: tint,
                            fontFamily: isActive ? "DMSans_600SemiBold" : "DMSans_400Regular",
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
                    count={state.routes.length}
                    activeIndex={activeIndex}
                    containerWidth={barWidth - spacing.s3 * 2}
                    leftOffset={spacing.s3}
                    color={colors.accent}
                    height={verticalScale(2.5)}
                    widthRatio={0.35}
                    bottomInset={verticalScale(56)}
                  />
                )}
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
};

export default TabsLayout;

const useStyles = makeStyles((theme) => ({
  wrap: {
    overflow: "hidden",
  },
  bar: {
    flexDirection: "row",
    height: verticalScale(60),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.s3,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(2),
    position: "relative",
  },
  label: { ...theme.typography.caption },
}));
