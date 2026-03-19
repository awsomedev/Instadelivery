import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

exports.onDeliveryCreated = functions.firestore
  .document('deliveries/{deliveryId}')
  .onCreate(async (snap) => {
    const delivery = snap.data();
    const driverSnap = await admin.firestore().doc(`users/${delivery.driverId}`).get();
    const fcmToken = driverSnap.data()?.fcmToken;
    if (!fcmToken) return null;

    return admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'New Delivery',
        body: `Order ${delivery.orderId} — ${delivery.customerName}`,
      },
      data: { screen: 'deliveries' },
      android: { priority: 'high' },
      apns: { payload: { aps: { contentAvailable: true } } },
    });
  });
