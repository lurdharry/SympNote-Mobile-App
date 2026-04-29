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
import { queryClient } from "../services/queryClient";
import { getOfferingPackages, initRevenueCat } from "../services/subscription";
import { EntitlementProvider } from "../contexts/EntitlementContext";
import { ToastHost, toastConfig } from "../components/ui/Toast";

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
    initRevenueCat();
    // Prefetch the offering so the paywall renders with live prices
    // immediately rather than waiting for the first paywall view to
    // trigger the fetch. Same query key as usePaywallPlans so the
    // hook reads from cache the moment a paywall mounts.
    queryClient.prefetchQuery({
      queryKey: ["paywall-offerings"],
      queryFn: getOfferingPackages,
      staleTime: 1000 * 60 * 5,
    });
  }, []);

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
            <EntitlementProvider>
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
                  <Stack.Screen name="recording/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="clinician/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="brief/[id]" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen
                    name="brief/new"
                    options={{
                      animation: "slide_from_bottom",
                      presentation: "modal",
                      gestureEnabled: true,
                    }}
                  />
                  <Stack.Screen
                    name="paywall"
                    options={{
                      animation: "slide_from_bottom",
                      presentation: "modal",
                      gestureEnabled: true,
                    }}
                  />
                  <Stack.Screen
                    name="record"
                    options={{
                      animation: "fade",
                      presentation: "fullScreenModal",
                    }}
                  />
                  <Stack.Screen
                    name="appointment-new"
                    options={{
                      animation: "slide_from_right",
                    }}
                  />
                </Stack>
              </View>
              <ToastHost config={toastConfig} topOffset={moderateTopOffset} />
            </EntitlementProvider>
          </TransitionProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

const moderateTopOffset = 60;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
export default RootLayout;
