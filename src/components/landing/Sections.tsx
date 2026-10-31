import { Link } from "@tanstack/react-router";
import { BarChart3, Brain, Flame, Github, Layers, Share2, Shield } from "lucide-react";
import { NeuCard } from "@/components/neu";
import { TIERS } from "@/config/tiers";
import { Logo } from "@/components/layout/Navbar";
import { Reveal, SectionHeading } from "./Reveal";

const FEATURES = [
  { icon: Github, title: "GitHub import", text: "Paste any public repo URL and we read the structure for you." },
  { icon: Brain, title: "AI flashcards", text: "Questions grounded in real files, functions and flows." },
  { icon: Layers, title: "Difficulty levels", text: "From beginner basics to advanced architecture." },
  { icon: Flame, title: "Scoring and streaks", text: "Earn points, chain correct answers, chase combos." },
  { icon: BarChart3, title: "Progress dashboard", text: "See which files you have mastered and what is left." },
  { icon: Share2, title: "Shareable rank card", text: "Show off your rank with a branded result card." },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Features" title="Everything you need to level up" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <NeuCard interactive className="h-full">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-red neu-inset-sm">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </NeuCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Link your code", text: "Paste a GitHub URL or drop in a snippet." },
  { title: "AI builds your deck", text: "Flashcards are generated from your actual files." },
  { title: "Play and rank up", text: "Answer, learn from explanations, earn your badge." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="How it works" title="Three steps to codebase mastery" />
      <ol className="grid gap-5 md:grid-cols-3 lg:gap-7">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <li className="flex h-full gap-4 rounded-3xl p-5 neu-raised md:flex-col sm:p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-red neu-inset-sm">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function TierEmblemSimple({ color, glow }: { color: string; glow: string }) {
  return (
    <div className="grid h-20 w-20 place-items-center rounded-full neu-inset-sm" style={{ filter: `drop-shadow(0 0 14px ${glow})` }}>
      <Shield className="h-10 w-10" style={{ color }} strokeWidth={1.75} />
    </div>
  );
}

export function RanksPreview() {
  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Ranks" title="Climb from Novice to Legend" sub="Your final score decides your rank. Can you reach the top?" />
      </div>
      <div className="no-scrollbar mx-auto flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:px-6">
        {TIERS.map((t) => (
          <Link
            to="/ranks"
            key={t.id}
            className="flex w-[70%] max-w-60 shrink-0 snap-center flex-col items-center rounded-3xl p-6 text-center neu-raised neu-glow-hover sm:w-56"
          >
            <TierEmblemSimple color={t.colors.primary} glow={t.colors.glow} />
            <h3 className="mt-4 font-semibold">{t.title}</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{t.min}–{t.max}%</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-6 md:pb-12">
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl p-6 neu-inset sm:flex-row">
        <Logo />
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CodeQuiz • Developed by{" "}
          <span className="font-bold text-red">MUZAMMIL KHAN</span>
        </p>
      </div>
    </footer>
  );
}
