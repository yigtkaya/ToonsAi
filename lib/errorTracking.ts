import * as Sentry from '@sentry/react-native';
import Analytics from './analytics';

// Flag to track if Sentry initialization has been attempted
let isSentryEnabled = false;

try {
  // Check if Sentry is available by accessing a known property
  isSentryEnabled = typeof Sentry !== 'undefined' && Sentry.nativeCrash !== undefined;
} catch (e) {
  console.warn('Sentry detection failed:', e);
  isSentryEnabled = false;
}

/**
 * Error tracking utility that uses both Sentry and Mixpanel
 */
const ErrorTracking = {
  /**
   * Capture an exception and log it to both Sentry and Mixpanel
   * @param error The error to capture
   * @param context Additional context for the error
   */
  captureException: (error: Error, context?: Record<string, any>) => {
    try {
      // Only send to Sentry if it's enabled
      if (isSentryEnabled) {
        // Capture the error in Sentry
        Sentry.captureException(error, {
          extra: context,
        });
      } else {
        console.warn('Sentry not enabled, skipping error capture');
      }

      // Also log the error to Mixpanel for analytics
      Analytics.trackEvent('Error Occurred', {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        ...context,
      });

      // Log to console in development
      if (__DEV__) {
        console.error('Error captured:', error, context);
      }
    } catch (trackingError) {
      // Fallback to console if error tracking itself fails
      console.error('Error tracking failed:', trackingError);
      console.error('Original error:', error);
    }
  },

  /**
   * Manually log a message to both Sentry and Mixpanel
   * @param message The message to log
   * @param level The severity level (debug, info, warning, error)
   * @param context Additional context for the message
   */
  logMessage: (
    message: string, 
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
  ) => {
    try {
      // Log to Sentry
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });

      // Log to Mixpanel
      Analytics.trackEvent(`Log: ${level}`, {
        message,
        ...context,
      });

      // Log to console in development
      if (__DEV__) {
        switch (level) {
          case 'debug':
            console.debug(message, context);
            break;
          case 'info':
            console.info(message, context);
            break;
          case 'warning':
            console.warn(message, context);
            break;
          case 'error':
            console.error(message, context);
            break;
        }
      }
    } catch (trackingError) {
      // Fallback to console if error tracking itself fails
      console.error('Error logging failed:', trackingError);
      console.error('Original message:', message, context);
    }
  },

  /**
   * Set user information for error tracking
   * @param userId The user's ID
   * @param userInfo Additional user information
   */
  setUser: (userId: string, userInfo?: Record<string, any>) => {
    try {
      // Set user in Sentry
      Sentry.setUser({
        id: userId,
        ...userInfo,
      });
    } catch (error) {
      console.error('Failed to set user for error tracking:', error);
    }
  },

  /**
   * Add breadcrumb to track user actions leading up to an error
   * @param message Short description of the breadcrumb
   * @param category Category for the breadcrumb
   * @param data Additional data for the breadcrumb
   */
  addBreadcrumb: (
    message: string, 
    category?: string, 
    data?: Record<string, any>
  ) => {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  },
};

export default ErrorTracking; 