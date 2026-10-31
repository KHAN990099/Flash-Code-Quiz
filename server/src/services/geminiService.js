import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Clean and extract JSON from model response
 */
function extractJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty model response.");
  }

  // Remove markdown code fences like ```json or ```
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  cleaned = cleaned.trim();

  // If there's extra text before { or [, find the first occurrence
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket !== -1) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }
  }

  return JSON.parse(cleaned);
}

/**
 * Validate that questions array conforms strictly to required schema
 */
function validateQuestions(data, expectedCount = 10) {
  let questions = Array.isArray(data) ? data : data?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid structure: 'questions' array is missing or empty.");
  }

  return questions.map((q, idx) => {
    if (!q.question || typeof q.question !== "string") {
      throw new Error(`Question #${idx + 1} has missing or invalid 'question' text.`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question #${idx + 1} must have exactly 4 options.`);
    }

    const correctIndex = Number(q.correctIndex);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new Error(`Question #${idx + 1} 'correctIndex' must be between 0 and 3.`);
    }

    return {
      id: q.id ? String(q.id) : `q_${idx + 1}`,
      question: q.question.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctIndex,
      explanation: q.explanation ? String(q.explanation).trim() : "Correct answer based on the codebase implementation.",
      fileReference: q.fileReference ? String(q.fileReference).trim() : "General Codebase",
    };
  });
}

/**
 * Build difficulty-specific instructions
 */
function getDifficultyInstructions(difficulty) {
  const diff = (difficulty || "intermediate").toLowerCase();
  switch (diff) {
    case "beginner":
      return `DIFFICULTY: BEGINNER
- Focus on overall project purpose, entry points, basic syntax, and what major files or functions do.
- Keep questions clear, accessible, and direct.
- Explain terms clearly in the explanations.`;
    case "advanced":
      return `DIFFICULTY: ADVANCED
- Focus on architectural patterns, edge cases, state transitions, security, asynchronous flows, concurrency, and performance considerations.
- Include questions that require tracing multi-file interactions.
- Provide detailed architectural explanations.`;
    case "intermediate":
    default:
      return `DIFFICULTY: INTERMEDIATE
- Focus on data flow between components/modules, error handling, middleware, API contracts, and key functions.
- Test realistic understanding of how the codebase works under the hood.`;
  }
}

/**
 * Fallback generator when GEMINI_API_KEY is not yet added to .env
 * Ensures the system can be tested immediately without breaking.
 */
