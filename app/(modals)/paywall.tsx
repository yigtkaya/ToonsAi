import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

import { useUser } from "@/lib/auth/UserContext";
import { getPackages, purchasePackage } from "@/lib/revenuecat/client";
import {
  REVENUECAT_PRODUCTS,
  FREE_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
} from "@/constants/Auth";

// Check if we're using placeholder API keys
const isUsingPlaceholderKeys =
  (process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "") ===
    "placeholder_ios_key" ||
  (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "") ===
    "placeholder_android_key";

interface PlanFeature {
  icon: string;
  text: string;
}

const features: PlanFeature[] = [
  { icon: "infinite", text: "Unlimited image generations" },
  { icon: "flash", text: "Priority processing" },
  { icon: "brush", text: "Access to all anime styles" },
  { icon: "cloud-download", text: "HD downloads" },
  { icon: "ban", text: "Ad-free experience" },
];

export default function PaywallScreen() {
  const { hasSubscription, checkSubscription } = useUser();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Fetch subscription packages
    fetchPackages();

    // Check remote config for close button visibility
    checkCloseButtonConfig();
  }, []);

  const checkCloseButtonConfig = async () => {
    try {
      if (true) {
        // If configuration allows close button, show it after 3 seconds
        setTimeout(() => {
          setShowCloseButton(true);
        }, 5000);
      }
    } catch (error) {
      console.error("Error checking close button config:", error);
      // Default to not showing the close button on error
    }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isUsingPlaceholderKeys) {
        setUsingMockData(true);
      }

      const availablePackages = await getPackages();

      if (availablePackages.length === 0) {
        setError("No subscription packages available. Please try again later.");
        setLoading(false);
        return;
      }

      setPackages(availablePackages);

      // Set the monthly package as default selected
      const monthlyPkg = availablePackages.find(
        (pkg) => pkg.identifier === REVENUECAT_PRODUCTS.MONTHLY_SUB
      );
      if (monthlyPkg) {
        setSelectedPackage(monthlyPkg.identifier);
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError("Failed to load subscription options. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Find the selected package
      const packageToPurchase = packages.find(
        (pkg) => pkg.identifier === selectedPackage
      );

      if (!packageToPurchase) {
        setError("Selected package not found");
        return;
      }

      if (isUsingPlaceholderKeys) {
        // Use our custom purchase function that handles mock data
        await purchasePackage(packageToPurchase);
      } else {
        // Use the actual RevenueCat purchase
        await Purchases.purchasePackage(packageToPurchase);
      }

      // Update subscription status
      await checkSubscription();

      // Navigate back to home
      router.replace("/");
    } catch (err: any) {
      console.error("Error purchasing package:", err);

      // Check if the error message indicates cancellation
      if (err.message && err.message.includes("canceled")) {
        setError(null);
      } else {
        setError("Failed to complete purchase. Please try again later.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatPrice = (price: string) => {
    return price;
  };

  const getPackageDetails = (pkg: PurchasesPackage) => {
    if (pkg.identifier === REVENUECAT_PRODUCTS.MONTHLY_SUB) {
      return {
        title: "Monthly",
        subtitle: "Billed monthly",
        price: formatPrice(pkg.product.priceString),
        popular: true,
      };
    } else if (pkg.identifier === REVENUECAT_PRODUCTS.YEARLY_SUB) {
      // Calculate savings percentage
      const monthlyPkg = packages.find(
        (p) => p.identifier === REVENUECAT_PRODUCTS.MONTHLY_SUB
      );
      let savingsText = "";

      if (monthlyPkg) {
        const yearlyPrice = pkg.product.price;
        const monthlyPrice = monthlyPkg.product.price;
        const yearlyAsMonthly = yearlyPrice / 12;
        const savingsPercent = Math.round(
          (1 - yearlyAsMonthly / monthlyPrice) * 100
        );
        savingsText = `Save ${savingsPercent}%`;
      }

      return {
        title: "Yearly",
        subtitle: savingsText,
        price: formatPrice(pkg.product.priceString),
        popular: false,
      };
    } else if (pkg.identifier === REVENUECAT_PRODUCTS.LIFETIME) {
      return {
        title: "Lifetime",
        subtitle: "One-time purchase",
        price: formatPrice(pkg.product.priceString),
        popular: false,
      };
    }

    return {
      title: pkg.packageType,
      subtitle: "",
      price: formatPrice(pkg.product.priceString),
      popular: false,
    };
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/paywall_background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
          <ActivityIndicator size="large" color="#666" />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (hasSubscription) {
    return (
      <ImageBackground
        source={require("@/assets/images/paywall_background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.alreadySubscribedContainer,
              { paddingBottom: insets.bottom },
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color="#7f5c3c" />
            <Text style={styles.alreadySubscribedTitle}>
              You're already subscribed!
            </Text>
            <Text style={styles.alreadySubscribedText}>
              You already have access to all premium features of ToonsAI.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/paywall_background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <View style={styles.header}>
            <View style={styles.closeButtonContainer}>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {usingMockData && (
            <View style={styles.devModeContainer}>
              <Text style={styles.devModeText}>
                Development Mode: Using mock subscription data
              </Text>
            </View>
          )}

          <View style={styles.contentContainer}>
            <Text style={styles.title}>Upgrade to ToonsAI Pro</Text>

            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: "#7f5c3c" }]}
                  >
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color="#FFF"
                    />
                  </View>
                  <ThemedText style={styles.featureText}>
                    {feature.text}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.packagesContainer}>
              {packages.map((pkg) => {
                const details = getPackageDetails(pkg);
                const isSelected = selectedPackage === pkg.identifier;

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.packageItem,
                      isSelected && styles.selectedPackage,
                      details.popular && styles.popularPackage,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPackage(pkg.identifier);
                    }}
                  >
                    {details.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                      </View>
                    )}

                    <Text style={styles.packageTitle}>{details.title}</Text>
                    <Text style={styles.packagePrice}>{details.price}</Text>
                    <Text style={styles.packageSubtitle}>
                      {details.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                purchasing && styles.disabledButton,
              ]}
              onPress={handlePurchase}
              disabled={purchasing || !selectedPackage}
            >
              {purchasing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {selectedPackage?.includes("lifetime")
                    ? "Purchase Lifetime Access"
                    : "Start Subscription"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              Payment will be charged to your Apple ID account at the
              confirmation of purchase. Subscription automatically renews unless
              it is canceled at least 24 hours before the end of the current
              period. Your account will be charged for renewal within 24 hours
              prior to the end of the current period. You can manage and cancel
              your subscriptions by going to your account settings on the App
              Store after purchase.
            </Text>

            <View style={styles.legalLinksContainer}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Privacy Policy",
                    "Privacy Policy will be available soon."
                  )
                }
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkDivider}>|</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Terms of Service",
                    "Terms of Service will be available soon."
                  )
                }
              >
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>

            {usingMockData && (
              <Text
                style={[styles.devModeFooter, { marginBottom: insets.bottom }]}
              >
                Development Mode: Payments are simulated and no actual charges
                will be made.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(18, 18, 18, 0.8)", // Semi-transparent overlay for better text readability
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
  },
  packagesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  packageItem: {
    flex: 1,
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPackage: {
    borderColor: "#b38a61",
  },
  popularPackage: {
    backgroundColor: "#3b2a1a",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#dbc6a2",
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#3b2a1a",
    fontSize: 10,
    fontWeight: "bold",
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  packageSubtitle: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
  },
  purchaseButton: {
    backgroundColor: "#7f5c3c",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#cc6b5a",
    marginBottom: 10,
    textAlign: "center",
  },
  termsText: {
    color: "#888",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
  legalLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  legalLinkText: {
    color: "#fff",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalLinkDivider: {
    color: "#888",
    fontSize: 12,
    marginHorizontal: 8,
  },
  button: {
    backgroundColor: "#7f5c3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  alreadySubscribedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alreadySubscribedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  alreadySubscribedText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  devModeContainer: {
    padding: 10,
    backgroundColor: "rgba(127, 92, 60, 0.7)",
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  devModeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  devModeFooter: {
    color: "#888",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
});
