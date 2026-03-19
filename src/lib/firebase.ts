import {
  createUserWithEmailAndPassword,
  FirebaseAuthTypes,
  getAuth,
  onIdTokenChanged,
  PhoneAuthProvider,
  PhoneAuthState,
  signInWithEmailAndPassword,
  signOut,
  verifyPhoneNumber,
} from "@react-native-firebase/auth";
import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export type AuthUser = FirebaseAuthTypes.User | null;
export type DeliveryStatus = "pending" | "in_progress" | "delivered" | "failed";

type DeliveryCoordinates = {
  lat: number;
  lng: number;
};

type FirestoreTimestamp =
  | FirebaseFirestoreTypes.Timestamp
  | FirebaseFirestoreTypes.FieldValue;

type DeliveryDocument = {
  orderId: string;
  driverId: string;
  customerName: string;
  address: string;
  coordinates: DeliveryCoordinates;
  status: DeliveryStatus;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

export type DeliveryItem = DeliveryDocument & {
  id: string;
};

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

export function subscribeToAssignedDeliveries(
  driverUid: string,
  callback: (deliveries: DeliveryItem[]) => void,
  onError?: (error: Error) => void,
) {
  const deliveriesQuery = query(
    collection(getFirestore(), "deliveries"),
    where("driverId", "==", driverUid),
  );

  return onSnapshot(
    deliveriesQuery,
    (snapshot) => {
      const deliveries = snapshot.docs.map(
        (deliveryDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = deliveryDoc.data() as DeliveryDocument;
          return {
            id: deliveryDoc.id,
            ...data,
          };
        },
      );
      callback(deliveries);
    },
    (error) => {
      if (onError) {
        onError(error as Error);
      }
    },
  );
}

export async function markDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
) {
  const deliveryRef = doc(getFirestore(), "deliveries", deliveryId);
  await updateDoc(deliveryRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function saveDriverFcmToken(
  driverUid: string | undefined,
  token: string,
) {
  console.log(driverUid, token, "Hzsgdfh");
  if (!driverUid) return;
  const userRef = doc(getFirestore(), "users", driverUid);
  await setDoc(
    userRef,
    {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateDriverLocation(
  driverUid: string,
  location: DeliveryCoordinates,
) {
  const userRef = doc(getFirestore(), "users", driverUid);
  await setDoc(
    userRef,
    {
      location: {
        ...location,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getFcmDeviceToken() {
  if (Platform.OS === "web") {
    return null;
  }

  const messaging = getMessaging();
  return getToken(messaging);
}

export async function requestFcmPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  const status = await requestPermission(getMessaging());
  return status > 0;
}

export function subscribeToFcmTokenRefresh(callback: (token: string) => void) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  return onTokenRefresh(getMessaging(), callback);
}

