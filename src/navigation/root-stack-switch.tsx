import type { AuthUser } from "@/lib/firebase";
import { AppStack } from "@/navigation/app-stack";
import { AuthStack } from "@/navigation/auth-stack";
import { AuthScreen } from "@/navigation/types";

type RootStackSwitchProps = {
  user: AuthUser;
  isPhoneVerified: boolean;
};

export function RootStackSwitch({ user, isPhoneVerified }: RootStackSwitchProps) {
  if (!user) {
    return <AuthStack initialRouteName={AuthScreen.Login} />;
  }
  if (!isPhoneVerified) {
    return <AuthStack initialRouteName={AuthScreen.VerifyPhone} />;
  }
  return <AppStack />;
}
