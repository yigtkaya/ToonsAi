# 🚀 ToonsAI: Cartoon Anything

**A minimal, fast-to-market mobile application for generating cartoon-style images from text prompts using Gemini 2.0 API.**

## 📱 Core App Features

- **Image Generation**:

  - User inputs text prompt.
  - Securely generates cartoon-style images via Gemini API.
  - Display and allow saving images locally.

- **Anonymous User Management**:

  - Auto-generated unique device ID (no manual login).
  - Tracks usage securely via Supabase Edge functions.

- **Subscription Model**:

  - Free users: 2 images/day.
  - Pro users: 100 images/day (managed via RevenueCat).
  - Paywall and subscription upgrade handled seamlessly.

- **Security & Backend**:

  - Gemini API securely accessed through Supabase Edge functions.
  - API keys stored securely in environment variables (`.env`).

- **Monitoring and Analytics**:

  - Mixpanel/Amplitude for analytics and user behavior insights.
  - Sentry for crash/error tracking.

- **Performance Optimization**:
  - Implement image caching
  - Optimize API calls and response handling
  - Ensure responsive UI during network operations

## 🛠 Tech Stack

| Component        | Technology                     |
| ---------------- | ------------------------------ |
| Frontend         | React Native (Expo)            |
| Backend          | Supabase Edge Functions (Deno) |
| Image Generation | Gemini 2.0 API                 |
| Subscriptions    | RevenueCat                     |
| Analytics        | Mixpanel / Amplitude           |
| Error Tracking   | Sentry                         |

## 📂 Project Structure

```
ToonsAI/
├── app/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── PaywallScreen.tsx
│   └── utils/
│       ├── uuid.ts
│       └── revenuecat.ts
├── supabase/
│   └── functions/
│       ├── generate-image.ts
│       └── log-usage.ts
```

## 📆 Rapid MVP Development Plan
