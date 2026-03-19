import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = path.resolve(__dirname, 'cred/google-services.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  projectId: 'instadelivery-fc1b8',
});

const db = admin.firestore();

const DRIVER_UID = process.env.DRIVER_UID ?? 'REPLACE_WITH_REAL_UID';

const deliveries = [
  {
    orderId: 'ORD-001',
    driverId: DRIVER_UID,
    customerName: 'Alice Johnson',
    address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
    coordinates: { lat: 37.4224764, lng: -122.0842499 },
    status: 'pending',
  },
  {
    orderId: 'ORD-002',
    driverId: DRIVER_UID,
    customerName: 'Bob Martinez',
    address: '1 Hacker Way, Menlo Park, CA 94025',
    coordinates: { lat: 37.484722, lng: -122.148333 },
    status: 'in_progress',
  },
  {
    orderId: 'ORD-003',
    driverId: DRIVER_UID,
    customerName: 'Carol White',
    address: '2747 Park Blvd, Palo Alto, CA 94306',
    coordinates: { lat: 37.4266724, lng: -122.1464843 },
    status: 'pending',
  },
  {
    orderId: 'ORD-004',
    driverId: DRIVER_UID,
    customerName: 'David Lee',
    address: '420 Florence St, Palo Alto, CA 94301',
    coordinates: { lat: 37.446548, lng: -122.161328 },
    status: 'pending',
  },
  {
    orderId: 'ORD-005',
    driverId: DRIVER_UID,
    customerName: 'Emma Garcia',
    address: '350 Serra Mall, Stanford, CA 94305',
    coordinates: { lat: 37.4268619, lng: -122.1698842 },
    status: 'pending',
  },
  {
    orderId: 'ORD-006',
    driverId: DRIVER_UID,
    customerName: 'Frank Wilson',
    address: '550 Memorial Dr, Cambridge, MA 02139',
    coordinates: { lat: 42.359341, lng: -71.094843 },
    status: 'pending',
  },
];

async function seed() {
  const batch = db.batch();

  const userRef = db.doc(`users/${DRIVER_UID}`);
  batch.set(
    userRef,
    {
      email: 'driver@instasupply.com',
      phoneNumber: '+10000000000',
      fcmToken: '',
      location: { lat: 37.4224764, lng: -122.0842499, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  for (const delivery of deliveries) {
    const ref = db.collection('deliveries').doc();
    batch.set(ref, {
      ...delivery,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Seeded ${deliveries.length} deliveries for driver ${DRIVER_UID}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
