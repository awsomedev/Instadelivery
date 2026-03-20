const { withAndroidManifest } = require('@expo/config-plugins');
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAP_API ?? '';

function withGoogleMapsApiKey(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
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

module.exports = (config) =>
  withGoogleMapsApiKey({
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
        googleServicesFile: './cred/google-services.json',
      },
      web: {
        output: 'static',
        favicon: './assets/images/favicon.png',
      },
      plugins: [
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
      ],
      extra: {
        googleMapApi: googleMapsApiKey,
      },
    },
  });
