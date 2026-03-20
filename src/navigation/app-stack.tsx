import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "@/hooks/use-auth";
import { useDriverNotifications } from "@/hooks/use-driver-notifications";
import DeliveriesScreen from "@/screens/deliveries";
import RouteScreen from "@/screens/route";
import RouteFullscreenScreen from "@/screens/route-fullscreen";
import { AppScreen } from "@/navigation/types";
import type { AppStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  const { user } = useAuth();
  useDriverNotifications({ userUid: user?.uid });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={AppScreen.Deliveries} component={DeliveriesScreen} />
      <Stack.Screen name={AppScreen.Route} component={RouteScreen} />
      <Stack.Screen name={AppScreen.RouteFullscreen} component={RouteFullscreenScreen} />
    </Stack.Navigator>
  );
}
