import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

setGlobalOptions({ maxInstances: 10 });

if (!getApps().length) {
  initializeApp();
}

const getAssignedUserId = (
  data: Record<string, unknown> | undefined,
): string | null => {
  if (!data) {
    return null;
  }

  const value = data.driverId;

  return typeof value === "string" && value.trim() ? value : null;
};

const getFcmToken = (data: Record<string, unknown>): string | null => {
  const value =
    data.fcmToken ?? data.fcm_token ?? data.notificationToken ?? data.pushToken;

  return typeof value === "string" && value.trim() ? value : null;
};

export const notifyDeliveryAssigned = onDocumentCreated(
  "deliveries/{deliveryId}",
  async (event) => {
    const deliveryId = event.params.deliveryId;

    if (!event.data?.data()) {
      return;
    }

    const userID = getAssignedUserId(event.data.data());

    if (!userID) {
      return;
    }
    const userDoc = await getFirestore().collection("users").doc(userID).get();

    if (!userDoc.exists) {
      logger.warn("Assigned user document not found.", {
        deliveryId,
        userId: userID,
      });
      return;
    }

    const userData = userDoc.data() as Record<string, unknown>;
    const token = getFcmToken(userData);

    if (!token) {
      logger.warn("FCM token missing for assigned user.", {
        deliveryId,
        userId: userID,
      });
      return;
    }

    await getMessaging().send({
      token,
      notification: {
        title: "Delivery Assigned",
        body: `A delivery is assigned to you. Delivery ID: ${deliveryId}`,
      },
      data: {
        deliveryId,
        type: "delivery_assigned",
      },
    });

    logger.info("Delivery assignment notification sent.", {
      deliveryId,
      userId: userID,
    });
  },
);
