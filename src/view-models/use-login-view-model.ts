import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

import { loginWithEmailPassword } from "@/lib/firebase";
import { AuthScreen } from "@/navigation/types";
import type { AuthStackParamList } from "@/navigation/types";

export function useLoginViewModel() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await loginWithEmailPassword(email, password);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function goToSignup() {
    navigation.navigate(AuthScreen.Signup);
  }

  return {
    email,
    error,
    goToSignup,
    loading,
    onLogin,
    password,
    setEmail,
    setPassword,
  };
}
