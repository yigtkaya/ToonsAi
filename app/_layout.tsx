import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import Onboarding from "@/components/Onboarding";
import { UserProvider } from "@/lib/auth/UserContext";
import PaywallController from "@/components/PaywallController";

// Keep the splash screen visible while we check onboarding status
SplashScreen.preventAutoHideAsync();

// This function is available to support hiding the system navigation bar on Android if needed
// It's not directly used in the layout but could be called from screens if desired
const configureAndroidSystemNavBar = (visible: boolean = true) => {
  if (Platform.OS === "android") {
    try {
      // Import needed only on Android
      const { StatusBar } = require("react-native");

      if (!visible) {
        // Hide the system navigation bar
        StatusBar.setTranslucent(true);
        if (Platform.Version >= 19) {
          // For Android 4.4 (API 19) and higher
          const UIManager = require("react-native").UIManager;
          if (UIManager) {
            const { Constants } = UIManager;
            const statusBarHeight = StatusBar.currentHeight || 0;

            if (Constants && statusBarHeight > 0) {
              // Set system UI flags to hide navigation bar
              // This is a low-level API approach
              StatusBar.setBackgroundColor("transparent");
            }
          }
        }
      } else {
        // Show the system navigation bar
        StatusBar.setTranslucent(false);
      }
    } catch (error) {
      console.error("Error configuring Android system navigation bar:", error);
    }
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem("onboardingCompleted");
        setIsOnboardingComplete(value === "true");
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Default to showing onboarding if there's an error
        setIsOnboardingComplete(false);
      }
    }

    if (loaded) {
      checkOnboarding();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && isOnboardingComplete !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isOnboardingComplete]);

  // If fonts aren't loaded or onboarding status is unknown, return null
  if (!loaded || isOnboardingComplete === null) {
    return null;
  }

  // If onboarding isn't complete, show onboarding screens
  if (!isOnboardingComplete) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <UserProvider>
          <Onboarding onComplete={() => setIsOnboardingComplete(true)} />
          <StatusBar style="auto" />
        </UserProvider>
      </ThemeProvider>
    );
  }

  // Normal app flow if onboarding is complete
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="(modals)/paywall"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
                headerShown: false,
              }}
            />
          </Stack>
          <PaywallController />
          <StatusBar style="auto" />
        </UserProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
