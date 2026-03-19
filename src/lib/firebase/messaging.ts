import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export async function getFcmDeviceToken() {
  if (Platform.OS === "web") {
    return null;
  }

  const messaging = getMessaging();
  return getToken(messaging);
}

export async function requestFcmPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  const status = await requestPermission(getMessaging());
  return status > 0;
}

export function subscribeToFcmTokenRefresh(callback: (token: string) => void) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  return onTokenRefresh(getMessaging(), callback);
}
