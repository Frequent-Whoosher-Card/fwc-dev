export const jwtConfig = {
  secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  expiresIn: process.env.JWT_EXPIRES_IN || "7d", // 7 days default
  cookieName: "session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  },
};

export const passwordResetConfig = {
  tokenExpiresIn: 60 * 60 * 1000, // 1 hour in milliseconds
  tokenLength: 32, // Length of random token
};
