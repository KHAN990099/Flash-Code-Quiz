import { ArrowRight, FileCode2, Flame } from "lucide-react";
import { NeuBadge, NeuButton, NeuCard } from "@/components/neu";
import { PREVIEW_CARD } from "@/data/samples";
import { Reveal } from "./Reveal";

export function Hero() {
  const scrollToInput = () => document.getElementById("start")?.scrollIntoView({ behavior: "smooth" });
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-2 lg:gap-12 lg:pb-20 lg:pt-16">
      <Reveal className="min-w-0 text-center lg:text-left">
        <NeuBadge tone="red" className="mb-5">
          <Flame className="h-3.5 w-3.5" /> Gamified codebase learning
        </NeuBadge>
        <h1 className="text-[2rem] font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
          Learn any codebase <span className="text-gradient">by playing</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
          Drop in a GitHub repo or paste code. AI turns it into flashcard quizzes so you master unfamiliar code faster, with scores, streaks and ranks.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <NeuButton size="lg" variant="primary" onClick={scrollToInput} className="w-full sm:w-auto">
            Start a quiz <ArrowRight className="h-5 w-5" />
          </NeuButton>
          <NeuButton size="lg" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="w-full sm:w-auto">
            How it works
          </NeuButton>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mx-auto w-full max-w-md min-w-0">
        <div className="animate-float">
          <NeuCard className="p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <NeuBadge tone="red">{PREVIEW_CARD.difficulty}</NeuBadge>
              <NeuBadge tone="mono">
                <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{PREVIEW_CARD.file}</span>
              </NeuBadge>
            </div>
            <p className="font-display text-lg font-semibold leading-snug sm:text-xl">{PREVIEW_CARD.question}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PREVIEW_CARD.options.map((o, i) => (
                <div
                  key={o}
                  className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm ${i === 0 ? "text-red shadow-[var(--shadow-inset-sm),var(--glow)]" : "neu-raised-sm text-muted-foreground"}`}
                >
                  <span className="font-mono text-xs opacity-70">{i + 1}</span>
                  {o}
                </div>
              ))}
            </div>
          </NeuCard>
        </div>
      </Reveal>
    </section>
  );
}
