import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { signOutCurrentUser } from "@/lib/firebase";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>You are logged in and phone verified.</Text>
        <AppButton label="Sign out" onPress={signOutCurrentUser} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 20,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  subtitle: {
    color: "#6E6E73",
    fontSize: 16,
  },
  title: {
    color: "#111111",
    fontSize: 32,
    fontWeight: "700",
  },
});
