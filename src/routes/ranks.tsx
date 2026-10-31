import { createFileRoute } from "@tanstack/react-router";
import { NeuCard } from "@/components/neu";
import { TIERS } from "@/config/tiers";
import { TierEmblemSimple } from "@/components/landing/Sections";

export const Route = createFileRoute("/ranks")({
  head: () => ({
    meta: [
      { title: "Ranks — CodeQuiz" },
      { name: "description", content: "All six CodeQuiz ranks, from Code Novice to Code Legend." },
      { property: "og:title", content: "Ranks — CodeQuiz" },
      { property: "og:description", content: "All six CodeQuiz ranks, from Code Novice to Code Legend." },
    ],
  }),
  component: Ranks,
});

function Ranks() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 md:pb-16 md:pt-12">
      <h1 className="text-center text-3xl font-bold sm:text-4xl">Rank tiers</h1>
      <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">Your final quiz score decides your rank.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {TIERS.map((t) => (
          <NeuCard key={t.id} interactive className="flex items-center gap-5">
            <div className="shrink-0"><TierEmblemSimple color={t.colors.primary} glow={t.colors.glow} /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <p className="font-mono text-xs text-red">{t.min}–{t.max}%</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
            </div>
          </NeuCard>
        ))}
      </div>
    </main>
  );
}
