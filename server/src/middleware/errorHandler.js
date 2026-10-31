import { logger } from "../utils/logger.js";

/**
 * Custom AppError for deliberate operational errors with specific HTTP status codes
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Central Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  let message = err.message || "An unexpected error occurred.";

  // Sanitize message: never leak sensitive API keys or credentials
  if (typeof message === "string" && message.includes("AIzaSy")) {
    message = "External AI service error. Please verify your API key configuration.";
  }

  logger.error(`[${req.method} ${req.originalUrl}] Status ${statusCode}: ${message}`);
  if (statusCode === 500 && process.env.NODE_ENV !== "production") {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
