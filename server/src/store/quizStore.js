import { calculateRank } from "../utils/tierCalculator.js";

/**
 * QuizStore provides an abstraction over data persistence.
 * Currently uses in-memory Maps.
 * Swapping to Mongoose/MongoDB later only requires updating this file
 * or providing a MongoDB-backed implementation of these same method signatures.
 */
class QuizStore {
  constructor() {
    this.quizzes = new Map();
  }

  /**
   * Save a newly generated quiz
   */
  async createQuiz(data) {
    const quiz = {
      quizId: data.quizId,
      codebaseName: data.codebaseName || "Codebase",
      source: data.source,
      repoUrl: data.repoUrl || null,
      difficulty: data.difficulty || "intermediate",
      codeContext: data.codeContext || "",
      questions: data.questions || [],
      // Session state
      answers: {},
      score: 0,
      streak: 0,
      bestStreak: 0,
      chatHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.quizzes.set(quiz.quizId, quiz);
    return quiz;
  }

  /**
   * Retrieve a quiz by ID
   */
  async getQuiz(quizId) {
    return this.quizzes.get(quizId) || null;
  }

  /**
   * Record a user's answer to a specific question
   */
  async recordAnswer(quizId, questionId, selectedIndex) {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return null;
    }

    const question = quiz.questions.find((q) => String(q.id) === String(questionId));
    if (!question) {
      throw new Error(`Question ${questionId} not found in quiz ${quizId}`);
    }

    const isCorrect = Number(selectedIndex) === Number(question.correctIndex);
    const alreadyAnswered = quiz.answers[questionId];

    // Only update streak & score if not answered previously
    if (!alreadyAnswered) {
      if (isCorrect) {
        quiz.score += 1;
        quiz.streak += 1;
        if (quiz.streak > quiz.bestStreak) {
          quiz.bestStreak = quiz.streak;
        }
      } else {
        quiz.streak = 0;
      }
    }

    quiz.answers[questionId] = {
      selectedIndex: Number(selectedIndex),
      isCorrect,
      answeredAt: new Date(),
    };
    quiz.updatedAt = new Date();

    return {
      correct: isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      score: quiz.score,
      streak: quiz.streak,
      bestStreak: quiz.bestStreak,
    };
  }

  /**
   * Get overall results and rank tier
   */
  async getResult(quizId) {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return null;
    }

    const total = quiz.questions.length;
    const score = quiz.score;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const tierInfo = calculateRank(percentage);

    return {
      quizId,
      codebaseName: quiz.codebaseName,
      difficulty: quiz.difficulty,
      score,
      total,
      percentage,
      streak: quiz.streak,
      bestStreak: quiz.bestStreak,
      rank: tierInfo.rank,
      badge: tierInfo.badge,
      description: tierInfo.description,
      answeredCount: Object.keys(quiz.answers).length,
    };
  }

  /**
   * Compute codebase mastery progress broken down by file reference
   */
  async getProgress(quizId) {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return null;
    }

    const fileStats = {};
    for (const q of quiz.questions) {
      const fileKey = q.fileReference || "General";
      if (!fileStats[fileKey]) {
        fileStats[fileKey] = { file: fileKey, total: 0, correct: 0 };
      }
      fileStats[fileKey].total += 1;

      const ans = quiz.answers[q.id];
      if (ans && ans.isCorrect) {
        fileStats[fileKey].correct += 1;
      }
    }

    const fileBreakdown = Object.values(fileStats).map((item) => ({
      file: item.file,
      total: item.total,
      correct: item.correct,
      mastery: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    }));

    const totalQuestions = quiz.questions.length;
    const totalAnswered = Object.keys(quiz.answers).length;
    const overallPercentage = totalQuestions > 0 ? Math.round((quiz.score / totalQuestions) * 100) : 0;

    return {
      quizId,
      codebaseName: quiz.codebaseName,
      overallPercentage,
      totalQuestions,
      totalAnswered,
      score: quiz.score,
      files: fileBreakdown,
    };
  }

  /**
   * Append a chat interaction for this quiz
   */
  async appendChat(quizId, userMessage, assistantReply, questionId = null) {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return null;
    }

    const interaction = {
      questionId,
      userMessage,
      assistantReply,
      timestamp: new Date(),
    };

    quiz.chatHistory.push(interaction);
    return interaction;
  }

  /**
   * Get chat history for quiz
   */
  async getChatHistory(quizId) {
    const quiz = this.quizzes.get(quizId);
    return quiz ? quiz.chatHistory : [];
  }
}

export const quizStore = new QuizStore();
