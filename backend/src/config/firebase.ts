import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
// Safely check if apps exist (Bun compatibility)
let isInitialized = false;
try {
  if (admin.apps) {
    isInitialized = admin.apps.length > 0;
  }
} catch {
  // If apps property is not accessible, assume not initialized
  isInitialized = false;
}

if (!isInitialized) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn(
      'Firebase App Check: Missing configuration. App Check verification will be disabled.'
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
}

export const firebaseAdmin = admin;
export const isFirebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

