import { Stack } from "expo-router";

import { useAuth } from "@/hooks/use-auth";
import { useDriverNotifications } from "@/hooks/use-driver-notifications";

export default function AppLayout() {
  const { user } = useAuth();
  useDriverNotifications({ userUid: user?.uid });

  return <Stack screenOptions={{ headerShown: false }} />;
}
