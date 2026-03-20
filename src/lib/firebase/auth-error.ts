const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-credential": "Your email or password is incorrect.",
  "auth/invalid-phone-number": "Please enter a valid phone number.",
  "auth/invalid-verification-code": "The verification code is incorrect.",
  "auth/missing-phone-number": "Phone number is required.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/session-expired": "This code has expired. Please request a new one.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/wrong-password": "Your email or password is incorrect.",
};

function getFirebaseErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "";
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

export function getFirebaseAuthErrorMessage(error: unknown, fallbackMessage: string) {
  const errorCode = getFirebaseErrorCode(error);

  if (errorCode in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }

  if (
    errorCode.startsWith("auth/invalid-verification") ||
    errorCode === "auth/code-expired"
  ) {
    return "The verification code is invalid or expired. Please request a new code.";
  }

  return fallbackMessage;
}
