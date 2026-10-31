import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileCode,
  Flame,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NeuBadge, NeuButton, NeuCard, NeuInput, NeuProgress } from "@/components/neu";
import { api, type AnswerResponse, type QuizData, type QuizQuestion, type QuizResultResponse } from "@/services/api";
import { TIERS, getTierForScore } from "@/config/tiers";
import { TierEmblemSimple } from "@/components/landing/Sections";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AiChatbot } from "@/components/chatbot/AiChatbot";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — CodeQuiz" },
      { name: "description", content: "Play interactive flashcard quizzes generated from your codebase." },
      { property: "og:title", content: "Quiz — CodeQuiz" },
      { property: "og:description", content: "Play interactive flashcard quizzes generated from your codebase." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answering state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Score & streaks
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Final result
  const [finalResult, setFinalResult] = useState<QuizResultResponse | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // AI Helper chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load quiz from sessionStorage or API
  useEffect(() => {
    async function loadQuizData() {
      try {
        const stored = sessionStorage.getItem("codequiz:activeQuizData");
        const activeId = sessionStorage.getItem("codequiz:activeQuizId");

        if (stored) {
          const parsed = JSON.parse(stored) as QuizData;
          setQuiz(parsed);
          setScore(parsed.score || 0);
          setStreak(parsed.streak || 0);
          setBestStreak(parsed.bestStreak || 0);
        } else if (activeId) {
          const fetched = await api.getQuiz(activeId);
          setQuiz(fetched);
          setScore(fetched.score || 0);
          setStreak(fetched.streak || 0);
          setBestStreak(fetched.bestStreak || 0);
        }
      } catch (err: any) {
        toast.error("Could not load active quiz. Please generate one from the home page.");
      } finally {
        setLoading(false);
      }
    }

    loadQuizData();
  }, []);

  const currentQuestion: QuizQuestion | undefined = quiz?.questions[currentIndex];
  const totalQuestions = quiz?.questions.length || 0;

  // Handle option select & submit answer
  const handleSelectOption = async (optionIndex: number) => {
    if (selectedOption !== null || !quiz || !currentQuestion || isSubmitting) return;

    setSelectedOption(optionIndex);
    setIsSubmitting(true);

    try {
      const res = await api.submitAnswer(quiz.quizId, currentQuestion.id, optionIndex);
      setAnswerResult(res);
      setScore(res.score);
      setStreak(res.streak);
      setBestStreak(res.bestStreak);

      if (res.correct) {
        toast.success(res.streak > 1 ? `Correct! Streak of ${res.streak} 🔥` : "Correct!");
      } else {
        toast.error("Incorrect. Review the explanation below.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit answer.");
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Next question or finish
  const handleNext = async () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswerResult(null);
    } else if (quiz) {
      // Quiz finished, load results
      setLoadingResult(true);
      try {
        const res = await api.getQuizResult(quiz.quizId);
        setFinalResult(res);
      } catch (err: any) {
        toast.error(err.message || "Failed to load quiz results.");
      } finally {
        setLoadingResult(false);
      }
    }
  };


  // If no quiz loaded
  if (!loading && (!quiz || !quiz.questions || quiz.questions.length === 0)) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 pb-32 pt-10 md:pb-12">
        <NeuCard className="w-full text-center sm:p-10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full text-red neu-inset">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">No Quiz Active</h1>
          <p className="mt-3 text-muted-foreground">
            Generate a fresh flashcard deck from a GitHub repo or code snippet to start playing.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex min-h-12 items-center rounded-2xl px-6 font-semibold text-red neu-interactive">
              Create a Quiz
            </Link>
          </div>
        </NeuCard>
      </main>
    );
  }

  // Final Results Screen
  if (finalResult) {
    const matchedTier = getTierForScore(finalResult.percentage);

    return (
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-10 sm:px-6 md:pb-16">
        <NeuCard className="text-center sm:p-10">
          <div className="mx-auto mb-4 flex justify-center">
            <TierEmblemSimple color={matchedTier.colors.primary} glow={matchedTier.colors.glow} />
          </div>

          <NeuBadge tone="red" className="mb-2 uppercase tracking-wider">
            {finalResult.codebaseName}
          </NeuBadge>

          <h1 className="text-3xl font-bold sm:text-4xl">{finalResult.rank}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{matchedTier.tagline}</p>

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl p-4 neu-inset sm:gap-4 sm:p-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">SCORE</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                {finalResult.score} <span className="text-sm font-normal text-muted-foreground">/ {finalResult.total}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">ACCURACY</p>
              <p className="mt-1 font-display text-2xl font-bold text-red sm:text-3xl">
                {finalResult.percentage}%
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">BEST STREAK</p>
              <p className="mt-1 flex items-center justify-center gap-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                <Flame className="h-5 w-5 text-red" /> {finalResult.bestStreak}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-semibold text-red neu-interactive"
            >
              View Codebase Mastery
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 font-semibold text-muted-foreground neu-interactive hover:text-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Take Another Quiz
            </Link>
          </div>
        </NeuCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6 md:pb-16 md:pt-10">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NeuBadge tone="mono" className="truncate max-w-44 sm:max-w-64">
            {quiz?.codebaseName}
          </NeuBadge>
          <NeuBadge tone="red" className="capitalize">
            {quiz?.difficulty}
          </NeuBadge>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak indicator */}
          <div className="flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-bold neu-raised-sm">
            <Flame className={cn("h-4 w-4", streak > 0 ? "text-red animate-pulse" : "text-muted-foreground")} />
            <span>Streak: {streak}</span>
          </div>

          {/* AI Helper trigger button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-red neu-interactive"
            title="Ask AI Mentor"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Helper</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Question Counter */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>Score: {score}</span>
        </div>
        <NeuProgress value={((currentIndex + 1) / totalQuestions) * 100} />
      </div>

      {/* Main Flashcard Card */}
      {currentQuestion && (
        <NeuCard className="p-5 sm:p-8">
          {/* File Reference Badge */}
          {currentQuestion.fileReference && (
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <FileCode className="h-4 w-4 shrink-0 text-red" />
              <span className="font-mono truncate">{currentQuestion.fileReference}</span>
            </div>
          )}

          {/* Question Text */}
          <h2 className="mb-6 text-xl font-bold leading-snug sm:text-2xl">
            {currentQuestion.question}
          </h2>

          {/* Options List */}
          <div className="grid gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isRevealed = selectedOption !== null;
              const isCorrectAnswer = answerResult && answerResult.correctIndex === idx;
              const isWrongSelected = isSelected && answerResult && !answerResult.correct;

              return (
                <button
                  key={idx}
                  disabled={selectedOption !== null || isSubmitting}
                  onClick={() => handleSelectOption(idx)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200",
                    !isRevealed && "neu-interactive hover:shadow-[var(--glow)]",
                    isRevealed && !isSelected && !isCorrectAnswer && "opacity-50 neu-inset-sm",
                    isCorrectAnswer && "neu-raised text-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]",
                    isWrongSelected && "neu-raised text-red shadow-[0_0_12px_rgba(229,37,75,0.4)]"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold",
                      isCorrectAnswer
                        ? "bg-green-500/20 text-green-500"
                        : isWrongSelected
                        ? "bg-red/20 text-red"
                        : "neu-inset-sm text-muted-foreground"
                    )}
                  >
                    {isCorrectAnswer ? <CheckCircle2 className="h-4 w-4" /> : isWrongSelected ? <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-medium leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Box (Revealed after answering) */}
          {answerResult && (
            <div className="mt-6 rounded-2xl p-4 neu-inset">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="h-4 w-4 text-red" /> Explanation
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {answerResult.explanation}
              </p>
            </div>
          )}

          {/* Next / Result Button */}
          {selectedOption !== null && (
            <div className="mt-8 flex justify-end">
              <NeuButton
                variant="primary"
                onClick={handleNext}
                disabled={loadingResult}
                className="w-full sm:w-auto"
              >
                {loadingResult ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Calculating Ranks...
                  </>
                ) : currentIndex + 1 < totalQuestions ? (
                  <>
                    Next Question <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    View Final Results <Trophy className="h-4 w-4" />
                  </>
                )}
              </NeuButton>
            </div>
          )}
        </NeuCard>
      )}

      {/* Interactive AI Mentor Chatbot Widget */}
      <AiChatbot
        quizId={quiz?.quizId || null}
        codebaseName={quiz?.codebaseName || "Codebase"}
        currentQuestion={currentQuestion}
        userSelectedOption={selectedOption !== null && currentQuestion ? currentQuestion.options[selectedOption] : null}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        onClose={() => setIsChatOpen(false)}
      />
    </main>
  );
}

