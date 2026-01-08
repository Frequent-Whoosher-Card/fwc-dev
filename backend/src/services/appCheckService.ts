import { firebaseAdmin, isFirebaseEnabled } from '../config/firebase';
import { AuthenticationError } from '../utils/errors';

/**
 * Verify Firebase App Check token
 * Returns true if token is valid, throws error if invalid
 */
export async function verifyAppCheckToken(token: string): Promise<boolean> {
  // Skip verification if Firebase is not configured (for development)
  if (!isFirebaseEnabled) {
    console.warn('[App Check] Firebase not configured, skipping verification');
    return true;
  }

  if (!token || typeof token !== 'string') {
    throw new AuthenticationError('App Check token is required');
  }

  try {
    const appCheckClaims = await firebaseAdmin.appCheck().verifyToken(token);

    // Token is valid
    if (appCheckClaims && appCheckClaims.appId) {
      console.log('[App Check] ✅ Token verified successfully', {
        appId: appCheckClaims.appId,
      });
      return true;
    }

    throw new AuthenticationError('Invalid app verification');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    // Handle Firebase App Check errors
    console.error('[App Check] ❌ Verification error:', error);
    throw new AuthenticationError('Invalid app verification');
  }
}

