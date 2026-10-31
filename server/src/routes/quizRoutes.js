import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateQuizHandler,
  submitAnswerHandler,
  getResultHandler,
  getProgressHandler,
  chatHandler,
  getQuizHandler,
} from "../controllers/quizController.js";
import { quizGenerateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Quiz generation
router.post("/quiz/generate", quizGenerateLimiter, asyncHandler(generateQuizHandler));

// Quiz question answer submission
router.post("/quiz/:quizId/answer", asyncHandler(submitAnswerHandler));

// Quiz result and rank badge
router.get("/quiz/:quizId/result", asyncHandler(getResultHandler));

// Codebase progress & mastery breakdown
router.get("/progress/:quizId", asyncHandler(getProgressHandler));

// AI Mentor chat
router.post("/chat", asyncHandler(chatHandler));

// Retrieve quiz details
router.get("/quiz/:quizId", asyncHandler(getQuizHandler));

export default router;
