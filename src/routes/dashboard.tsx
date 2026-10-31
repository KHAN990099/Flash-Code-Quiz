import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  FileCode,
  Flame,
  FolderGit2,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NeuBadge, NeuButton, NeuCard, NeuProgress } from "@/components/neu";
import { api, type ProgressResponse } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CodeQuiz" },
      { name: "description", content: "Track your codebase mastery, XP and streaks." },
      { property: "og:title", content: "Dashboard — CodeQuiz" },
      { property: "og:description", content: "Track your codebase mastery, XP and streaks." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const activeId = sessionStorage.getItem("codequiz:activeQuizId");
        if (activeId) {
          const data = await api.getProgress(activeId);
          setProgress(data);
        }
      } catch (err: any) {
        toast.error("Could not load codebase progress dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  if (!loading && !progress) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 pb-32 pt-10 md:pb-12">
        <NeuCard className="w-full text-center sm:p-10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full text-red neu-inset">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">No Active Codebase</h1>
          <p className="mt-3 text-muted-foreground">
            Play a quiz first to see your codebase mastery and file understanding breakdown.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex min-h-12 items-center rounded-2xl px-6 font-semibold text-red neu-interactive"
            >
              Start a Quiz
            </Link>
          </div>
        </NeuCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 sm:px-6 md:pb-16 md:pt-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-red" />
            <h1 className="text-2xl font-bold sm:text-3xl">{progress?.codebaseName || "Codebase"}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Codebase comprehension and knowledge retention breakdown.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/quiz"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-red neu-interactive"
          >
            <Zap className="h-4 w-4" /> Continue Quiz
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <NeuCard className="p-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Overall Understanding
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-red">
              {progress?.overallPercentage ?? 0}%
            </span>
          </div>
          <NeuProgress value={progress?.overallPercentage ?? 0} className="mt-4" />
        </NeuCard>

        <NeuCard className="p-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Questions Mastered
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-foreground">
              {progress?.score ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">/ {progress?.totalQuestions ?? 0}</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {progress?.totalAnswered ?? 0} answered so far
          </p>
        </NeuCard>

        <NeuCard className="p-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Files Covered
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-foreground">
              {progress?.files?.length ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">source modules</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ranked by quiz engagement
          </p>
        </NeuCard>
      </div>

      {/* File-by-File Mastery Section */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold sm:text-xl">File Mastery Breakdown</h2>
        <div className="grid gap-3">
          {progress?.files && progress.files.length > 0 ? (
            progress.files.map((item, idx) => (
              <NeuCard key={idx} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-red neu-inset-sm">
                    <FileCode className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-mono text-sm font-semibold">{item.file}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.correct} of {item.total} questions correct
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-60">
                  <div className="w-full">
                    <NeuProgress value={item.mastery} />
                  </div>
                  <span className="w-12 text-right font-mono text-sm font-bold text-foreground">
                    {item.mastery}%
                  </span>
                </div>
              </NeuCard>
            ))
          ) : (
            <NeuCard className="p-6 text-center text-sm text-muted-foreground">
              No individual file data available yet.
            </NeuCard>
          )}
        </div>
      </div>
    </main>
  );
}
