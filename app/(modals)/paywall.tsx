import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Alert,
  Dimensions,
  useWindowDimensions,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useUser } from "@/lib/auth/UserContext";
import { purchasePackage, getPackages } from "@/lib/revenuecat/client";
import Analytics from "@/lib/analytics";
import ErrorTracking from "@/lib/errorTracking";

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

// Mock data for consistent display
const MOCK_PACKAGES: PurchasesPackage[] = [
  {
    identifier: "toonsai_weekly",
    packageType: "WEEKLY",
    product: {
      identifier: "toonsai_weekly",
      description: "Weekly subscription to ToonsAI Pro",
      title: "ToonsAI Weekly",
      price: 1.99,
      priceString: "$1.99",
      currencyCode: "USD",
    },
    offering: "default",
    offeringIdentifier: "default",
    presentedOfferingContext: null,
  } as unknown as PurchasesPackage,
  {
    identifier: "toonsai_monthly",
    packageType: "MONTHLY",
    product: {
      identifier: "toonsai_monthly",
      description: "Monthly subscription to ToonsAI Pro",
      title: "ToonsAI Monthly",
      price: 4.99,
      priceString: "$4.99",
      currencyCode: "USD",
    },
    offering: "default",
    offeringIdentifier: "default",
    presentedOfferingContext: null,
  } as unknown as PurchasesPackage,
  {
    identifier: "toonsai_yearly",
    packageType: "ANNUAL",
    product: {
      identifier: "toonsai_yearly",
      description: "Annual subscription to ToonsAI Pro",
      title: "ToonsAI Yearly",
      price: 39.99,
      priceString: "$39.99",
      currencyCode: "USD",
    },
    offering: "default",
    offeringIdentifier: "default",
    presentedOfferingContext: null,
  } as unknown as PurchasesPackage,
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
  const params = useLocalSearchParams<{ showOnStart?: string }>();
  const showOnStart = params.showOnStart === "true";
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  useEffect(() => {
    // Track paywall view
    Analytics.trackPaywallView(showOnStart ? "app_start" : "in_app");
    ErrorTracking.addBreadcrumb("Paywall viewed", "screen_view", {
      source: showOnStart ? "app_start" : "in_app",
    });

    // Fetch subscription packages
    fetchPackages();

    // If shown on startup, delay the close button more
    const closeButtonDelay = showOnStart ? 7000 : 5000;

    // Show close button after delay
    setTimeout(() => {
      setShowCloseButton(true);
    }, closeButtonDelay);

    // Prevent Android back button from closing the paywall
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          // Allow back navigation only if the close button is visible
          // This creates a "hard paywall" when the close button isn't visible yet
          if (showCloseButton) {
            return false; // Let default behavior happen
          }

          // For all other cases, prevent back navigation
          return true; // Prevent default behavior
        }
      );

      return () => backHandler.remove();
    }
  }, [showCloseButton, showOnStart]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always use mock packages for consistent display
      // Use getPackages from our client instead of directly using Purchases
      const availablePackages = await getPackages();

      if (availablePackages.length > 0) {
        setPackages(availablePackages);
        setUsingMockData(false);
      } else {
        // Fallback to mock packages if none returned
        setPackages(MOCK_PACKAGES);
        setUsingMockData(true);
      }

      setSelectedPackage("toonsai_yearly"); // Default to yearly plan
      ErrorTracking.addBreadcrumb("Paywall packages loaded", "app_action", {
        using_mock_data: usingMockData,
      });
    } catch (err) {
      console.error("Error in fetchPackages:", err);
      ErrorTracking.captureException(err as Error, {
        context: "fetchPackages",
      });

      // Fallback to mock data
      setPackages(MOCK_PACKAGES);
      setSelectedPackage("toonsai_yearly");
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      ErrorTracking.addBreadcrumb("Purchase initiated", "user_action", {
        package: selectedPackage,
      });

      // Find the selected package
      const packageToPurchase = packages.find(
        (pkg) => pkg.identifier === selectedPackage
      );

      if (!packageToPurchase) {
        setError("Selected package not found");
        ErrorTracking.logMessage("Selected package not found", "error", {
          selected_package: selectedPackage,
          available_packages: packages.map((p) => p.identifier),
        });
        return;
      }

      // Track subscription button press
      if (packageToPurchase?.product) {
        Analytics.trackSubscribeButtonPress(
          packageToPurchase.identifier,
          packageToPurchase.product.price
        );
      }

      if (isUsingPlaceholderKeys || usingMockData) {
        // Use our custom purchase function that handles mock data
        await purchasePackage(packageToPurchase);
      } else {
        try {
          // Use the actual RevenueCat purchase but with safety check
          await purchasePackage(packageToPurchase);
        } catch (purchaseError) {
          console.error("Purchase error:", purchaseError);
          setError("Failed to complete purchase. Please try again.");
          ErrorTracking.captureException(purchaseError as Error, {
            context: "directPurchasePackage",
          });
          setPurchasing(false);
          return;
        }
      }

      // Track successful subscription
      if (packageToPurchase?.product) {
        Analytics.trackSubscriptionComplete(
          packageToPurchase.identifier,
          packageToPurchase.product.price
        );
        ErrorTracking.addBreadcrumb("Purchase completed", "user_action", {
          package: packageToPurchase.identifier,
          success: true,
        });
      }

      // Update subscription status
      await checkSubscription();

      // Navigate back to home
      router.replace("/");
    } catch (err: any) {
      console.error("Error purchasing package:", err);

      // Log the purchase error to Sentry
      ErrorTracking.captureException(err as Error, {
        context: "handlePurchase",
        package: selectedPackage,
      });

      // Check if the error message indicates cancellation
      if (err.message && err.message.includes("canceled")) {
        setError(null);
        ErrorTracking.addBreadcrumb(
          "Purchase canceled by user",
          "user_action",
          {
            package: selectedPackage,
          }
        );
      } else {
        setError("Failed to complete purchase. Please try again later.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = async () => {
    // Allow close via the UI button unconditionally
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ErrorTracking.addBreadcrumb("Paywall closed by user", "user_action");

    // Set a grace period to prevent immediate reopening (30 minutes)
    if (!hasSubscription) {
      try {
        const gracePeriodMs = 30 * 60 * 1000; // 30 minutes
        const expireTime = Date.now() + gracePeriodMs;
        await AsyncStorage.setItem("paywallGracePeriod", expireTime.toString());
      } catch (error) {
        console.error("Error setting paywall grace period:", error);
        ErrorTracking.captureException(error as Error, {
          context: "handleClose",
        });
      }
    }

    router.back();
  };

  const getPackageDetails = (pkg: PurchasesPackage) => {
    const isWeekly = pkg.identifier === "toonsai_weekly";
    const isMonthly = pkg.identifier === "toonsai_monthly";
    const isYearly = pkg.identifier === "toonsai_yearly";

    if (isWeekly) {
      return {
        title: "Weekly",
        subtitle: "Billed weekly",
        price: pkg.product.priceString,
        popular: false,
        pricePerMonth: "",
        savingsText: "",
        description: "Basic access to premium features",
      };
    } else if (isMonthly) {
      return {
        title: "Monthly",
        subtitle: "Billed monthly",
        price: pkg.product.priceString,
        popular: true,
        pricePerMonth: pkg.product.priceString,
        savingsText: "",
        description: "Full access to all premium features",
      };
    } else if (isYearly) {
      // Calculate monthly price
      const yearlyPrice = pkg.product.price;
      const monthlyEquivalent = (yearlyPrice / 12).toFixed(2);
      const monthlyPkg = packages.find(
        (p) => p.identifier === "toonsai_monthly"
      );

      let savingsText = "";
      if (monthlyPkg) {
        const monthlyPrice = monthlyPkg.product.price;
        const savingsPercent = Math.round(
          (1 - yearlyPrice / 12 / monthlyPrice) * 100
        );
        savingsText = `Save ${savingsPercent}%`;
      }

      return {
        title: "Annual",
        subtitle: savingsText,
        price: pkg.product.priceString,
        popular: false,
        pricePerMonth: `$${monthlyEquivalent}/mo`,
        savingsText: "SAVE 20%",
        description: "Best value with priority processing",
      };
    }

    return {
      title: pkg.packageType,
      subtitle: "",
      price: pkg.product.priceString,
      popular: false,
      pricePerMonth: "",
      savingsText: "",
      description: "",
    };
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/paywall_background.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#7f5c3c" />
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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.alreadySubscribedContainer}>
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
        >
          <View style={styles.header}>
            {/* Show close button after timer expires */}
            {showCloseButton && (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            )}
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

            {/* Main content with responsive layout */}
            <View
              style={
                isTablet
                  ? styles.tabletContentLayout
                  : styles.phoneContentLayout
              }
            >
              {/* Features List */}
              <View
                style={[
                  styles.featuresContainer,
                  isTablet && styles.featuresContainerTablet,
                ]}
              >
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons
                        name={feature.icon as any}
                        size={18}
                        color="#fff"
                      />
                    </View>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </View>
                ))}
              </View>

              {/* Subscription Options */}
              <View
                style={[
                  styles.packagesContainer,
                  isTablet && styles.packagesContainerTablet,
                ]}
              >
                <View
                  style={screenWidth >= 500 ? styles.packagesRow : undefined}
                >
                  {packages.map((pkg) => {
                    const details = getPackageDetails(pkg);
                    const isSelected = selectedPackage === pkg.identifier;
                    const isYearly = pkg.identifier === "toonsai_yearly";
                    const isMonthly = pkg.identifier === "toonsai_monthly";
                    const isWeekly = pkg.identifier === "toonsai_weekly";

                    return (
                      <TouchableOpacity
                        key={pkg.identifier}
                        style={[
                          styles.packageItem,
                          screenWidth >= 500 && styles.packageItemRow,
                          isSelected && styles.selectedPackage,
                          isYearly && styles.yearlyPackage,
                          !isSelected && styles.unselectedPackage,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          setSelectedPackage(pkg.identifier);
                        }}
                      >
                        {isYearly && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>
                              SAVE 20%
                            </Text>
                          </View>
                        )}

                        {isMonthly && (
                          <View style={styles.packageBadge}>
                            <Text style={styles.packageBadgeText}>POPULAR</Text>
                          </View>
                        )}

                        <View style={styles.packageContentWrapper}>
                          <View style={styles.packageContent}>
                            <View style={styles.packageHeader}>
                              <Text
                                style={[
                                  styles.packageTitle,
                                  !isSelected && styles.unselectedText,
                                ]}
                              >
                                {details.title}
                              </Text>
                              <View style={styles.priceRow}>
                                <Text
                                  style={[
                                    styles.packagePrice,
                                    !isSelected && styles.unselectedText,
                                  ]}
                                >
                                  {details.price}
                                </Text>

                                {details.pricePerMonth &&
                                  details.pricePerMonth !== details.price && (
                                    <Text style={styles.packagePricePerMonth}>
                                      {details.pricePerMonth}
                                    </Text>
                                  )}
                              </View>
                            </View>

                            {isSelected && (
                              <View style={styles.checkmarkContainer}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={24}
                                  color="#b38a61"
                                />
                              </View>
                            )}
                          </View>

                          {details.description && (
                            <View style={styles.packageDescriptionContainer}>
                              <Text
                                style={[
                                  styles.packageDescription,
                                  !isSelected && styles.unselectedText,
                                ]}
                              >
                                {details.description}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Error message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Purchase Button */}
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

            {/* Terms */}
            <Text style={styles.termsText}>
              Payment will be charged to your Apple ID account at the
              confirmation of purchase. Subscription automatically renews unless
              it is canceled at least 24 hours before the end of the current
              period. Your account will be charged for renewal within 24 hours
              prior to the end of the current period. You can manage and cancel
              your subscriptions by going to your account settings on the App
              Store after purchase.
            </Text>

            {/* Legal Links */}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  phoneContentLayout: {
    flexDirection: "column",
  },
  tabletContentLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  devModeContainer: {
    padding: 8,
    backgroundColor: "rgba(127, 92, 60, 0.7)",
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  devModeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  featuresContainer: {
    marginBottom: 20,
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featuresContainerTablet: {
    flex: 1,
    marginRight: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    height: 32,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#975C36",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  packagesContainer: {
    marginBottom: 20,
  },
  packagesContainerTablet: {
    flex: 1,
    marginLeft: 12,
  },
  packagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  packageItem: {
    backgroundColor: "#573F2C",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  packageItemRow: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectedPackage: {
    borderColor: "#b38a61",
    borderWidth: 3,
  },
  yearlyPackage: {
    backgroundColor: "#624933",
    borderColor: "#e6c984",
    borderWidth: 2,
    shadowColor: "#e6c984",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  packageBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#B38A61",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  packageBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  discountBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#e6c984",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  discountBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  packageContentWrapper: {
    marginTop: 4,
  },
  packageContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  packageHeader: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 3,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 6,
  },
  packagePricePerMonth: {
    fontSize: 12,
    color: "#e6c984",
  },
  checkmarkContainer: {
    marginLeft: 6,
  },
  purchaseButton: {
    backgroundColor: "#7f5c3c",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff6b6b",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  termsText: {
    color: "#999",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 16,
  },
  legalLinksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  legalLinkText: {
    color: "#bbb",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legalLinkDivider: {
    color: "#777",
    marginHorizontal: 8,
  },
  alreadySubscribedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alreadySubscribedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  alreadySubscribedText: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#7f5c3c",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  unselectedPackage: {
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    borderColor: "rgba(200, 200, 200, 0.1)",
  },
  unselectedText: {
    color: "#aaa",
  },
  packageDescriptionContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 8,
  },
  packageDescription: {
    fontSize: 12,
    color: "#fff",
  },
});
