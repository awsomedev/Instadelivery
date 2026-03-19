import "@/lib/fcm-background-handler";
import React from "react";
import { useColorScheme } from "react-native";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot } from "expo-router";

import { NavigationGate } from "@/components/navigation-gate";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <NavigationGate>
        <Slot />
      </NavigationGate>
    </ThemeProvider>
  );
}
