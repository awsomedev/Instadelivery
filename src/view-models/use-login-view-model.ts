import { useRouter } from "expo-router";
import { useState } from "react";

import { loginWithEmailPassword } from "@/lib/firebase";

export function useLoginViewModel() {
  const router = useRouter();
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
    router.push("/signup" as never);
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
