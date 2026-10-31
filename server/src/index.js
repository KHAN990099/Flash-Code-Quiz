import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import quizRoutes from "./routes/quizRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { logger } from "./utils/logger.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:8080,http://localhost:5173";
const allowedOrigins = rawClientUrls.split(",").map((u) => u.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`Blocked by CORS: ${origin}`);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// General rate limiter for all /api requests
app.use("/api", apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root ping
app.get("/", (req, res) => {
  res.json({
    name: "CodeQuiz API",
    status: "online",
    endpoints: {
      health: "/api/health",
      generateQuiz: "POST /api/quiz/generate",
      submitAnswer: "POST /api/quiz/:quizId/answer",
      quizResult: "GET /api/quiz/:quizId/result",
      progress: "GET /api/progress/:quizId",
      chat: "POST /api/chat",
    },
  });
});

// Mount API routes
app.use("/api", quizRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}`, statusCode: 404 });
});

// Central error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 CodeQuiz Server running on http://localhost:${PORT}`);
  logger.info(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});
