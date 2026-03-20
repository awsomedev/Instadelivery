import { useEffect } from "react";
import { Platform } from "react-native";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";

import {
  getFcmDeviceToken,
  requestFcmPermission,
  saveDriverFcmToken,
  subscribeToFcmTokenRefresh,
} from "@/lib/firebase";
import { AppScreen } from "@/navigation/types";
import type { AppStackParamList } from "@/navigation/types";

type UseDriverNotificationsParams = {
  userUid?: string;
};

export function useDriverNotifications({ userUid }: UseDriverNotificationsParams) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  useEffect(() => {
    if (!userUid || Platform.OS === "web") {
      return;
    }

    const messaging = getMessaging();
    const channelIdPromise =
      Platform.OS === "android"
        ? notifee.createChannel({
            id: "deliveries",
            name: "Deliveries",
            importance: AndroidImportance.HIGH,
          })
        : Promise.resolve<string | undefined>(undefined);

    async function initialize() {
      try {
        const granted = await requestFcmPermission();
        if (!granted) {
          return;
        }
        await notifee.requestPermission();
        const token = await getFcmDeviceToken();
        if (token) {
          await saveDriverFcmToken(userUid, token);
        }
      } catch {
        return;
      }
    }

    void initialize();

    const unsubscribeTokenRefresh = subscribeToFcmTokenRefresh((token) => {
      void saveDriverFcmToken(userUid, token);
    });

    const unsubscribeNotifeeForeground = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) {
        navigation.navigate(AppScreen.Deliveries);
      }
    });

    const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
      const channelId = await channelIdPromise;
      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? "New Delivery",
        body: remoteMessage.notification?.body ?? "A new stop was assigned.",
        data: remoteMessage.data,
        android: channelId
          ? {
              channelId,
              pressAction: { id: "default" },
            }
          : undefined,
        ios: {
          sound: "default",
        },
      });
    });

    const unsubscribeOpened = onNotificationOpenedApp(messaging, () => {
      navigation.navigate(AppScreen.Deliveries);
    });

    void getInitialNotification(messaging).then((notification) => {
      if (notification) {
        navigation.navigate(AppScreen.Deliveries);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeNotifeeForeground();
      unsubscribeOpened();
    };
  }, [navigation, userUid]);
}
