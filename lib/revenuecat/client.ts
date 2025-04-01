import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesConfiguration,
} from "react-native-purchases";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// RevenueCat API keys
const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

// Check if we're using placeholder API keys
const isUsingPlaceholderKeys =
  REVENUECAT_IOS_API_KEY === "placeholder_ios_key" ||
  REVENUECAT_ANDROID_API_KEY === "placeholder_android_key";

// Track whether RevenueCat has been initialized
let isRevenueCatInitialized = false;

/**
 * Initialize RevenueCat with the appropriate API key
 * @param userId ID of the user for RevenueCat
 */
export const initializeRevenueCat = (userId: string | null): void => {
  try {
    if (!REVENUECAT_IOS_API_KEY || !REVENUECAT_ANDROID_API_KEY) {
      console.warn("RevenueCat API keys are missing");
      return;
    }

    // Skip initialization if using placeholder keys
    if (isUsingPlaceholderKeys) {
      console.warn(
        "Using placeholder RevenueCat API keys - purchases will not work"
      );
      return;
    }

    const apiKey =
      Platform.OS === "ios"
        ? REVENUECAT_IOS_API_KEY
        : REVENUECAT_ANDROID_API_KEY;

    const configuration: PurchasesConfiguration = {
      apiKey,
      appUserID: userId, // This can be null for anonymous users
      userDefaultsSuiteName: "toonsai",
    };

    Purchases.configure(configuration);
    isRevenueCatInitialized = true;
    console.log("RevenueCat initialized with user ID:", userId);
  } catch (error) {
    console.error("Error initializing RevenueCat:", error);
    isRevenueCatInitialized = false;
  }
};

/**
 * Ensures RevenueCat is initialized before proceeding with operations
 * @returns true if RevenueCat is properly initialized or using placeholder keys, false otherwise
 */
const ensureRevenueCatInitialized = (): boolean => {
  // If using placeholder keys, we don't need actual initialization
  if (isUsingPlaceholderKeys) {
    return true;
  }
  
  // Check if RevenueCat is initialized
  if (!isRevenueCatInitialized) {
    console.warn("RevenueCat is not initialized. Make sure to call initializeRevenueCat first.");
    return false;
  }
  
  return true;
};

/**
 * Get customer info from RevenueCat
 * @returns CustomerInfo object if successful, null if error
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    // If using placeholder keys, return a mock customer info
    if (isUsingPlaceholderKeys) {
      console.warn(
        "Using placeholder customer info due to placeholder RevenueCat API keys"
      );
      // Create a placeholder customer info with no active entitlements
      return {
        entitlements: {
          active: {},
          all: {},
        },
        originalAppUserId: "placeholder_user_id",
        managementURL: null,
        // Adding other required properties with placeholder values
        originalApplicationVersion: null,
        originalPurchaseDate: null,
        firstSeen: new Date().toISOString(),
        latestExpirationDate: null,
        requestDate: new Date().toISOString(),
        allExpirationDates: {},
        allPurchaseDates: {},
        nonSubscriptionTransactions: [],
        activeSubscriptions: [],
      } as unknown as CustomerInfo;
    }

    // Ensure RevenueCat is initialized
    if (!ensureRevenueCatInitialized()) {
      return null;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error("Error getting customer info:", error);
    return null;
  }
};

/**
 * Get available packages from RevenueCat
 * @param offeringId ID of the offering to get packages for
 * @returns Array of PurchasesPackage objects
 */
export const getPackages = async (
  offeringId: string = "default"
): Promise<PurchasesPackage[]> => {
  try {
    // If using placeholder keys, return mock packages
    if (isUsingPlaceholderKeys) {
      console.warn(
        "Using placeholder packages due to placeholder RevenueCat API keys"
      );
      // Return mock packages for demonstration purposes
      return [
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
          } as any,
          offering: "default",
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
          } as any,
          offering: "default",
        } as unknown as PurchasesPackage,
        {
          identifier: "toonsai_lifetime",
          packageType: "LIFETIME",
          product: {
            identifier: "toonsai_lifetime",
            description: "Lifetime access to ToonsAI Pro",
            title: "ToonsAI Lifetime",
            price: 79.99,
            priceString: "$79.99",
            currencyCode: "USD",
          } as any,
          offering: "default",
        } as unknown as PurchasesPackage,
      ];
    }

    // Ensure RevenueCat is initialized
    if (!ensureRevenueCatInitialized()) {
      return [];
    }

    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn("No offerings available");
      return [];
    }

    const offering = offerings.all[offeringId] || offerings.current;
    return offering.availablePackages;
  } catch (error) {
    console.error("Error getting packages:", error);
    return [];
  }
};

/**
 * Purchase a package
 * @param pkg The package to purchase
 * @returns CustomerInfo object if successful, null if error
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> => {
  try {
    // If using placeholder keys, simulate a successful purchase
    if (isUsingPlaceholderKeys) {
      console.warn("Simulating purchase with placeholder RevenueCat API keys");
      // In development/test mode, simulate a successful purchase
      // This will allow testing the UI flow without actual purchases
      return {
        entitlements: {
          active: {
            pro: {
              identifier: "pro",
              isActive: true,
              willRenew: true,
              periodType: "NORMAL",
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: null,
              store: "APP_STORE",
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
            },
          },
          all: {
            pro: {
              identifier: "pro",
              isActive: true,
              willRenew: true,
              periodType: "NORMAL",
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: null,
              store: "APP_STORE",
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
            },
          },
        },
        originalAppUserId: "placeholder_user_id",
        managementURL: null,
        originalApplicationVersion: null,
        originalPurchaseDate: null,
        firstSeen: new Date().toISOString(),
        latestExpirationDate: null,
        requestDate: new Date().toISOString(),
        allExpirationDates: {},
        allPurchaseDates: {
          toonsai_monthly: new Date().toISOString(),
        },
        nonSubscriptionTransactions: [],
        activeSubscriptions: ["toonsai_monthly"],
      } as unknown as CustomerInfo;
    }

    // Ensure RevenueCat is initialized
    if (!ensureRevenueCatInitialized()) {
      return null;
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    console.error("Error purchasing package:", error);
    return null;
  }
};

/**
 * Check if user has an active subscription
 * @returns boolean indicating if user has an active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    // If we're using placeholder keys, always return false unless in development
    if (isUsingPlaceholderKeys) {
      // In development, developers can set a debug flag to simulate having a subscription
      const simulateProSubscription = await AsyncStorage.getItem('debug_simulate_pro');
      if (simulateProSubscription === 'true') {
        return true;
      }
      return false;
    }
    
    // Get customer info
    const customerInfo = await getCustomerInfo();

    // If we couldn't get customer info, assume no subscription
    if (!customerInfo) return false;

    // Check if any active entitlements exist
    if (!customerInfo.entitlements || !customerInfo.entitlements.active) {
      return false;
    }

    // Check for active entitlement - 'pro' is the expected entitlement ID
    return customerInfo.entitlements.active.pro !== undefined;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
};

/**
 * Update the user ID for RevenueCat
 * @param userId New user ID
 * @returns boolean indicating success
 */
export const updateRevenueCatUserId = async (
  userId: string
): Promise<boolean> => {
  try {
    // Ensure RevenueCat is initialized
    if (!ensureRevenueCatInitialized()) {
      return false;
    }

    await Purchases.logIn(userId);
    return true;
  } catch (error) {
    console.error("Error updating RevenueCat user ID:", error);
    return false;
  }
};
