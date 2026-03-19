import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";

import type { DeliveryCoordinates } from "@/types/delivery";

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
