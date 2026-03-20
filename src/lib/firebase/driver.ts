import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";

import type { DeliveryCoordinates } from "@/types/delivery";

export async function createDriverProfile(user: {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
}) {
  const userRef = doc(getFirestore(), "users", user.uid);
  await setDoc(
    userRef,
    {
      email: user.email ?? null,
      phoneNumber: user.phoneNumber ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function saveDriverFcmToken(
  driverUid: string | undefined,
  token: string,
) {
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
