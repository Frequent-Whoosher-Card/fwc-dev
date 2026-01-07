/**
 * Google reCAPTCHA v3 Helper
 * 
 * Note: reCAPTCHA v3 is also used by Firebase App Check as its provider.
 * This helper provides a way to execute reCAPTCHA v3 independently if needed.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

/**
 * Load reCAPTCHA v3 script
 */
export function loadRecaptchaScript(forceReload: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded (skip if force reload)
    if (window.grecaptcha && !forceReload) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScripts = document.querySelectorAll('script[src*="recaptcha"]');
    if (existingScripts.length > 0) {
      // Check if any script has the correct render parameter
      const siteKeyForScript = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      const hasCorrectScript = Array.from(existingScripts).some((s: any) => 
        s.src.includes(`render=${siteKeyForScript}`) || s.src.includes(`render=${encodeURIComponent(siteKeyForScript)}`)
      );
      
      if (hasCorrectScript && window.grecaptcha) {
        resolve();
        return;
      }
      
      // Wait for grecaptcha to be available (script might be loading)
      const checkInterval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA script failed to load'));
        } else {
          resolve();
        }
      }, 10000);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    const siteKeyForScript = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const scriptUrl = `https://www.google.com/recaptcha/api.js?render=${siteKeyForScript}`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha) {
        resolve();
      } else {
        reject(new Error('reCAPTCHA script loaded but grecaptcha is not available'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA v3
 * Returns token string or null if unavailable
 */
export async function executeRecaptcha(action: string = 'login'): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('[reCAPTCHA] Site key not configured');
    return null;
  }

  try {
    // Check if script is already loaded with correct render parameter
    const existingScripts = document.querySelectorAll('script[src*="recaptcha"]');
    const siteKeyForScript = siteKey;
    let hasCorrectScript = false;
    
    if (existingScripts.length > 0) {
      hasCorrectScript = Array.from(existingScripts).some((s: any) => 
        s.src.includes(`render=${siteKeyForScript}`) || s.src.includes(`render=${encodeURIComponent(siteKeyForScript)}`)
      );
    }
    
    // Load script if not already loaded or if existing script doesn't have correct render parameter
    if (!window.grecaptcha || !hasCorrectScript) {
      // If script exists but wrong render param, we need to reload with correct param
      if (hasCorrectScript === false && existingScripts.length > 0) {
        // Remove existing script tags
        existingScripts.forEach((script) => script.remove());
        // Wait a bit for scripts to be removed, then load new one
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Force load script even if grecaptcha exists (to ensure correct render param)
      await loadRecaptchaScript(true);
      
      // Wait a bit more to ensure script is fully loaded
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!window.grecaptcha) {
      console.error('[reCAPTCHA] grecaptcha is not available');
      return null;
    }

    // Wait for grecaptcha to be ready
    await new Promise<void>((resolve) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });

    // Execute reCAPTCHA
    if (!window.grecaptcha) {
      console.error('[reCAPTCHA] grecaptcha is not available after ready');
      return null;
    }

    const token = await window.grecaptcha.execute(siteKey, { action });
    return token;
  } catch (error: any) {
    // Check if error is about invalid site key or domain
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('Invalid site key') || errorMessage.includes('not loaded')) {
      console.warn(
        '[reCAPTCHA] Site key invalid or domain not registered. ' +
        'Please verify:\n' +
        '1. Domain "localhost" is added in reCAPTCHA Admin Console\n' +
        '2. Site key matches the one in reCAPTCHA Admin Console\n' +
        '3. Wait a few minutes after adding domain for changes to propagate'
      );
    } else {
      console.error('[reCAPTCHA] Error executing:', error);
    }
    return null;
  }
}

/**
 * Check if reCAPTCHA is enabled
 */
export function isRecaptchaEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}

