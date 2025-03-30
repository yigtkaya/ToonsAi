import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@/lib/auth/UserContext";

/**
 * Component that monitors subscription status and shows
 * the paywall when needed
 */
export default function PaywallController() {
  const { hasSubscription, loading } = useUser();
  const router = useRouter();

  // Show paywall for non-subscribed users when the app is opened
  useEffect(() => {
    if (!loading && !hasSubscription) {
      // A short delay to ensure the app is fully loaded before showing the paywall
      const timer = setTimeout(() => {
        router.push("/(modals)/paywall");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [loading, hasSubscription, router]);

  // This is a UI-less component, so we don't render anything
  return null;
}
