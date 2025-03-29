import { supabase } from "../supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSession } from "./supabaseAuth";
import { hasActiveSubscription } from "../revenuecat/client";

// Constants for usage limits
const FREE_DAILY_LIMIT = 2;
const PRO_DAILY_LIMIT = 100;

// Keys for AsyncStorage
const USAGE_COUNT_KEY = "toonsai_usage_count";
const USAGE_DATE_KEY = "toonsai_usage_date";

interface UsageData {
  count: number;
  date: string;
}

/**
 * Get the current usage count for today
 * @returns Current usage count and if limit is reached
 */
export const getCurrentUsage = async (): Promise<{
  count: number;
  limitReached: boolean;
}> => {
  try {
    // Check if user has subscription
    const isPro = await hasActiveSubscription();
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Get current usage
    const usageData = await getUsageData();

    // Check if limit is reached
    const limitReached = usageData.count >= limit;

    return { count: usageData.count, limitReached };
  } catch (error) {
    console.error("Error getting current usage:", error);
    return { count: 0, limitReached: false };
  }
};

/**
 * Increment usage count and check if limit is reached
 * @returns New count and if limit is reached
 */
export const incrementUsage = async (): Promise<{
  count: number;
  limitReached: boolean;
}> => {
  try {
    // Check if user has subscription
    const isPro = await hasActiveSubscription();
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Get current usage
    const usageData = await getUsageData();

    // Increment count
    const newCount = usageData.count + 1;

    // Save new count
    await saveUsageData(newCount);

    // Log usage to Supabase
    await logUsageToSupabase();

    // Check if limit is reached
    const limitReached = newCount >= limit;

    return { count: newCount, limitReached };
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return { count: 0, limitReached: false };
  }
};

/**
 * Get remaining generations for today
 * @returns Number of remaining generations
 */
export const getRemainingGenerations = async (): Promise<number> => {
  try {
    // Check if user has subscription
    const isPro = await hasActiveSubscription();
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Get current usage
    const usageData = await getUsageData();

    // Calculate remaining
    const remaining = Math.max(0, limit - usageData.count);

    return remaining;
  } catch (error) {
    console.error("Error getting remaining generations:", error);
    return 0;
  }
};

/**
 * Get current subscription tier
 * @returns 'free' or 'pro'
 */
export const getSubscriptionTier = async (): Promise<"free" | "pro"> => {
  try {
    const isPro = await hasActiveSubscription();
    return isPro ? "pro" : "free";
  } catch (error) {
    console.error("Error getting subscription tier:", error);
    return "free";
  }
};

/**
 * Get daily generation limit based on subscription
 * @returns Number of generations allowed per day
 */
export const getDailyLimit = async (): Promise<number> => {
  try {
    const isPro = await hasActiveSubscription();
    return isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
  } catch (error) {
    console.error("Error getting daily limit:", error);
    return FREE_DAILY_LIMIT;
  }
};

// Helper functions

/**
 * Get usage data from AsyncStorage
 */
const getUsageData = async (): Promise<UsageData> => {
  try {
    // Get stored usage data
    const storedCount = await AsyncStorage.getItem(USAGE_COUNT_KEY);
    const storedDate = await AsyncStorage.getItem(USAGE_DATE_KEY);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // If no stored date or date is not today, reset count
    if (!storedDate || storedDate !== today) {
      return { count: 0, date: today };
    }

    // Return stored count and date
    return {
      count: storedCount ? parseInt(storedCount, 10) : 0,
      date: storedDate,
    };
  } catch (error) {
    console.error("Error getting usage data:", error);
    return { count: 0, date: new Date().toISOString().split("T")[0] };
  }
};

/**
 * Save usage data to AsyncStorage
 * @param count New usage count
 */
const saveUsageData = async (count: number): Promise<void> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Save count and date
    await AsyncStorage.setItem(USAGE_COUNT_KEY, count.toString());
    await AsyncStorage.setItem(USAGE_DATE_KEY, today);
  } catch (error) {
    console.error("Error saving usage data:", error);
  }
};

/**
 * Log usage to Supabase for analytics
 */
const logUsageToSupabase = async (): Promise<void> => {
  try {
    // Get session to identify user
    const session = await getSession();

    if (!session) {
      console.warn("No session found, cannot log usage");
      return;
    }

    // Get subscription status
    const isPro = await hasActiveSubscription();

    // Insert usage record
    const { error } = await supabase.from("usage_logs").insert({
      user_id: session.user.id,
      is_anonymous: session.user.user_metadata?.is_anonymous || false,
      subscription_tier: isPro ? "pro" : "free",
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("Error logging usage to Supabase:", error.message);
    }
  } catch (error) {
    console.error("Unexpected error logging usage:", error);
  }
};
