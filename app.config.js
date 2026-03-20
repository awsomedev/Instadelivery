const { withAndroidManifest } = require('@expo/config-plugins');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API ?? '';
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? './cred/google-services.json';

function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const mainApplication = manifest.application[0];
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    const overrides = [
      {
        name: 'com.google.firebase.messaging.default_notification_color',
        attr: 'android:resource',
        value: '@color/notification_icon_color',
      },
      {
        name: 'com.google.firebase.messaging.default_notification_icon',
        attr: 'android:resource',
        value: '@drawable/notification_icon',
      },
    ];
    for (const override of overrides) {
      const idx = mainApplication['meta-data'].findIndex(
        (item) => item.$['android:name'] === override.name
      );
      const entry = {
        $: {
          'android:name': override.name,
          [override.attr]: override.value,
          'tools:replace': override.attr,
        },
      };
      if (idx >= 0) {
        mainApplication['meta-data'][idx] = entry;
      } else {
        mainApplication['meta-data'].push(entry);
      }
    }

    const existing = mainApplication['meta-data'].findIndex(
      (item) => item.$['android:name'] === 'com.google.android.geo.API_KEY'
    );
    const entry = {
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': googleMapsApiKey,
      },
    };
    if (existing >= 0) {
      mainApplication['meta-data'][existing] = entry;
    } else {
      mainApplication['meta-data'].push(entry);
    }
    return config;
  });
}

module.exports = (config) => ({
  ...config,
  expo: {
    ...config.expo,
    name: 'instadelivery',
    slug: 'instadelivery',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'instadelivery',
    userInterfaceStyle: 'automatic',
    android: {
      package: 'com.instasupply.instadelivery',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      googleServicesFile,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            extraMavenRepos: [
              '../../node_modules/@notifee/react-native/android/libs',
            ],
          },
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 76,
          },
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Allow InstaDelivery to use your location.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#007AFF',
        },
      ],
      withCustomAndroidManifest,
    ],
    extra: {
      googleMapApi: googleMapsApiKey,
      eas: {
        projectId: '4dfbbb75-f364-49af-b261-d58b60755b2e',
      },
    },
  },
});
