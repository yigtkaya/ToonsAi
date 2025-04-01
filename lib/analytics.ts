import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';

// Initialize Mixpanel with your project token
const MIXPANEL_TOKEN = '177024a613b1870c44e5bcd10d5264dc';
const trackAutomaticEvents = true;

// Create a Mixpanel instance
const mixpanel = new Mixpanel(MIXPANEL_TOKEN, trackAutomaticEvents);

// Initialize Mixpanel safely
try {
  // Initialize Mixpanel with async pattern
  mixpanel.init().catch(error => {
    console.error('Failed to initialize Mixpanel:', error);
  });
} catch (error) {
  console.error('Error during Mixpanel setup:', error);
}

// Analytics utility functions
const Analytics = {
  /**
   * Identifies a user in Mixpanel
   * @param userId - The unique identifier for the user
   * @param userProperties - Additional properties to associate with the user
   */
  identifyUser: (userId: string, userProperties?: Record<string, any>) => {
    try {
      mixpanel.identify(userId);
      
      // Add user properties as part of an event if needed
      if (userProperties) {
        mixpanel.track('User Identified', userProperties);
      }
    } catch (error) {
      console.error('Error identifying user in Mixpanel:', error);
    }
  },

  /**
   * Track when a user views the onboarding screen
   */
  trackOnboardingView: () => {
    mixpanel.track('Viewed Onboarding');
  },

  /**
   * Track when a user completes the onboarding flow
   */
  trackOnboardingComplete: () => {
    mixpanel.track('Completed Onboarding');
  },

  /**
   * Track when a user views the paywall
   * @param source - Where the user came from (optional)
   */
  trackPaywallView: (source?: string) => {
    mixpanel.track('Viewed Paywall', { source: source || 'direct' });
  },

  /**
   * Track when a user presses the subscribe button
   * @param plan - The subscription plan selected
   * @param price - The price of the plan
   */
  trackSubscribeButtonPress: (plan: string, price: number) => {
    mixpanel.track('Pressed Subscribe Button', {
      plan,
      price
    });
  },

  /**
   * Track when a user successfully completes a subscription
   * @param plan - The subscription plan selected
   * @param price - The price of the plan
   */
  trackSubscriptionComplete: (plan: string, price: number) => {
    mixpanel.track('Completed Subscription', {
      plan,
      price
    });
  },

  /**
   * Track when a user presses the generate button
   * @param parameters - Any parameters used for generation
   */
  trackGeneratePress: (parameters?: Record<string, any>) => {
    mixpanel.track('Pressed Generate Button', parameters);
  },

  /**
   * Track when a user applies a style
   * @param style - The name of the style applied
   */
  trackStyleApplied: (style: string) => {
    mixpanel.track('Applied Style', { style });
  },

  /**
   * Generic event tracking method
   * @param eventName - The name of the event to track
   * @param properties - Additional properties to track with the event
   */
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    try {
      mixpanel.track(eventName, properties);
    } catch (error) {
      console.error(`Error tracking event "${eventName}" in Mixpanel:`, error);
    }
  }
};

export default Analytics; 