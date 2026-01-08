/**
 * Cloudflare Turnstile Helper
 * 
 * Cloudflare Turnstile Managed: Checkbox terlihat dengan branding Cloudflare, auto-check jika mendeteksi user adalah human
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          size?: 'normal' | 'compact';
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      remove: (widgetId?: string) => void;
    };
  }
}

let turnstileWidgetId: string | null = null;
let turnstileToken: string | null = null;

/**
 * Load Cloudflare Turnstile script
 */
export function loadTurnstileScript(forceReload: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.turnstile && !forceReload) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScripts = document.querySelectorAll('script[src*="turnstile"]');
    if (existingScripts.length > 0 && !forceReload) {
      // Wait for turnstile to be available (script might be loading)
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.turnstile) {
          reject(new Error('Turnstile script failed to load'));
        } else {
          resolve();
        }
      }, 10000);
      return;
    }

    // Remove existing scripts if force reload
    if (forceReload && existingScripts.length > 0) {
      existingScripts.forEach((script) => script.remove());
      turnstileWidgetId = null;
      turnstileToken = null;
    }

    // Create and load Cloudflare Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error('Turnstile script loaded but turnstile is not available'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Turnstile script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize Cloudflare Turnstile widget
 * Returns widget ID or null if unavailable
 */
export async function initializeTurnstile(containerId: string = 'turnstile-container'): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn('[Turnstile] Site key not configured');
    return null;
  }

  try {
    // Load script if not already loaded
    if (!window.turnstile) {
      await loadTurnstileScript();
      // Wait a bit for script to fully initialize
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!window.turnstile) {
      console.error('[Turnstile] turnstile is not available');
      return null;
    }

    // Check if container exists
    let container = document.getElementById(containerId);
    if (!container) {
      console.error(`[Turnstile] Container with id "${containerId}" not found`);
      return null;
    }

    // Render Turnstile widget (normal - checkbox terlihat dengan branding Cloudflare)
    if (!window.turnstile.render) {
      console.error('[Turnstile] turnstile.render is not available');
      return null;
    }

    // Remove previous widget if exists
    if (turnstileWidgetId !== null) {
      try {
        window.turnstile.remove(turnstileWidgetId);
      } catch (e) {
        // Ignore remove errors
      }
    }

    turnstileWidgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      size: 'normal', // Checkbox terlihat
      theme: 'auto', // Auto theme based on system preference
      callback: (token: string) => {
        // Token didapat saat checkbox ter-check (auto atau manual)
        turnstileToken = token;
        console.log('[Turnstile] ✅ Token received (checkbox checked)');
      },
      'error-callback': () => {
        console.error('[Turnstile] Error callback triggered');
        turnstileToken = null;
      },
      'expired-callback': () => {
        console.warn('[Turnstile] Token expired, need to re-check');
        turnstileToken = null;
      },
      'timeout-callback': () => {
        console.warn('[Turnstile] Token timeout');
        turnstileToken = null;
      },
    });

    return turnstileWidgetId;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('Invalid site key') || errorMessage.includes('not loaded')) {
      console.warn(
        '[Turnstile] Site key invalid or domain not registered. ' +
        'Please verify:\n' +
        '1. Domain "localhost" is added in Cloudflare Turnstile Dashboard\n' +
        '2. Site key matches the one in Cloudflare Turnstile Dashboard\n' +
        '3. Wait a few minutes after adding domain for changes to propagate'
      );
    } else {
      console.error('[Turnstile] Error initializing:', error);
    }
    return null;
  }
}

/**
 * Execute Cloudflare Turnstile
 * Returns token if checkbox sudah ter-check, null jika belum
 */
export async function executeTurnstile(): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    console.warn('[Turnstile] Site key not configured');
    return null;
  }

  try {
    // Initialize widget if not already initialized
    if (turnstileWidgetId === null) {
      const widgetId = await initializeTurnstile('turnstile-container');
      if (widgetId === null) {
        console.error('[Turnstile] Failed to initialize widget');
        return null;
      }
      turnstileWidgetId = widgetId;
      
      // Wait a bit for widget to render and potentially auto-check
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!window.turnstile || !window.turnstile.getResponse) {
      console.error('[Turnstile] turnstile.getResponse is not available');
      return null;
    }

    // Check if token already available (checkbox sudah ter-check)
    if (turnstileToken) {
      return turnstileToken;
    }

    // Try to get response from widget (jika sudah ter-check)
    try {
      const response = window.turnstile.getResponse(turnstileWidgetId);
      if (response) {
        turnstileToken = response;
        return response;
      }
    } catch (error) {
      // Widget belum ter-check
    }

    // Jika belum ter-check, wait untuk auto-check atau manual check
    // Cloudflare Turnstile Managed akan auto-check jika mendeteksi user adalah human
    console.warn('[Turnstile] Checkbox belum ter-check, waiting for auto-check or manual check...');
    
    // Wait up to 3 seconds for auto-check
    return new Promise<string | null>((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds (100ms * 30)
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        // Check if token is available
        if (turnstileToken) {
          clearInterval(checkInterval);
          resolve(turnstileToken);
          return;
        }

        // Try to get response
        try {
          if (turnstileWidgetId !== null && window.turnstile?.getResponse) {
            const response = window.turnstile.getResponse(turnstileWidgetId);
            if (response) {
              turnstileToken = response;
              clearInterval(checkInterval);
              resolve(response);
              return;
            }
          }
        } catch (error) {
          // Continue checking
        }

        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.warn('[Turnstile] Timeout waiting for checkbox to be checked');
          resolve(null);
        }
      }, 100);
    });
  } catch (error: any) {
    console.error('[Turnstile] Error executing:', error);
    return null;
  }
}

/**
 * Check if Turnstile is enabled
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
