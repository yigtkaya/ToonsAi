import { supabase } from "./client";

/**
 * Remote configuration keys
 */
export enum RemoteConfigKey {
  SHOW_CLOSE_BUTTON_PAYWALL = "show_close_button_paywall",
}

/**
 * Interface for remote configuration data
 */
interface RemoteConfig {
  id: number;
  created_at: string;
  [RemoteConfigKey.SHOW_CLOSE_BUTTON_PAYWALL]: boolean;
}

/**
 * Cache for remote configuration values
 */
const configCache: Record<string, any> = {};

/**
 * Timestamp when the cache was last updated
 */
let cacheTimestamp: number = 0;

/**
 * Cache expiration time in milliseconds (5 minutes)
 */
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Fetches all remote configuration values from Supabase
 * @returns Object containing all remote configuration values
 */
export async function fetchRemoteConfig(): Promise<Record<string, any>> {
  try {
    // Check if cache is still valid
    const now = Date.now();
    if (
      Object.keys(configCache).length > 0 &&
      now - cacheTimestamp < CACHE_EXPIRATION_MS
    ) {
      return configCache;
    }

    // Fetch remote config from Supabase
    const { data, error } = await supabase
      .from("remote_config")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching remote config:", error.message);
      return {};
    }

    if (!data) {
      return {};
    }

    // Update cache and timestamp
    for (const key of Object.keys(data)) {
      if (key !== "id" && key !== "created_at") {
        configCache[key] = data[key];
      }
    }

    cacheTimestamp = now;

    return configCache;
  } catch (error) {
    console.error("Error in fetchRemoteConfig:", error);
    return {};
  }
}

/**
 * Gets a specific configuration value
 * @param key The configuration key to fetch
 * @param defaultValue Default value to return if the key is not found
 * @returns The configuration value or the default value
 */
export async function getRemoteConfigValue<T>(
  key: RemoteConfigKey,
  defaultValue: T
): Promise<T> {
  try {
    const config = await fetchRemoteConfig();
    return key in config ? (config[key] as T) : defaultValue;
  } catch (error) {
    console.error(`Error getting remote config value for ${key}:`, error);
    return defaultValue;
  }
}
