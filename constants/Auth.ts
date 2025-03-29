// Auth and subscription constants
export const FREE_DAILY_LIMIT = 2;
export const PRO_DAILY_LIMIT = 100;

// RevenueCat product IDs - replace these with your actual product IDs
export const REVENUECAT_PRODUCTS = {
  MONTHLY_SUB: "toonsai_monthly",
  YEARLY_SUB: "toonsai_yearly",
  LIFETIME: "toonsai_lifetime",
};

// RevenueCat entitlement ID
export const ENTITLEMENT_ID = "pro";

// Feature flags
export const FEATURES = {
  // Free features
  BASIC_GENERATIONS: "basic_generations",
  SAVE_TO_GALLERY: "save_to_gallery",

  // Pro features
  UNLIMITED_GENERATIONS: "unlimited_generations", // Actually limited to 100/day
  HIGHER_QUALITY: "higher_quality",
  PRIORITY_PROCESSING: "priority_processing",
};
