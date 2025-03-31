import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { PhotoToAnime } from "@/components/PhotoToAnime";
import { useUser } from "@/lib/auth/UserContext";
import {
  getRemainingGenerations,
  getDailyLimit,
  getSubscriptionTier,
} from "@/lib/auth/usageTracking";

// Check if we're using placeholder API keys
const isUsingPlaceholderKeys =
  (process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "") ===
    "placeholder_ios_key" ||
  (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "") ===
    "placeholder_android_key";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    hasSubscription,
    checkSubscription,
    loading: userLoading,
    error: userError,
    retry,
  } = useUser();
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">(
    "free"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load usage information when the component mounts or subscription changes
    if (!userLoading && !userError && user) {
      loadUsageInfo();
    }
  }, [hasSubscription, userLoading, userError, user]);

  const loadUsageInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const remaining = await getRemainingGenerations();
      const limit = await getDailyLimit();
      const tier = await getSubscriptionTier();

      setRemainingGenerations(remaining);
      setDailyLimit(limit);
      setSubscriptionTier(tier);
    } catch (error) {
      console.error("Error loading usage info:", error);
      setError(
        "Failed to load your usage information. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    router.push("/(modals)/paywall");
  };

  const handleImageGeneratorPress = () => {
    router.push("/image-generator");
  };

  const handleApiTestPress = () => {
    router.push("/api-test");
  };

  const handleImageTestPress = () => {
    router.push("/image-test");
  };

  // Show loading state if user context is loading
  if (userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2962FF" />
        <ThemedText style={styles.loadingText}>
          Loading user profile...
        </ThemedText>
      </View>
    );
  }

  // Show error state if there's an error with the user context
  if (userError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF5252" />
        <ThemedText style={styles.errorText}>{userError}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // Show error state if there's an error with loading usage info
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF5252" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadUsageInfo}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 16 + insets.bottom },
        ]}
      >
        {/* Header with premium badge for premium users */}
        {hasSubscription && (
          <View style={styles.header}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={14} color="#7f5c3c" />
              <ThemedText style={styles.premiumText}>PREMIUM</ThemedText>
            </View>
          </View>
        )}

        {/* PhotoToAnime component */}
        <PhotoToAnime />

        {/* Upgrade banner for free users only */}
        {!hasSubscription && (
          <View style={styles.upgradeBanner}>
            <View style={styles.usageInfo}>
              <ThemedText style={styles.usageText}>
                Daily Usage: {remainingGenerations}/{dailyLimit} images
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(remainingGenerations / dailyLimit) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <ThemedText style={styles.upgradeText}>
              Get unlimited generations, priority processing, and more styles
            </ThemedText>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
            >
              <Ionicons
                name="star"
                size={16}
                color="#fff"
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.upgradeButtonText}>
                Upgrade to Premium
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Test buttons section */}
        <View style={styles.testSection}>
          <ThemedText style={styles.testSectionTitle}>
            Development Tools
          </ThemedText>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleImageGeneratorPress}
          >
            <Ionicons
              name="image-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.testButtonText}>
              AI Image Generator
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: "#5c6bc0" }]}
            onPress={handleApiTestPress}
          >
            <Ionicons
              name="code-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.testButtonText}>
              API Testing Tools
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: "#00796b" }]}
            onPress={handleImageTestPress}
          >
            <Ionicons
              name="image-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.testButtonText}>
              Image Display Testing
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 16,
  },
  upgradeBanner: {
    backgroundColor: "rgba(179, 138, 97, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  usageInfo: {
    marginBottom: 12,
  },
  usageText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(224, 208, 179, 0.5)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#b38a61",
    borderRadius: 3,
  },
  upgradeText: {
    fontSize: 14,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: "#2962FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  buttonIcon: {
    marginRight: 8,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2962FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(219, 198, 162, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b38a61",
  },
  premiumText: {
    color: "#7f5c3c",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  testSection: {
    marginTop: 24,
    backgroundColor: "#f0f4f8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  testSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  testButton: {
    backgroundColor: "#2ecc71",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
