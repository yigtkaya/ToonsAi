import { supabase } from "../supabase/client";
import { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key to store user session data
const USER_SESSION_KEY = "toonsai_user_session";

/**
 * Sign in anonymously with Supabase
 * @returns User object if successful, null if error
 */
export const signInAnonymously = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Error signing in anonymously:", error.message);
      return null;
    }

    if (data.user) {
      // Save session to AsyncStorage
      await AsyncStorage.setItem(
        USER_SESSION_KEY,
        JSON.stringify(data.session)
      );
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Unexpected error during anonymous sign-in:", error);
    return null;
  }
};

/**
 * Get the current user session
 * @returns Session object if exists, null otherwise
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Unexpected error getting session:", error);
    return null;
  }
};

/**
 * Check if the current user is anonymous
 * @returns boolean indicating if user is anonymous
 */
export const isAnonymousUser = async (): Promise<boolean> => {
  try {
    const session = await getSession();

    if (!session) return false;

    // Check if the JWT has is_anonymous claim
    const isAnonymous = session.user?.user_metadata?.is_anonymous || false;
    return isAnonymous;
  } catch (error) {
    console.error("Error checking if user is anonymous:", error);
    return false;
  }
};

/**
 * Convert anonymous user to permanent user
 * @param email Email to link to the account
 * @returns User object if successful, null if error
 */
export const linkEmailToAnonymousUser = async (
  email: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.updateUser({ email });

    if (error) {
      console.error("Error linking email to anonymous user:", error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Unexpected error linking email:", error);
    return null;
  }
};

/**
 * Update the user's password after email verification
 * @param password New password for the user
 * @returns User object if successful, null if error
 */
export const setUserPassword = async (
  password: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Error setting user password:", error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Unexpected error setting password:", error);
    return null;
  }
};

/**
 * Sign out the current user
 * @returns true if successful, false if error
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error.message);
      return false;
    }

    // Clear session from AsyncStorage
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    return true;
  } catch (error) {
    console.error("Unexpected error signing out:", error);
    return false;
  }
};
