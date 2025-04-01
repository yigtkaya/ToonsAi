import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/lib/auth/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Theme preferences
type ThemePreference = "light" | "dark" | "system";

const SettingsScreen = function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, hasSubscription, checkSubscription, signOut } = useUser();
  const [saveToCameraRoll, setSaveToCameraRoll] = useState(true);
  const [highQualityDownloads, setHighQualityDownloads] = useState(true);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem("themePreference");
        if (savedPreference) {
          setThemePreference(savedPreference as ThemePreference);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  const saveThemePreference = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem("themePreference", preference);
      setThemePreference(preference);
      setShowThemeModal(false);

      // Note: To actually apply this theme, we'd need to update our app with
      // a custom theme provider that reads from AsyncStorage, which we'll implement next

      // For now, just show a notice that app restart may be needed
      if (preference !== "system") {
        Alert.alert(
          "Theme Changed",
          "Please restart the app for the theme change to fully apply."
        );
      }
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // Clear saved images
  const clearSavedImages = async () => {
    Alert.alert(
      "Clear Saved Images",
      "Are you sure you want to delete all your saved images? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("saved_images");
              Alert.alert("Success", "All saved images have been cleared.");
            } catch (error) {
              console.error("Failed to clear saved images:", error);
              Alert.alert("Error", "Failed to clear saved images.");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to sign in again to use the app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            if (signOut) {
              await signOut();
              // Router would handle redirecting to login screen if needed
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    router.push("/(modals)/paywall");
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => {
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.settingContent}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          <ThemedText style={styles.settingDescription}>
            {description}
          </ThemedText>
        </View>
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </TouchableOpacity>
    );
  };

  const renderThemeModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showThemeModal}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Theme</ThemedText>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themePreference === "system" && styles.selectedThemeOption,
              ]}
              onPress={() => saveThemePreference("system")}
            >
              <Ionicons
                name="phone-portrait"
                size={22}
                color={colors.text}
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <ThemedText style={styles.themeText}>System Default</ThemedText>
                <ThemedText style={styles.themeDescription}>
                  Follow your device settings
                </ThemedText>
              </View>
              {themePreference === "system" && (
                <Ionicons name="checkmark" size={22} color={colors.tint} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themePreference === "light" && styles.selectedThemeOption,
              ]}
              onPress={() => saveThemePreference("light")}
            >
              <Ionicons
                name="sunny"
                size={22}
                color={colors.text}
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <ThemedText style={styles.themeText}>Light</ThemedText>
                <ThemedText style={styles.themeDescription}>
                  Always use light theme
                </ThemedText>
              </View>
              {themePreference === "light" && (
                <Ionicons name="checkmark" size={22} color={colors.tint} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themePreference === "dark" && styles.selectedThemeOption,
              ]}
              onPress={() => saveThemePreference("dark")}
            >
              <Ionicons
                name="moon"
                size={22}
                color={colors.text}
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <ThemedText style={styles.themeText}>Dark</ThemedText>
                <ThemedText style={styles.themeDescription}>
                  Always use dark theme
                </ThemedText>
              </View>
              {themePreference === "dark" && (
                <Ionicons name="checkmark" size={22} color={colors.tint} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: styles.scrollContent.padding + insets.bottom },
        ]}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>

          {renderSettingItem(
            "person-circle",
            "Account Type",
            hasSubscription ? "Premium Account" : "Free Account",
            hasSubscription ? undefined : handleUpgrade,
            hasSubscription ? (
              <View style={styles.badge}>
                <Ionicons name="star" size={14} color="#7f5c3c" />
                <ThemedText style={styles.badgeText}>PRO</ThemedText>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            )
          )}
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App Preferences</ThemedText>

          {renderSettingItem(
            "color-palette",
            "App Theme",
            themePreference === "system"
              ? "System Default"
              : themePreference === "dark"
              ? "Dark Mode"
              : "Light Mode",
            () => setShowThemeModal(true),
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}

          {renderSettingItem(
            "save",
            "Save to Camera Roll",
            "Automatically save generated images to your device",
            () => setSaveToCameraRoll(!saveToCameraRoll),
            <Switch
              value={saveToCameraRoll}
              onValueChange={setSaveToCameraRoll}
              trackColor={{ false: "#767577", true: colors.tint }}
              thumbColor="#f4f3f4"
            />
          )}

          {renderSettingItem(
            "cloud-download",
            "High Quality Downloads",
            "Download images in high resolution",
            () => setHighQualityDownloads(!highQualityDownloads),
            <Switch
              value={highQualityDownloads}
              onValueChange={setHighQualityDownloads}
              trackColor={{ false: "#767577", true: colors.tint }}
              thumbColor="#f4f3f4"
            />
          )}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data Management</ThemedText>
          {renderSettingItem(
            "trash-bin",
            "Clear Saved Images",
            "Delete all saved images from this device",
            clearSavedImages,
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          {renderSettingItem(
            "information-circle",
            "App Version",
            "1.0.0",
            undefined
          )}

          {renderSettingItem(
            "document-text",
            "Privacy Policy",
            "Read our privacy policy",
            () => {
              // Implementation for opening privacy policy
            },
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}

          {renderSettingItem(
            "document-text",
            "Terms of Service",
            "Read our terms of service",
            () => {
              // Implementation for opening terms of service
            },
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}
        </View>

        {/* Sign Out Option */}
        {/* <TouchableOpacity
          style={[styles.signOutButton, { borderColor: "#cc6b5a" }]}
          onPress={handleSignOut}
        >
          <Ionicons
            name="log-out"
            size={20}
            color="#cc6b5a"
            style={styles.signOutIcon}
          />
          <ThemedText style={[styles.signOutText, { color: "#cc6b5a" }]}>
            Sign Out
          </ThemedText>
        </TouchableOpacity> */}
      </ScrollView>

      {renderThemeModal()}
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  rightElement: {
    marginLeft: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(219, 198, 162, 0.25)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b38a61",
  },
  badgeText: {
    color: "#7f5c3c",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cc6b5a",
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: "#cc6b5a",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20, // Extra padding for iOS
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
  },
  selectedThemeOption: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  themeIcon: {
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  themeDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
