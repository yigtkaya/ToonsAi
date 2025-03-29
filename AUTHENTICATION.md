# ToonsAI Authentication & Subscription System

This document explains how the authentication and subscription system works in ToonsAI.

## Authentication with Supabase

ToonsAI uses Supabase for anonymous user authentication. This allows the app to identify unique users without requiring them to sign up with an email or password, while still providing the ability to track usage and manage subscriptions.

### Anonymous Authentication Flow

1. When a user first opens the app, they are automatically signed in anonymously to Supabase
2. This creates a unique user ID that persists across app sessions
3. The anonymous user can use the app with free tier limitations
4. If the user later subscribes, their purchase is tied to this anonymous user ID

### Configuration

To set up Supabase for your own instance:

1. Create a Supabase project at https://supabase.com
2. Enable anonymous sign-ins in the Auth settings
3. Create the required tables:
   - `usage_logs` - Tracks user generations
4. Add RLS policies to secure your data
5. Update the `.env` file with your Supabase URL and anon key

### RLS Policy Examples

For the `usage_logs` table, you might use a policy like:

```sql
create policy "Users can insert their own usage logs"
on usage_logs for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own usage logs"
on usage_logs for select
to authenticated
using (auth.uid() = user_id);
```

## Subscription Management with RevenueCat

ToonsAI uses RevenueCat to manage in-app subscriptions across iOS and Android, providing a unified API for handling purchases.

### Subscription Tiers

- **Free Tier**: 2 generations per day
- **Premium Tier**: 100 generations per day, higher quality, priority processing

### RevenueCat Setup

1. Create a RevenueCat account at https://www.revenuecat.com/
2. Set up your app and configure products:
   - Monthly subscription
   - Yearly subscription
   - Lifetime purchase
3. Create an entitlement called `pro` that grants access to premium features
4. Add your RevenueCat API keys to the `.env` file

### Linking Users with Purchases

RevenueCat is initialized with the anonymous user ID from Supabase, ensuring that purchases are tied to the correct user even without email/password authentication.

## Usage Tracking

Usage is tracked locally per day and also logged to Supabase for analytics purposes:

- Daily usage count is stored in AsyncStorage and reset each day
- Each generation is logged to the `usage_logs` table in Supabase

## Implementation Details

The key components of the authentication and subscription system are:

- `lib/supabase/client.ts` - Supabase client configuration
- `lib/auth/supabaseAuth.ts` - Authentication utilities
- `lib/auth/UserContext.tsx` - React context for user state management
- `lib/revenuecat/client.ts` - RevenueCat integration
- `lib/auth/usageTracking.ts` - Usage tracking and limits
- `app/paywall.tsx` - Subscription screen UI
- `constants/Auth.ts` - Shared constants for auth and subscriptions

## Environment Variables

Required environment variables (see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your-revenuecat-ios-api-key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your-revenuecat-android-api-key
```
