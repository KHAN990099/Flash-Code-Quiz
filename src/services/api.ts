import { SAMPLE_REPO_URL, type Difficulty } from "@/data/samples";

export const GITHUB_REPO_RE = /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

export function isValidRepoUrl(url: string) {
  return GITHUB_REPO_RE.test(url.trim());
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  fileReference?: string;
}

export interface QuizData {
  quizId: string;
  codebaseName: string;
  difficulty: string;
  questions: QuizQuestion[];
  score?: number;
  streak?: number;
  bestStreak?: number;
  answers?: Record<string, { selectedIndex: number; isCorrect: boolean }>;
}

export interface QuizRequest {
  source: "github" | "code" | "paste";
  repoUrl?: string;
  code?: string;
  language?: string;
  difficulty: Difficulty | string;
  count?: number;
}

export interface AnswerResponse {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  score: number;
  streak: number;
  bestStreak: number;
}

export interface QuizResultResponse {
  quizId: string;
  codebaseName: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  streak: number;
  bestStreak: number;
  rank: string;
  badge: string;
  description?: string;
  answeredCount: number;
}

export interface ProgressFileItem {
  file: string;
  total: number;
  correct: number;
  mastery: number;
}

export interface ProgressResponse {
  quizId: string;
  codebaseName: string;
  overallPercentage: number;
  totalQuestions: number;
  totalAnswered: number;
  score: number;
  files: ProgressFileItem[];
}

export interface ChatResponse {
  reply: string;
  quizId: string | null;
}

const API_BASE = ((import.meta.env["VITE_API_URL"] as string) || "http://localhost:5000/api").replace(/\/$/, "");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // response was not JSON
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  sampleRepoUrl: SAMPLE_REPO_URL,

  /**
   * Health check to test backend connectivity
   */
  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string }>(res);
  },

  /**
   * 1. POST /api/quiz/generate
   */
  async generateQuiz(req: QuizRequest): Promise<QuizData> {
    const payload = {
      source: req.source === "code" ? "paste" : req.source,
      repoUrl: req.repoUrl,
      code: req.code,
      difficulty: typeof req.difficulty === "string" ? req.difficulty.toLowerCase() : "intermediate",
      questionCount: req.count || 10,
    };

    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await handleResponse<QuizData>(res);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("codequiz:activeQuizId", data.quizId);
      sessionStorage.setItem("codequiz:activeQuizData", JSON.stringify(data));
    }

    return data;
  },

  /**
   * Legacy alias for backward compatibility with QuizInput
   */
  async createQuiz(req: QuizRequest): Promise<QuizData> {
    return this.generateQuiz(req);
  },

  /**
   * 2. POST /api/quiz/:quizId/answer
   */
  async submitAnswer(quizId: string, questionId: string, selectedIndex: number): Promise<AnswerResponse> {
    const res = await fetch(`${API_BASE}/quiz/${encodeURIComponent(quizId)}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedIndex }),
    });

    return handleResponse<AnswerResponse>(res);
  },

  /**
   * 3. GET /api/quiz/:quizId/result
   */
  async getQuizResult(quizId: string): Promise<QuizResultResponse> {
    const res = await fetch(`${API_BASE}/quiz/${encodeURIComponent(quizId)}/result`);
    return handleResponse<QuizResultResponse>(res);
  },

  /**
   * 4. GET /api/progress/:quizId
   */
  async getProgress(quizId: string): Promise<ProgressResponse> {
    const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(quizId)}`);
    return handleResponse<ProgressResponse>(res);
  },

  /**
   * 5. POST /api/chat
   */
  async sendChatMessage(
    quizId: string | null,
    message: string,
    questionId?: string,
    history?: Array<{ role: string; text: string }>
  ): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        questionId: questionId || undefined,
        message,
        history: history || [],
      }),
    });

    return handleResponse<ChatResponse>(res);
  },

  /**
   * Optional: GET /api/quiz/:quizId
   */
  async getQuiz(quizId: string): Promise<QuizData> {
    const res = await fetch(`${API_BASE}/quiz/${encodeURIComponent(quizId)}`);
    return handleResponse<QuizData>(res);
  },
};
