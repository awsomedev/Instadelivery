import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "@/screens/login";
import SignupScreen from "@/screens/signup";
import VerifyPhoneScreen from "@/screens/verify-phone";
import { AuthScreen } from "@/navigation/types";
import type { AuthStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthStackProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export function AuthStack({ initialRouteName = AuthScreen.Login }: AuthStackProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={AuthScreen.Login} component={LoginScreen} />
      <Stack.Screen name={AuthScreen.Signup} component={SignupScreen} />
      <Stack.Screen name={AuthScreen.VerifyPhone} component={VerifyPhoneScreen} />
    </Stack.Navigator>
  );
}
