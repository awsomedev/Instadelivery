import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { AppTextField } from "@/components/ui/app-text-field";
import { signUpWithEmailPassword } from "@/lib/firebase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Email and password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signUpWithEmailPassword(email, password);
    } catch (signupError) {
      const message =
        signupError instanceof Error
          ? signupError.message
          : "Unable to create account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up with email and password.</Text>

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
              autoComplete="password-new"
              label="Password"
              onChangeText={setPassword}
              placeholder="Create password"
              secureTextEntry
              value={password}
            />
            <AppTextField
              autoComplete="password-new"
              label="Confirm password"
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry
              value={confirmPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            <AppButton label="Sign up" loading={loading} onPress={onSignUp} />
            <AppButton
              label="Back to login"
              onPress={() => router.replace("/login" as never)}
              variant="ghost"
            />
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
    gap: 24,
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
