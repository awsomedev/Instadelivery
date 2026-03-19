import {
  createUserWithEmailAndPassword,
  getAuth,
  onIdTokenChanged,
  PhoneAuthProvider,
  PhoneAuthState,
  signInWithEmailAndPassword,
  signOut,
  verifyPhoneNumber,
} from "@react-native-firebase/auth";
import { Platform } from "react-native";

import type { AuthUser } from "@/types/delivery";

export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(getAuth(), email.trim(), password);
}

export async function signUpWithEmailPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(getAuth(), email.trim(), password);
}

export async function signOutCurrentUser() {
  return signOut(getAuth());
}

export function subscribeToAuthState(
  callback: (user: AuthUser) => void,
): () => void {
  return onIdTokenChanged(getAuth(), callback);
}

export async function sendPhoneVerificationCode(phoneNumber: string) {
  if (Platform.OS === "web") {
    throw new Error("Phone verification is not available on web.");
  }

  return new Promise<string>((resolve, reject) => {
    const verificationRequest = verifyPhoneNumber(
      getAuth(),
      phoneNumber.trim(),
      false,
    );
    let settled = false;

    verificationRequest.on(
      "state_changed",
      (snapshot) => {
        if (settled) {
          return;
        }

        if (
          snapshot.state === PhoneAuthState.CODE_SENT &&
          snapshot.verificationId
        ) {
          settled = true;
          resolve(snapshot.verificationId);
          return;
        }

        if (
          snapshot.state === PhoneAuthState.AUTO_VERIFIED &&
          snapshot.verificationId
        ) {
          settled = true;
          resolve(snapshot.verificationId);
        }
      },
      (error) => {
        if (settled) {
          return;
        }

        settled = true;
        reject(error);
      },
    );
  });
}

export async function linkPhoneNumberWithCode(
  verificationId: string,
  code: string,
) {
  const currentUser = getAuth().currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to verify a phone number.");
  }

  const credential = PhoneAuthProvider.credential(verificationId, code.trim());

  const linkedUserCredential = await currentUser.linkWithCredential(credential);
  await linkedUserCredential.user.reload();
  return linkedUserCredential.user;
}

export async function reloadCurrentUser() {
  const currentUser = getAuth().currentUser;

  if (!currentUser) {
    return null;
  }

  await currentUser.reload();
  await currentUser.getIdToken(true);
  return getAuth().currentUser;
}
