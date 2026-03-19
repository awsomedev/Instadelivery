import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Redirect, useRootNavigationState, useSegments } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

export function NavigationGate({ children }: PropsWithChildren) {
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const { user, initializing, isPhoneVerified } = useAuth();

  if (initializing || !rootNavigationState?.key) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const firstSegment = segments[0];
  const secondSegment = segments[1];
  const inAuthGroup = firstSegment === "(auth)";
  const onVerifyPhoneScreen = inAuthGroup && secondSegment === "verify-phone";

  if (!user) {
    if (!inAuthGroup || onVerifyPhoneScreen) {
      return <Redirect href="/login" />;
    }
    return children;
  }

  if (!isPhoneVerified) {
    if (!onVerifyPhoneScreen) {
      return <Redirect href="/verify-phone" />;
    }
    return children;
  }

  if (inAuthGroup) {
    return <Redirect href="/" />;
  }

  return children;
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
