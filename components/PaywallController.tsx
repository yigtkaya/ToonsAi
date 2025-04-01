import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { useUser } from "@/lib/auth/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Component that monitors subscription status and shows
 * the paywall when needed
 */
export default function PaywallController() {
  const { hasSubscription, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [gracePeriodActive, setGracePeriodActive] = useState(false);

  // Check if a paywall grace period is active
  useEffect(() => {
    const checkGracePeriod = async () => {
      try {
        const gracePeriodUntil = await AsyncStorage.getItem(
          "paywallGracePeriod"
        );
        if (gracePeriodUntil) {
          const expireTime = parseInt(gracePeriodUntil, 10);
          // If the grace period hasn't expired
          if (expireTime > Date.now()) {
            setGracePeriodActive(true);

            // Set a timeout to clear the grace period when it expires
            const timeLeft = expireTime - Date.now();
            const timeout = setTimeout(() => {
              setGracePeriodActive(false);
            }, timeLeft);

            return () => clearTimeout(timeout);
          } else {
            // Grace period has expired, remove it
            await AsyncStorage.removeItem("paywallGracePeriod");
            setGracePeriodActive(false);
          }
        }
      } catch (error) {
        console.error("Error checking paywall grace period:", error);
      }
    };

    checkGracePeriod();
  }, [pathname]);

  // Listen for navigation events to detect when paywall is closed
  useEffect(() => {
    // If user navigated away from paywall, set a grace period
    if (pathname !== "/(modals)/paywall" && !hasSubscription && !loading) {
      const setGracePeriod = async () => {
        try {
          // Set a 1 hour grace period (adjust as needed)
          const gracePeriodMs = 60 * 60 * 1000; // 1 hour
          const expireTime = Date.now() + gracePeriodMs;
          await AsyncStorage.setItem(
            "paywallGracePeriod",
            expireTime.toString()
          );
          setGracePeriodActive(true);
        } catch (error) {
          console.error("Error setting paywall grace period:", error);
        }
      };

      setGracePeriod();
    }
  }, [pathname, hasSubscription, loading]);

  // Show paywall for non-subscribed users when the app is opened
  useEffect(() => {
    if (!loading && !hasSubscription && !gracePeriodActive) {
      // Don't redirect if already on the paywall
      if (pathname === "/(modals)/paywall") {
        return;
      }

      // A short delay to ensure the app is fully loaded before showing the paywall
      const timer = setTimeout(() => {
        router.push("/(modals)/paywall");
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [loading, hasSubscription, router, pathname, gracePeriodActive]);

  // This is a UI-less component, so we don't render anything
  return null;
}
