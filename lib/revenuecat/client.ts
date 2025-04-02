import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesConfiguration,
} from "react-native-purchases";
import { Platform } from "react-native";

// RevenueCat API keys
const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

// Check if we're using placeholder API keys
const isUsingPlaceholderKeys =
  REVENUECAT_IOS_API_KEY === "placeholder_ios_key" ||
  REVENUECAT_ANDROID_API_KEY === "placeholder_android_key";

/**
 * Initialize RevenueCat with the appropriate API key
 * @param userId ID of the user for RevenueCat
 * @returns Promise<boolean> indicating if initialization was successful
 */
export const initializeRevenueCat = async (userId: string | null): Promise<boolean> => {
  try {
    if (!REVENUECAT_IOS_API_KEY || !REVENUECAT_ANDROID_API_KEY) {
      console.warn("RevenueCat API keys are missing");
      return false;
    }

    // Skip initialization if using placeholder keys
    if (isUsingPlaceholderKeys) {
      console.warn(
        "Using placeholder RevenueCat API keys - purchases will not work"
      );
      return true;
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
    console.log("RevenueCat initialized with user ID:", userId);
    return true;
  } catch (error) {
    console.error("Error initializing RevenueCat:", error);
    return false;
  }
};

/**
 * Check if RevenueCat is initialized
 * @returns Promise<boolean> indicating if RevenueCat is initialized
 */
export const isRevenueCatReady = async (): Promise<boolean> => {
  try {
    return await Purchases.isConfigured();
  } catch (error) {
    console.error("Error checking if RevenueCat is configured:", error);
    return false;
  }
};

/**
 * Ensures RevenueCat is initialized before proceeding
 * @returns Promise<boolean> indicating if RevenueCat is ready to use
 */
const ensureRevenueCatInitialized = async (): Promise<boolean> => {
  try {
    const isConfigured = await isRevenueCatReady();
    if (!isConfigured) {
      console.error("RevenueCat is not initialized. Call initializeRevenueCat() first.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error checking RevenueCat configuration:", error);
    return false;
  }
};

/**
 * Get customer info from RevenueCat
 * @returns CustomerInfo object if successful, null if error
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    // Check if RevenueCat is initialized
    if (!await ensureRevenueCatInitialized()) {
      return null;
    }

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
    // Check if RevenueCat is initialized
    if (!await ensureRevenueCatInitialized()) {
      return [];
    }

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
    // Check if RevenueCat is initialized
    if (!await ensureRevenueCatInitialized()) {
      return null;
    }

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
    // Check if RevenueCat is initialized (this will be checked in getCustomerInfo)
    const customerInfo = await getCustomerInfo();

    if (!customerInfo) return false;

    // Check for active entitlement - replace 'pro' with your actual entitlement ID
    return customerInfo.entitlements.active.hasOwnProperty("pro");
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
};

/**
 * Update the user ID for RevenueCat
 * @param userId New user ID
 * @returns true if successful, false if error
 */
export const updateRevenueCatUserId = async (
  userId: string
): Promise<boolean> => {
  try {
    // Check if RevenueCat is initialized
    if (!await ensureRevenueCatInitialized()) {
      return false;
    }

    await Purchases.logIn(userId);
    return true;
  } catch (error) {
    console.error("Error updating RevenueCat user ID:", error);
    return false;
  }
};
