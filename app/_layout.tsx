import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import Onboarding from "@/components/Onboarding";
import { UserProvider } from "@/lib/auth/UserContext";
import { Colors } from "@/constants/Colors";

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

function TabBarWithInsets() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          height: "auto",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          // Add bottom padding according to insets for Android navigation bar
          ...Platform.select({
            android: {
              paddingBottom: Math.max(10, insets.bottom),
              height: 60 + Math.max(0, insets.bottom),
            },
          }),
        },
        tabBarActiveTintColor: colors.tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Modal screens hidden from tab bar */}
      <Tabs.Screen
        name="paywall"
        options={{
          href: null, // hide from tab bar
        }}
      />
    </Tabs>
  );
}

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
          <TabBarWithInsets />
          <StatusBar style="auto" />
        </UserProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
