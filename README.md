# InstaDelivery

Cross-platform delivery driver app built with Expo ~54 and React Native, using React Navigation for routing.

## Setup

1. Install dependencies

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env` and add your Google Maps API key

3. Start the app

   ```bash
   bun run android
   ```

## Google Maps API

You need a Google Cloud API key with the following APIs enabled:

- Maps SDK for Android
- Maps SDK for iOS
- Routes API
- Places API

Set the key in your `.env` file as `EXPO_PUBLIC_GOOGLE_MAP_API`.

## Firebase

The app uses Firebase for:

- **Authentication** — Email/password sign up and mobile phone verification
- **Firestore** — Real-time delivery data and driver location storage
- **Cloud Messaging (FCM)** — Push notifications to drivers
- **Cloud Functions** — Triggers a notification whenever a new delivery document is created for a driver

To set up Firebase, download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from the Firebase console and place them in the `cred/` folder. They will be automatically picked up and copied into the `android/` and `ios/` directories during the build.

Phone verification is currently in testing mode using mock Firebase phone numbers and verification codes. Real phone number verification can be enabled via the Firebase console.
You can use these mobile numbers for registering the user and the OTP will always be `123456`.
- 9999999999
- 7777777777
- 8888888888

Mock app login credentials:
- Email: `sreeyesh@gmail.com`
- Password: `password`

## Back Office

The back office dashboard is available at: https://instasupply-back-office-fg6rfgx3x-awsomedevs-projects.vercel.app/

Use it to add deliveries, set up mock deliveries, view all registered drivers, and monitor delivery statuses. **Adding a delivery through the back office will trigger a push notification to the assigned driver.**

Login credentials:
- Email: `admin@gmail.com`
- Password: `password@2123456`
