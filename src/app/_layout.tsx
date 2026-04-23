import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { Fraunces_300Light, Fraunces_500Medium } from "@expo-google-fonts/fraunces";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useTheme, lightColors, darkColors } from "../theme";
import { TransitionProvider } from "../components/navigation/TransitionContext";
import { RadialWipe } from "../components/navigation/RadialWipe";
import { queryClient } from "../services/queryClient";

SplashScreen.preventAutoHideAsync().catch(() => {});

const RootLayout: React.FC = () => {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_300Light,
    Fraunces_500Medium,
  });
  const { colors, isDark } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bgPrimary).catch(() => {});
  }, [colors.bgPrimary]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? darkColors.bgPrimary : lightColors.bgPrimary,
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <TransitionProvider>
            <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
              <StatusBar style={isDark ? "light" : "dark"} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  animationDuration: 250,
                  contentStyle: { backgroundColor: colors.bgPrimary },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                <Stack.Screen
                  name="recording/[id]"
                  options={{ animation: "fade", presentation: "transparentModal" }}
                />
                <Stack.Screen
                  name="appointment/[id]"
                  options={{ animation: "fade", presentation: "transparentModal" }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    animation: "slide_from_bottom",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="record"
                  options={{
                    animation: "slide_from_bottom",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="appointment-new"
                  options={{
                    animation: "slide_from_bottom",
                    presentation: "modal",
                  }}
                />
              </Stack>
              <RadialWipe />
            </View>
          </TransitionProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
export default RootLayout;
