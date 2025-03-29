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

import { useColorScheme } from "@/hooks/useColorScheme";
import Onboarding from "@/components/Onboarding";
import { UserProvider } from "@/lib/auth/UserContext";

// Keep the splash screen visible while we check onboarding status
SplashScreen.preventAutoHideAsync();

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
      <UserProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </UserProvider>
    </ThemeProvider>
  );
}
