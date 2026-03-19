import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

import type { DeliveryDocument, DeliveryItem, DeliveryStatus } from "@/types/delivery";

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
