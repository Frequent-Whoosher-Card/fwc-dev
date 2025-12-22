export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed", code?: string) {
    super(message, 401, code || "AUTH_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Unauthorized access", code?: string) {
    super(message, 403, code || "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", code?: string) {
    super(message, 404, code || "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code || "CONFLICT");
  }
}

/**
 * Format error response for API
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || error.name,
        statusCode: error.statusCode,
      },
    };
  }

  // Unknown error
  return {
    success: false,
    error: {
      message: error instanceof Error ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    },
  };
}

