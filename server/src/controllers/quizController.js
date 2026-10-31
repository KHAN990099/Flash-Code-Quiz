import crypto from "crypto";
import { fetchRepoContext } from "../services/githubService.js";
import { geminiService } from "../services/geminiService.js";
import { quizStore } from "../store/quizStore.js";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Helper to generate unique quiz ID
 */
function generateId() {
  return "quiz_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
}

/**
 * 1. POST /api/quiz/generate
 */
export async function generateQuizHandler(req, res) {
  const { source, repoUrl, code, difficulty = "intermediate", questionCount = 10 } = req.body;

  // Validation
  if (!source || !["github", "paste", "code"].includes(source)) {
    throw new AppError("Invalid or missing 'source'. Must be 'github' or 'paste'.", 400);
  }

  let codeContext = "";
  let codebaseName = "Codebase";

  if (source === "github") {
    if (!repoUrl || typeof repoUrl !== "string") {
      throw new AppError("A valid GitHub repository URL is required when source is 'github'.", 400);
    }
    const repoData = await fetchRepoContext(repoUrl);
    codeContext = repoData.codeContext;
    codebaseName = repoData.codebaseName;
  } else {
    // Pasted code snippet
    if (!code || typeof code !== "string" || code.trim().length < 10) {
      throw new AppError("Pasted code must contain at least 10 characters.", 400);
    }
    codebaseName = "Custom Code Snippet";
    codeContext = `--- PASTED CODE SNIPPET ---\n${code.trim()}\n`;
  }

  const validDifficulties = ["beginner", "intermediate", "advanced"];
  const normalizedDifficulty = validDifficulties.includes((difficulty || "").toLowerCase())
    ? difficulty.toLowerCase()
    : "intermediate";

  const count = Math.min(Math.max(parseInt(questionCount, 10) || 10, 3), 30);

  // Generate with Gemini
  const questions = await geminiService.generateQuiz({
    codebaseName,
    codeContext,
    difficulty: normalizedDifficulty,
    questionCount: count,
  });

  const quizId = generateId();

  // Save in store
  const savedQuiz = await quizStore.createQuiz({
    quizId,
    codebaseName,
    source: source === "code" ? "paste" : source,
    repoUrl: source === "github" ? repoUrl : null,
    difficulty: normalizedDifficulty,
    codeContext,
    questions,
  });

  logger.info(`Created quiz ${quizId} for ${codebaseName} with ${questions.length} questions.`);

  res.status(201).json({
    quizId: savedQuiz.quizId,
    codebaseName: savedQuiz.codebaseName,
    difficulty: savedQuiz.difficulty,
    questions: savedQuiz.questions,
  });
}

/**
 * 2. POST /api/quiz/:quizId/answer
 */
export async function submitAnswerHandler(req, res) {
  const { quizId } = req.params;
  const { questionId, selectedIndex } = req.body;

  if (!quizId) {
    throw new AppError("Quiz ID is required in URL parameter.", 400);
  }

  if (questionId === undefined || questionId === null) {
    throw new AppError("Missing 'questionId' in request body.", 400);
  }

  if (selectedIndex === undefined || selectedIndex === null || isNaN(Number(selectedIndex))) {
    throw new AppError("Missing or invalid 'selectedIndex'. Must be a number (0-3).", 400);
  }

  const index = Number(selectedIndex);
  if (index < 0 || index > 3) {
    throw new AppError("'selectedIndex' must be between 0 and 3.", 400);
  }

  const result = await quizStore.recordAnswer(quizId, questionId, index);

  if (!result) {
    throw new AppError(`Quiz with ID '${quizId}' was not found.`, 404);
  }

  res.status(200).json(result);
}

/**
 * 3. GET /api/quiz/:quizId/result
 */
export async function getResultHandler(req, res) {
  const { quizId } = req.params;
  if (!quizId) {
    throw new AppError("Quiz ID is required.", 400);
  }

  const result = await quizStore.getResult(quizId);
  if (!result) {
    throw new AppError(`Quiz with ID '${quizId}' was not found.`, 404);
  }

  res.status(200).json(result);
}

/**
 * 4. GET /api/progress/:quizId
 */
export async function getProgressHandler(req, res) {
  const { quizId } = req.params;
  if (!quizId) {
    throw new AppError("Quiz ID is required.", 400);
  }

  const progress = await quizStore.getProgress(quizId);
  if (!progress) {
    throw new AppError(`Quiz with ID '${quizId}' was not found.`, 404);
  }

  res.status(200).json(progress);
}

/**
 * 5. POST /api/chat
 */
export async function chatHandler(req, res) {
  const { quizId, questionId, message, history = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new AppError("A non-empty 'message' string is required.", 400);
  }

  let codebaseName = "Codebase";
  let codeContext = "";
  let questionContext = null;

  if (quizId) {
    const quiz = await quizStore.getQuiz(quizId);
    if (quiz) {
      codebaseName = quiz.codebaseName;
      codeContext = quiz.codeContext;

      if (questionId) {
        const question = quiz.questions.find((q) => String(q.id) === String(questionId));
        if (question) {
          questionContext = {
            question: question.question,
            options: question.options,
            correctOption: question.options[question.correctIndex],
            explanation: question.explanation,
            fileReference: question.fileReference,
            userSelected: quiz.answers[questionId]?.selectedIndex !== undefined
              ? question.options[quiz.answers[questionId].selectedIndex]
              : null,
          };
        }
      }
    }
  }

  const reply = await geminiService.answerChat({
    codebaseName,
    codeContext,
    questionContext,
    message: message.trim(),
    history,
  });

  if (quizId) {
    await quizStore.appendChat(quizId, message, reply, questionId);
  }

  res.status(200).json({
    reply,
    quizId: quizId || null,
  });
}

/**
 * Optional helper: GET /api/quiz/:quizId
 */
export async function getQuizHandler(req, res) {
  const { quizId } = req.params;
  const quiz = await quizStore.getQuiz(quizId);
  if (!quiz) {
    throw new AppError(`Quiz '${quizId}' not found.`, 404);
  }

  res.status(200).json({
    quizId: quiz.quizId,
    codebaseName: quiz.codebaseName,
    difficulty: quiz.difficulty,
    source: quiz.source,
    repoUrl: quiz.repoUrl,
    questions: quiz.questions,
    score: quiz.score,
    streak: quiz.streak,
    bestStreak: quiz.bestStreak,
    answers: quiz.answers,
  });
}
