export const turnstileConfig = {
  secretKey: process.env.TURNSTILE_SECRET_KEY || '',
  verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
};

export const isTurnstileEnabled = !!process.env.TURNSTILE_SECRET_KEY;
