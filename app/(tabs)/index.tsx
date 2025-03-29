import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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
    router.push("/paywall");
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
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">ToonsAI</ThemedText>
        <HelloWave />
      </ThemedView>

      {isUsingPlaceholderKeys && (
        <ThemedView style={styles.devModeContainer}>
          <ThemedText style={styles.devModeText}>
            Development Mode: Using placeholder subscription data
          </ThemedText>
        </ThemedView>
      )}

      {/* User info section */}
      <ThemedView style={styles.userContainer}>
        <View style={styles.userInfoRow}>
          <ThemedText type="defaultSemiBold">
            Plan: {subscriptionTier === "pro" ? "Premium" : "Free"}
          </ThemedText>

          {!hasSubscription && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
            >
              <ThemedText style={styles.upgradeButtonText}>Upgrade</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <ThemedView style={styles.usageContainer}>
          <ThemedText>
            Remaining today: {remainingGenerations} / {dailyLimit} cartoons
          </ThemedText>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(remainingGenerations / dailyLimit) * 100}%`,
                  backgroundColor:
                    subscriptionTier === "pro" ? "#4CAF50" : "#2196F3",
                },
              ]}
            />
          </View>
        </ThemedView>
      </ThemedView>

      {/* Main content section */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Generate Cartoon</ThemedText>
        <ThemedText>
          Enter a prompt below to generate a cartoon in the style you want.
        </ThemedText>
        {/* Prompt input and generation button to be added here */}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Save & Share</ThemedText>
        <ThemedText>
          Save your generated cartoons to your device or share them with
          friends.
        </ThemedText>
      </ThemedView>

      {!hasSubscription && (
        <ThemedView style={[styles.stepContainer, styles.upgradeContainer]}>
          <ThemedText type="subtitle">Upgrade to Premium</ThemedText>
          <ThemedText>
            Get more daily generations, higher quality images, and priority
            processing.
          </ThemedText>
          <TouchableOpacity
            style={styles.largeUpgradeButton}
            onPress={handleUpgradePress}
          >
            <Ionicons name="star" size={18} color="#FFF" />
            <ThemedText style={styles.largeUpgradeButtonText}>
              Upgrade Now
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  userContainer: {
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(200, 200, 200, 0.1)",
  },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upgradeButton: {
    backgroundColor: "#2962FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  usageContainer: {
    gap: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  upgradeContainer: {
    backgroundColor: "rgba(41, 98, 255, 0.1)",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  largeUpgradeButton: {
    backgroundColor: "#2962FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  largeUpgradeButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 16,
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
  devModeContainer: {
    padding: 10,
    backgroundColor: "rgba(26, 35, 126, 0.7)",
    borderRadius: 8,
    marginBottom: 16,
  },
  devModeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
