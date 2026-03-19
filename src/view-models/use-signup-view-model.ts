import { useRouter } from "expo-router";
import { useState } from "react";

import { signUpWithEmailPassword } from "@/lib/firebase";

export function useSignupViewModel() {
  const router = useRouter();
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
    router.replace("/login" as never);
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
