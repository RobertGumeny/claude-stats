import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format for API endpoints
 * Ensures consistent error messaging across all endpoints
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: string | Record<string, unknown>;
  timestamp: string;
}

/**
 * Custom error class for API errors with HTTP status codes
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: string | Record<string, unknown>;

  constructor(
    message: string,
    status: number = 500,
    details?: string | Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Express error handling middleware
 * Catches all errors and formats them consistently
 *
 * Usage: Add as the last middleware in your Express app
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Log the error for debugging
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Determine status code
  const status = err instanceof ApiError ? err.status : 500;

  // Determine error message (don't leak internal details in production)
  const message = err instanceof ApiError
    ? err.message
    : 'Internal server error';

  // Build error response
  const errorResponse: ApiErrorResponse = {
    status,
    message,
    timestamp: new Date().toISOString()
  };

  // Add details if available (only for ApiError instances)
  if (err instanceof ApiError && err.details) {
    errorResponse.details = err.details;
  }

  // Send error response
  res.status(status).json(errorResponse);
}

/**
 * Async route handler wrapper to catch promise rejections
 * Automatically forwards errors to Express error handler
 *
 * Usage:
 * app.get('/api/data', asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   res.json(data);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error helper
 * Creates a 400 Bad Request error with validation details
 */
export function validationError(
  message: string,
  details?: Record<string, string>
): ApiError {
  return new ApiError(message, 400, details);
}

/**
 * Not found error helper
 * Creates a 404 Not Found error
 */
export function notFoundError(resource: string, identifier?: string): ApiError {
  const message = identifier
    ? `${resource} '${identifier}' not found`
    : `${resource} not found`;
  return new ApiError(message, 404);
}

/**
 * File read error helper
 * Creates a 500 Internal Server Error for file system issues
 */
export function fileReadError(filePath: string, error: Error): ApiError {
  return new ApiError(
    'Error reading file',
    500,
    {
      filePath,
      error: error.message
    }
  );
}

/**
 * Parse error helper for corrupted JSONL files
 * Creates a 422 Unprocessable Entity error
 */
export function parseError(
  filePath: string,
  lineNumber?: number,
  details?: string
): ApiError {
  const message = lineNumber
    ? `Failed to parse file at line ${lineNumber}`
    : 'Failed to parse file';

  return new ApiError(message, 422, {
    filePath,
    lineNumber,
    details
  });
}

/**
 * Logger utility for consistent logging format
 */
export class Logger {
  /**
   * Log informational message
   */
  static info(message: string, data?: Record<string, unknown>): void {
    console.log('[INFO]', new Date().toISOString(), message, data || '');
  }

  /**
   * Log warning message
   */
  static warn(message: string, data?: Record<string, unknown>): void {
    console.warn('[WARN]', new Date().toISOString(), message, data || '');
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    console.error('[ERROR]', new Date().toISOString(), message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data
    });
  }

  /**
   * Log debug message (only in development)
   */
  static debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', new Date().toISOString(), message, data || '');
    }
  }
}
