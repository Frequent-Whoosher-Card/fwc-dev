import axios from "axios";
import { turnstileConfig, isTurnstileEnabled } from "../config/turnstile";
import { AuthenticationError } from "../utils/errors";

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Verify Cloudflare Turnstile token
 * Returns true if verification successful, throws error if invalid
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  // Skip verification if Turnstile is not configured (for development)
  if (!isTurnstileEnabled) {
    console.warn(
      "[Turnstile] Secret key not configured, skipping verification"
    );
    return true;
  }

  // Allow bypass with "disabled" token
  if (token === 'disabled') {
    return true;
  }

  if (!token || typeof token !== "string") {
    throw new AuthenticationError("Turnstile token is required");
  }

  try {
    // Cloudflare Turnstile uses form-urlencoded format
    const formData = new URLSearchParams();
    formData.append('secret', turnstileConfig.secretKey);
    formData.append('response', token);

    const response = await axios.post<TurnstileVerifyResponse>(
      turnstileConfig.verifyUrl,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { success, "error-codes": errorCodes, hostname } = response.data;

    if (!success) {
      const errorMessage =
        errorCodes && errorCodes.length > 0
          ? `Turnstile verification failed: ${errorCodes.join(", ")}`
          : "Turnstile verification failed";
      console.error("[Turnstile] Verification failed:", {
        errorCodes,
        hostname,
      });
      throw new AuthenticationError(errorMessage);
    }

    return true;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      console.error("[Turnstile] API error:", error.message);
      throw new AuthenticationError(
        "Turnstile verification service unavailable"
      );
    }

    console.error("[Turnstile] Verification error:", error);
    throw new AuthenticationError("Turnstile verification failed");
  }
}
