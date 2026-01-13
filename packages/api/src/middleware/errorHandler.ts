import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static validationError(details: Record<string, unknown>): ApiError {
    return new ApiError('Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Format Zod validation errors into a user-friendly structure
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  } else {
    // In production, log essential info only
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: formatZodError(err),
    });
    return;
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.name,
      code: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle Supabase errors
  if (err.message?.includes('JWT')) {
    res.status(401).json({
      error: 'Authentication Error',
      code: 'AUTH_ERROR',
      message: 'Invalid or expired authentication token',
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Bad Request',
      code: 'PARSE_ERROR',
      message: 'Invalid JSON in request body',
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: config.nodeEnv === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    message: 'The requested resource does not exist',
  });
};
