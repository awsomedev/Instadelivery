import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

import { signUpWithEmailPassword } from "@/lib/firebase";
import { AuthScreen } from "@/navigation/types";
import type { AuthStackParamList } from "@/navigation/types";

export function useSignupViewModel() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSignUp() {
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
      const message = signupError instanceof Error ? signupError.message : "Unable to create account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    navigation.replace(AuthScreen.Login);
  }

  return {
    confirmPassword,
    email,
    error,
    goToLogin,
    loading,
    onSignUp,
    password,
    setConfirmPassword,
    setEmail,
    setPassword,
  };
}
