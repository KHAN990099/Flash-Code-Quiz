# Code-Quize

responsive pe jyada dyan dena

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://joy-fluid-view.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/57541d3d-3f76-48c9-8927-a9f724fb8bdc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Running Frontend & Backend Together

### 1. Prerequisites
- **Node.js**: v18+ and npm
- **Google Gemini API Key**: Obtain a free key from [Google AI Studio](https://aistudio.google.com/)

### 2. Configure Environment Variables

#### Backend (`server/.env`):
Create or edit `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
CLIENT_URL=http://localhost:8080,http://localhost:5173
# Optional: Increases GitHub API rate limit from 60/hr to 5000/hr
GITHUB_TOKEN=
```

#### Frontend (`.env` in root):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Both Servers

#### Terminal 1 — Backend (Express API):
```sh
cd server
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

#### Terminal 2 — Frontend (Vite + React):
```sh
npm install
npm run dev
```
Frontend runs at `http://localhost:8080` (or `http://localhost:5173`).

### 4. API Endpoints Overview
- `GET /api/health` — Backend health check
- `POST /api/quiz/generate` — Generates AI flashcards from GitHub repo tree or pasted code
- `POST /api/quiz/:quizId/answer` — Validates answers, tracks score, and updates streaks
- `GET /api/quiz/:quizId/result` — Returns final score, accuracy, streak, and Rank tier (Novice to Legend)
- `GET /api/progress/:quizId` — Codebase mastery breakdown by file
- `POST /api/chat` — AI Code Mentor to explain answers and concepts
