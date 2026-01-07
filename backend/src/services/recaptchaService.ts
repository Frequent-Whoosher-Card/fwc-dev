import axios from 'axios';
import { recaptchaConfig, isRecaptchaEnabled } from '../config/recaptcha';
import { AuthenticationError } from '../utils/errors';

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify Google reCAPTCHA v3 token
 * Returns true if score >= threshold, throws error if invalid or low score
 */
export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  // Skip verification if reCAPTCHA is not configured (for development)
  if (!isRecaptchaEnabled) {
    console.warn('[reCAPTCHA] Secret key not configured, skipping verification');
    return true;
  }

  if (!token || typeof token !== 'string') {
    throw new AuthenticationError('reCAPTCHA token is required');
  }

  try {
    const response = await axios.post<RecaptchaVerifyResponse>(
      recaptchaConfig.verifyUrl,
      null,
      {
        params: {
          secret: recaptchaConfig.secretKey,
          response: token,
        },
      }
    );

    const { success, score, 'error-codes': errorCodes } = response.data;

    if (!success) {
      const errorMessage =
        errorCodes && errorCodes.length > 0
          ? `reCAPTCHA verification failed: ${errorCodes.join(', ')}`
          : 'reCAPTCHA verification failed';
      throw new AuthenticationError(errorMessage);
    }

    // Check score threshold
    if (score === undefined || score < recaptchaConfig.scoreThreshold) {
      console.warn('[reCAPTCHA] ❌ Score too low', {
        score,
        threshold: recaptchaConfig.scoreThreshold,
        hostname: response.data.hostname,
      });
      throw new AuthenticationError(
        `reCAPTCHA verification failed: Score ${score} is below threshold ${recaptchaConfig.scoreThreshold}`
      );
    }

    console.log('[reCAPTCHA] ✅ Token verified successfully', {
      score,
      threshold: recaptchaConfig.scoreThreshold,
      hostname: response.data.hostname,
    });
    return true;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      console.error('[reCAPTCHA] API error:', error.message);
      throw new AuthenticationError('reCAPTCHA verification service unavailable');
    }

    console.error('[reCAPTCHA] Verification error:', error);
    throw new AuthenticationError('reCAPTCHA verification failed');
  }
}

