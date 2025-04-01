import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme, setThemePreference } from "@/hooks/useColorScheme";
import { useUser } from "@/lib/auth/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SettingsScreen = function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, hasSubscription, checkSubscription, signOut } = useUser();
  const [saveToCameraRoll, setSaveToCameraRoll] = useState(true);
  const [highQualityDownloads, setHighQualityDownloads] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme) {
          setCurrentTheme(savedTheme as "light" | "dark" | "system");
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    };

    loadThemePreference();
  }, []);

  // Function to change theme
  const changeTheme = async (theme: "light" | "dark" | "system") => {
    setCurrentTheme(theme);
    await setThemePreference(theme);
    setThemeModalVisible(false);
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

  const ThemeSelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={themeModalVisible}
      onRequestClose={() => setThemeModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View
          style={[styles.modalView, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.modalTitle}>Select Theme</ThemedText>

          <TouchableOpacity
            style={[
              styles.themeOption,
              currentTheme === "light" && styles.selectedThemeOption,
            ]}
            onPress={() => changeTheme("light")}
          >
            <Ionicons
              name="sunny"
              size={24}
              color={currentTheme === "light" ? colors.tint : colors.text}
            />
            <ThemedText
              style={[
                styles.themeOptionText,
                currentTheme === "light" && { color: colors.tint },
              ]}
            >
              Light
            </ThemedText>
            {currentTheme === "light" && (
              <Ionicons name="checkmark" size={20} color={colors.tint} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              currentTheme === "dark" && styles.selectedThemeOption,
            ]}
            onPress={() => changeTheme("dark")}
          >
            <Ionicons
              name="moon"
              size={24}
              color={currentTheme === "dark" ? colors.tint : colors.text}
            />
            <ThemedText
              style={[
                styles.themeOptionText,
                currentTheme === "dark" && { color: colors.tint },
              ]}
            >
              Dark
            </ThemedText>
            {currentTheme === "dark" && (
              <Ionicons name="checkmark" size={20} color={colors.tint} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              currentTheme === "system" && styles.selectedThemeOption,
            ]}
            onPress={() => changeTheme("system")}
          >
            <Ionicons
              name="phone-portrait"
              size={24}
              color={currentTheme === "system" ? colors.tint : colors.text}
            />
            <ThemedText
              style={[
                styles.themeOptionText,
                currentTheme === "system" && { color: colors.tint },
              ]}
            >
              System
            </ThemedText>
            {currentTheme === "system" && (
              <Ionicons name="checkmark" size={20} color={colors.tint} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.tint }]}
            onPress={() => setThemeModalVisible(false)}
          >
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
            currentTheme === "system"
              ? "Use device theme settings"
              : `Use ${currentTheme} theme`,
            () => setThemeModalVisible(true),
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
            "View our privacy policy",
            () =>
              Alert.alert(
                "Privacy Policy",
                "Privacy Policy will be available soon."
              ),
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}

          {renderSettingItem(
            "shield-checkmark",
            "Terms of Service",
            "View our terms of service",
            () =>
              Alert.alert(
                "Terms of Service",
                "Terms of Service will be available soon."
              ),
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}
        </View>

        {/* Developer Tools Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Developer Tools</ThemedText>

          {renderSettingItem(
            "code-slash",
            "API Testing",
            "Test API integrations",
            () => router.push("/api-test"),
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}

          {renderSettingItem(
            "bug",
            "Sentry Test",
            "Test error reporting system",
            () => router.push("/sentry-test" as any),
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          )}
        </View>

        {/* Button to sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.userIdText}>
          User ID: {user?.id ? user.id.slice(0, 8) + "..." : "Not logged in"}
        </ThemedText>
      </ScrollView>

      <ThemeSelectionModal />
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
  userIdText: {
    color: "#7f5c3c",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedThemeOption: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginLeft: 16,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
