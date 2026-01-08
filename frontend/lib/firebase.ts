import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, getToken, AppCheck } from 'firebase/app-check';

let app: FirebaseApp | null = null;
let appCheck: AppCheck | null = null;

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase App
 */
export function initializeFirebase(): FirebaseApp | null {
  // Return existing app if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Check if required config is available
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    console.warn(
      '[Firebase] Missing configuration. Firebase App Check will be disabled.'
    );
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    return app;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return null;
  }
}

/**
 * Initialize Firebase App Check
 */
export function setupAppCheck(): AppCheck | null {
  // Return existing App Check if already initialized
  if (appCheck) {
    return appCheck;
  }

  // Initialize Firebase App first
  if (!app) {
    app = initializeFirebase();
  }

  if (!app) {
    console.warn('[App Check] Firebase app not initialized');
    return null;
  }

  // IMPORTANT: Firebase App Check REQUIRES reCAPTCHA v3 as provider
  // This is separate from Cloudflare Turnstile used at application level
  // You need a separate reCAPTCHA v3 site key specifically for Firebase App Check
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.warn(
      '[App Check] reCAPTCHA v3 site key not configured. App Check will be disabled.\n' +
      'Note: Firebase App Check requires reCAPTCHA v3 (not Turnstile).\n' +
      'Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in your .env file.\n' +
      'This is separate from Cloudflare Turnstile used for application-level verification.'
    );
    return null;
  }

  try {
    // Initialize App Check with reCAPTCHA v3 provider (Firebase internal requirement)
    // This reCAPTCHA v3 site key is ONLY for Firebase App Check, not for the application
    const provider = new ReCaptchaV3Provider(recaptchaSiteKey);
    appCheck = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });

    return appCheck;
  } catch (error) {
    console.error('[App Check] Initialization error:', error);
    return null;
  }
}

/**
 * Get Firebase App Check token
 * Returns token string or null if unavailable
 */
export async function getAppCheckToken(): Promise<string | null> {
  // Ensure App Check is initialized
  if (!appCheck) {
    appCheck = setupAppCheck();
    // Wait a bit for App Check to be ready
    if (appCheck) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!appCheck) {
    console.warn('[App Check] App Check not initialized');
    return null;
  }

  try {
    const { token } = await getToken(appCheck, false);
    return token;
  } catch (error) {
    console.error('[App Check] Error getting token:', error);
    return null;
  }
}

/**
 * Check if Firebase App Check is enabled
 */
export function isAppCheckEnabled(): boolean {
  // Firebase App Check requires reCAPTCHA v3 site key (not Turnstile)
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY // Must be reCAPTCHA v3, not Turnstile
  );
}

