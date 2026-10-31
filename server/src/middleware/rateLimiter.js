import rateLimit from "express-rate-limit";

// General rate limiter for all endpoints (100 requests per 15 minutes per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Stricter rate limiter for quiz generation (e.g. 15 quiz generations per 10 minutes)
export const quizGenerateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many quiz generation requests. Please wait a few minutes before generating more quizzes.",
  },
});
