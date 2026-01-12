import { t } from 'elysia';

export namespace AuthModel {
  // Login Request
  export const loginBody = t.Object({
    username: t.String({
      minLength: 3,
      maxLength: 100,
      description: 'Username or email',
      default: 'rama',
      examples: ['rama'],
    }),
    password: t.String({
      minLength: 6,
      description: 'Password',
      default: 'ramaPassword',
      examples: ['ramaPassword'],
    }),
    appCheckToken: t.String({
      description: 'Firebase App Check token (required) - Verifies request comes from legitimate application',
      minLength: 1,
      examples: ['eyJraWQiOiJ2ckU4dWciLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...'],
    }),
    turnstileToken: t.String({
      description: 'Cloudflare Turnstile token (required) - Verifies human interaction (Managed mode with auto-check)',
      minLength: 1,
      examples: ['0.abc123...'],
    }),
  });

  // Simple Login Request (for Swagger/testing - no security tokens)
  export const simpleLoginBody = t.Object({
    username: t.String({
      minLength: 3,
      maxLength: 100,
      description: 'Username or email',
      default: 'rama',
      examples: ['rama'],
    }),
    password: t.String({
      minLength: 6,
      description: 'Password',
      default: 'ramaPassword',
      examples: ['ramaPassword'],
    }),
  });

  // Login Response
  export const loginResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      user: t.Object({
        id: t.String(),
        username: t.String(),
        fullName: t.String(),
        email: t.Nullable(t.String()),
        role: t.Object({
          id: t.String(),
          roleCode: t.String(),
          roleName: t.String(),
        }),
      }),
      token: t.String(),
    }),
    message: t.String(),
  });

  // Error Response
  export const errorResponse = t.Object({
    success: t.Boolean(),
    error: t.Object({
      message: t.String(),
      code: t.String(),
      statusCode: t.Number(),
    }),
  });

  // Forgot Password Request
  export const forgotPasswordBody = t.Object({
    email: t.String({
      format: 'email',
      description: 'Email address',
    }),
  });

  // Forgot Password Response
  export const forgotPasswordResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  // Reset Password Request
  export const resetPasswordBody = t.Object({
    token: t.String({
      description: 'Password reset token',
    }),
    newPassword: t.String({
      minLength: 8,
      description: 'New password (min 8 characters)',
    }),
    confirmPassword: t.String({
      description: 'Confirm new password',
    }),
  });

  // Reset Password Response
  export const resetPasswordResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  // Logout Response
  export const logoutResponse = t.Object({
    success: t.Boolean(),
    message: t.String(),
  });

  // Me/Profile Response
  export const meResponse = t.Object({
    success: t.Boolean(),
    data: t.Object({
      id: t.String(),
      username: t.String(),
      fullName: t.String(),
      email: t.Nullable(t.String()),
      phone: t.Nullable(t.String()),
      role: t.Object({
        id: t.String(),
        roleCode: t.String(),
        roleName: t.String(),
      }),
      isActive: t.Boolean(),
      lastLogin: t.Nullable(t.String()),
      stationId: t.Nullable(t.String({ format: "uuid" })),
    }),
  });
}
