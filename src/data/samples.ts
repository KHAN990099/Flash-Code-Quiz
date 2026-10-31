export const SAMPLE_REPO_URL = "https://github.com/codequiz/express-react-starter";

export const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Go", "Java", "Rust"] as const;

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Mixed"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PREVIEW_CARD = {
  question: "What does the auth middleware return when the JWT is expired?",
  file: "src/middleware/auth.js",
  difficulty: "Intermediate",
  options: ["401 Unauthorized", "403 Forbidden", "Redirect to /login", "500 Server Error"],
};
