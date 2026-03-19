import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

export type AuthUser = FirebaseAuthTypes.User | null;
export type DeliveryStatus = "pending" | "in_progress" | "delivered" | "failed";

export type DeliveryCoordinates = {
  lat: number;
  lng: number;
};

export type FirestoreTimestamp =
  | FirebaseFirestoreTypes.Timestamp
  | FirebaseFirestoreTypes.FieldValue;

export type DeliveryDocument = {
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
