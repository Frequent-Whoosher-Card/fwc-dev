export const recaptchaConfig = {
  secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  verifyUrl: 'https://www.google.com/recaptcha/api/siteverify',
  scoreThreshold: parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5'),
};

export const isRecaptchaEnabled = !!process.env.RECAPTCHA_SECRET_KEY;

