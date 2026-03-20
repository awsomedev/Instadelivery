import { ActivityIndicator, StyleSheet, View, useColorScheme } from "react-native";

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";

import { useAuth } from "@/hooks/use-auth";
import { RootStackSwitch } from "@/navigation/root-stack-switch";

export function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, initializing, isPhoneVerified } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootStackSwitch user={user} isPhoneVerified={isPhoneVerified} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
