import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppTextField } from "@/components/ui/app-text-field";
import { useLoginViewModel } from "@/view-models/use-login-view-model";

export default function LoginScreen() {
  const { email, error, goToSignup, loading, onLogin, password, setEmail, setPassword } =
    useLoginViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in with your email and password.</Text>

          <View style={styles.form}>
            <AppTextField
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <AppTextField
              autoComplete="password"
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
              value={password}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <AppButton label="Log in" loading={loading} onPress={onLogin} />
            <AppButton label="Create account" onPress={goToSignup} variant="ghost" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 28,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  error: {
    color: "#D0302F",
    fontSize: 13,
  },
  form: {
    gap: 14,
  },
  keyboardContainer: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  subtitle: {
    color: "#6E6E73",
    fontSize: 15,
  },
  title: {
    color: "#111111",
    fontSize: 30,
    fontWeight: "700",
  },
});
