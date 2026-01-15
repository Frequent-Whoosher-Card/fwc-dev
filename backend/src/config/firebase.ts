import admin from "firebase-admin";

let firebaseAppInitialized = false;

export function initializeFirebaseAdmin() {
  if (firebaseAppInitialized) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn(
      "Firebase App Check: Missing configuration. App Check verification will be disabled."
    );
    return;
  }

  try {
    // Check if an app is already initialized to prevent re-initialization errors
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      firebaseAppInitialized = true;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// Call initialization immediately to ensure it's ready when needed
initializeFirebaseAdmin();

export const firebaseAdmin = admin;
export const isFirebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);
