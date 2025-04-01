import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Define icon name type
type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TabLayout = function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  // Determine if we're in dark mode
  const isDarkMode = colorScheme === "dark";

  // Define colors that will be used for the tab bar
  const tabBarBackground = isDarkMode ? "#121212" : "#FFFFFF";
  const activeColor = isDarkMode ? "#B38A61" : "#7f5c3c";
  const inactiveColor = isDarkMode ? "#AAAAAA" : "#777777";
  const borderColor = isDarkMode ? "#333333" : "#DDDDDD";

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: isDarkMode ? 15 : 8,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          height: Platform.OS === "ios" ? 85 : 60,
          // Use a fully opaque background for better visibility
          backgroundColor: tabBarBackground,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: isDarkMode ? 0.5 : 0.2,
          shadowRadius: 6,
          // Add bottom padding according to insets for Android navigation bar
          ...Platform.select({
            android: {
              paddingBottom: Math.max(10, insets.bottom),
              height: 60 + Math.max(0, insets.bottom),
            },
            ios: {
              // Add a more visible border for iOS
              borderTopColor: borderColor,
              borderTopWidth: 1,
              paddingBottom: Math.max(25, insets.bottom),
            },
          }),
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 12,
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IconName = "settings-outline";

          if (route.name === "index") {
            iconName = focused ? "sparkles" : "sparkles-outline";
          } else if (route.name === "gallery") {
            iconName = focused ? "images" : "images-outline";
          } else if (route.name === "settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          // Return icon with indicator for active tab
          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Create",
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    paddingBottom: 5,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -10,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
});

export default TabLayout;
