import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { QuizInput } from "@/components/landing/QuizInput";
import { Features, Footer, HowItWorks, RanksPreview } from "@/components/landing/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeQuiz — Learn any codebase by playing" },
      { name: "description", content: "Turn any GitHub repo into AI flashcard quizzes with scores, streaks and rank badges." },
      { property: "og:title", content: "CodeQuiz — Learn any codebase by playing" },
      { property: "og:description", content: "Turn any GitHub repo into AI flashcard quizzes with scores, streaks and rank badges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <QuizInput />
      <Features />
      <HowItWorks />
      <RanksPreview />
      <Footer />
    </>
  );
}
