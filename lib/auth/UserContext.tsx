import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { signInAnonymously, getSession } from "./supabaseAuth";
import {
  initializeRevenueCat,
  hasActiveSubscription,
} from "../revenuecat/client";
import Analytics from "../analytics";
import ErrorTracking from "../errorTracking";

// Define the context types
interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasSubscription: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<boolean>;
  retry: () => Promise<void>;
}

// Create context with default values
export const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: true,
  hasSubscription: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  checkSubscription: async () => false,
  retry: async () => {},
});

// Hook to use the UserContext
export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to initialize the user
  const initializeUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for existing session
      const currentSession = await getSession();

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Initialize RevenueCat with the user's ID
        initializeRevenueCat(currentSession.user.id);

        // Identify user in Mixpanel
        Analytics.identifyUser(currentSession.user.id, {
          anonymous: true,
          first_seen: new Date().toISOString(),
        });

        // Identify user in Sentry
        ErrorTracking.setUser(currentSession.user.id, {
          anonymous: true,
        });
      } else {
        // Sign in anonymously if no session exists
        await signIn();
      }

      // Check subscription status
      const subscribed = await checkSubscription();
      setHasSubscription(subscribed);
    } catch (error) {
      console.error("Error initializing user:", error);
      ErrorTracking.captureException(error as Error, {
        context: "initializeUser",
      });
      setError(
        "Failed to connect to authentication service. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize user on app load
  useEffect(() => {
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Initialize RevenueCat whenever the user changes
          initializeRevenueCat(newSession.user.id);

          // Identify user in Mixpanel when auth state changes
          Analytics.identifyUser(newSession.user.id, {
            anonymous: true,
          });

          // Identify user in Sentry
          ErrorTracking.setUser(newSession.user.id, {
            anonymous: true,
          });

          // Check subscription status
          const subscribed = await checkSubscription();
          setHasSubscription(subscribed);

          // Track subscription status in Mixpanel
          if (subscribed) {
            Analytics.trackEvent("Subscription Status", {
              has_subscription: true,
              subscription_type: "pro",
            });
          }
        } else {
          // Clear user from Sentry if logged out
          ErrorTracking.setUser(null as any);
        }
      }
    );

    initializeUser();

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in anonymously
  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInAnonymously();

      if (user) {
        // Initialize RevenueCat with the new user's ID
        initializeRevenueCat(user.id);

        // Identify new user in Mixpanel
        Analytics.identifyUser(user.id, {
          anonymous: true,
          first_seen: new Date().toISOString(),
        });

        // Identify user in Sentry
        ErrorTracking.setUser(user.id, {
          anonymous: true,
          first_seen: new Date().toISOString(),
        });
      } else {
        setError("Failed to sign in anonymously. Please try again.");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      ErrorTracking.captureException(error as Error, {
        context: "signIn",
      });
      setError(
        "Failed to sign in. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Error signing out:", signOutError.message);
        setError("Failed to sign out. Please try again.");
      } else {
        // Reset state when signed out
        setSession(null);
        setUser(null);
        setHasSubscription(false);
      }
    } catch (error) {
      console.error("Unexpected error signing out:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check subscription status
  const checkSubscription = async (): Promise<boolean> => {
    try {
      const subscribed = await hasActiveSubscription();

      // Only update analytics if subscription status changed
      if (subscribed !== hasSubscription) {
        setHasSubscription(subscribed);

        // Track subscription status in Mixpanel
        Analytics.trackEvent("Subscription Status Changed", {
          has_subscription: subscribed,
          subscription_type: subscribed ? "pro" : "free",
        });
      } else {
        setHasSubscription(subscribed);
      }

      return subscribed;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  };

  // Function to retry initialization after an error
  const retry = async () => {
    await initializeUser();
  };

  const value = {
    session,
    user,
    loading,
    hasSubscription,
    error,
    signIn,
    signOut,
    checkSubscription,
    retry,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