function generateFallbackQuestions(codebaseName, codeContext, count = 10, difficulty = "intermediate") {
  // Extract discovered file references from codeContext
  const fileMatches = Array.from(codeContext.matchAll(/--- FILE:\s*([^\s-]+)\s*---/g)).map((m) => m[1]);
  const primaryFiles = fileMatches.length > 0 ? fileMatches : ["src/index.js", "src/routes/api.js", "package.json"];

  const templates = [
    {
      q: `In ${codebaseName}, what is the primary role of the main entry point file?`,
      options: [
        "Initializes application middleware, configures routes, and starts the server listener",
        "Directly defines all database migrations and database schema files",
        "Compiles TypeScript files into native binary machine code",
        "Handles user authentication UI rendering and client local storage",
      ],
      correctIndex: 0,
      explanation: "The primary entry point sets up the application instance, registers necessary middleware, and binds the HTTP port.",
      file: primaryFiles[0] || "src/index.js",
    },
    {
      q: `How are unhandled exceptions and operational errors managed across this codebase?`,
      options: [
        "Errors crash the process silently without logging",
        "A centralized error handler middleware intercepts exceptions and standardizes HTTP responses",
        "All errors are written directly to a public client cookie",
        "Exceptions are discarded and converted into HTTP 200 responses",
      ],
      correctIndex: 1,
      explanation: "Centralized error handling catches sync and async errors, logs them securely, and formats consistent JSON error responses.",
      file: primaryFiles.find((f) => f.includes("error") || f.includes("middleware")) || primaryFiles[0],
    },
    {
      q: `What mechanism is used to handle cross-origin resource requests (CORS)?`,
      options: [
        "CORS is disabled entirely and all domains are disallowed",
        "The server configures CORS middleware with specific allowed origins and headers",
        "The browser handles cross-origin policies without server headers",
        "All requests must pass through an external third-party proxy",
      ],
      correctIndex: 1,
      explanation: "CORS middleware inspects incoming Origin headers against configured client URLs to protect API endpoints.",
      file: primaryFiles[0] || "src/index.js",
    },
    {
      q: `Which module or service is responsible for external API communication and network requests?`,
      options: [
        "Axios or fetch clients configured with standard headers and error guards",
        "Raw TCP sockets opened on arbitrary ports",
        "Synchronous XMLHttpRequests blocking the event loop",
        "Direct file system reads bypassing the network",
      ],
      correctIndex: 0,
      explanation: "Modern Node.js applications use promise-based HTTP clients like axios or native fetch with standardized headers.",
      file: primaryFiles.find((f) => f.includes("service") || f.includes("api")) || primaryFiles[0],
    },
    {
      q: `Why does the application separate routes, controllers, and services?`,
      options: [
        "To satisfy Node.js compiler restrictions on file length",
        "Separation of concerns: routes map endpoints, controllers handle HTTP logic, and services manage domain operations",
        "It prevents files from being checked into git version control",
        "It allows CSS styling to be bundled inside JavaScript functions",
      ],
      correctIndex: 1,
      explanation: "Separating routes, controllers, and services promotes maintainability, clean testing, and clean architecture.",
      file: primaryFiles.find((f) => f.includes("route") || f.includes("controller")) || primaryFiles[0],
    },
    {
      q: `How is state persistence structured in this architecture?`,
      options: [
        "State is written to global process environment variables",
        "An abstracted data store layer allows in-memory storage or swapping to Mongoose/MongoDB",
        "State is permanently stored in browser local storage only",
        "All state is re-fetched from git commits on each request",
      ],
      correctIndex: 1,
      explanation: "Using a dedicated store/repository layer decouples business logic from storage implementation details.",
      file: primaryFiles.find((f) => f.includes("store")) || "src/store/quizStore.js",
    },
  ];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    questions.push({
      id: `q_${i + 1}`,
      question: t.q,
      options: t.options,
      correctIndex: t.correctIndex,
      explanation: t.explanation,
      fileReference: primaryFiles[i % primaryFiles.length] || t.file,
    });
  }

  return questions;
}

/**
 * Main Gemini Service
 */
