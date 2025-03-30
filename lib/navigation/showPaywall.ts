import { router } from "expo-router";
import { hasActiveSubscription } from "../revenuecat/client";

/**
 * Shows the paywall screen
 * @param force If true, shows the paywall regardless of subscription status
 */
export async function showPaywall(force: boolean = false): Promise<void> {
  // If not forcing, check subscription status first
  if (!force) {
    const hasSubscription = await hasActiveSubscription();
    if (hasSubscription) {
      return; // Don't show paywall for subscribed users
    }
  }

  router.push("/(modals)/paywall");
}