export class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  hasApiKey() {
    const key = process.env.GEMINI_API_KEY || this.apiKey;
    return !!(key && key.trim() !== "" && !key.includes("your_gemini_api_key_here"));
  }

  getGenAI() {
    const key = process.env.GEMINI_API_KEY || this.apiKey;
    if (!this.hasApiKey()) {
      return null;
    }
    return new GoogleGenerativeAI(key);
  }

  /**
   * Generates a gamified flashcard quiz from code context
   */
  async generateQuiz({ codebaseName, codeContext, difficulty = "intermediate", questionCount = 10 }) {
    const count = Math.min(Math.max(Number(questionCount) || 10, 3), 30);
    const genAI = this.getGenAI();

    // If API key is not yet set, provide structured fallback questions so the user can test the UI immediately
    if (!genAI) {
      logger.warn(
        "⚠️ GEMINI_API_KEY is not configured in server/.env. Generating structured starter quiz so you can test the game immediately. Add GEMINI_API_KEY to server/.env to use Gemini 1.5 Flash."
      );
      return generateFallbackQuestions(codebaseName, codeContext, count, difficulty);
    }

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite"];
    const difficultyGuide = getDifficultyInstructions(difficulty);

    const prompt = `You are an expert developer and quiz creator.
Analyze the following codebase and generate exactly ${count} multiple-choice flashcard questions to test and teach understanding of this codebase.

${difficultyGuide}

STRICT JSON SCHEMA:
Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "q_1",
      "question": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Concise explanation of why this answer is correct and what the code does.",
      "fileReference": "path/to/relevant/file.js"
    }
  ]
}

RULES:
1. Every question must have EXACTLY 4 options in the "options" array.
2. "correctIndex" must be an integer (0, 1, 2, or 3) representing the index of the correct option in "options".
3. Provide a clear, educational "explanation" for every question.
4. "fileReference" MUST be the actual file path from the codebase where this concept or code appears.
5. Do NOT include markdown code blocks around the JSON; return pure JSON.
6. Make questions realistic and engaging, avoiding trivial syntax trivia where possible.

CODEBASE CONTEXT:
${codeContext.slice(0, 75000)}
`;

    // Attempt generation across available models
    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        logger.info(`Calling Gemini API (${modelName}) to generate ${count} questions...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = extractJson(text);
        const validatedQuestions = validateQuestions(parsed, count);

        logger.info(`Successfully generated ${validatedQuestions.length} validated quiz questions with ${modelName}.`);
        return validatedQuestions;
      } catch (err) {
        lastError = err;
        logger.warn(`Gemini generation with ${modelName} failed: ${err.message}`);
      }
    }

    logger.warn(`Falling back to structured deck due to Gemini generation error: ${lastError?.message}`);
    return generateFallbackQuestions(codebaseName, codeContext, count, difficulty);
  }

  /**
   * Helper AI Chatbot for conversational answering, explaining concepts, and debugging
   */
  async answerChat({ codebaseName, codeContext, questionContext = null, message, history = [] }) {
    const genAI = this.getGenAI();

    if (!genAI) {
      return `💡 AI Mentor Notice: Add your GEMINI_API_KEY to server/.env to get live Gemini AI explanations! For "${codebaseName}", check ${questionContext?.fileReference || "the source files"} for the implementation details.`;
    }

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite"];

    // Format prior conversation history
    const historySnippet = Array.isArray(history) && history.length > 0
      ? `\nPREVIOUS CONVERSATION:\n` + history.slice(-6).map((h) => `${h.role === "user" ? "User" : "AI Mentor"}: ${h.text}`).join("\n") + "\n"
      : "";

    const prompt = `You are "AI Code Mentor", an interactive, knowledgeable, and friendly AI chatbot assistant embedded in the CodeQuiz platform for the codebase "${codebaseName}".
You help developers learn this codebase, understand quiz questions, explain errors, break down complex logic, and give code examples.

RULES:
1. Act like a true conversational chatbot: friendly, helpful, concise (2-4 paragraphs maximum or neat bullet points).
2. If the user asks in Hindi or Hinglish, answer naturally in friendly Hinglish/Hindi. If they ask in English, answer in English.
3. Use the current quiz question and codebase context to answer accurately.
4. When relevant, mention file paths or functions from the codebase.
5. If explaining why an answer is wrong, guide the user kindly without being patronizing.

${questionContext ? `CURRENT QUIZ QUESTION CONTEXT:
Question: ${questionContext.question}
Options: ${questionContext.options?.join(" | ")}
Correct Option: ${questionContext.correctOption}
Explanation: ${questionContext.explanation}
Relevant File: ${questionContext.fileReference}
User Selected: ${questionContext.userSelected || "None yet"}
` : ""}

CODEBASE CONTEXT:
${codeContext ? codeContext.slice(0, 45000) : "No direct source context provided."}
${historySnippet}
USER MESSAGE:
${message}

Respond directly as AI Code Mentor:`;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 800,
          },
        });

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (err) {
        logger.warn(`Model ${modelName} failed for chat: ${err.message}`);
      }
    }

    throw new AppError("AI mentor is currently experiencing high demand. Please try again in a few seconds.", 503);
  }
}


export const geminiService = new GeminiService();
