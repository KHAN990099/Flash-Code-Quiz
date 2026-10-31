import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NeuCard } from "@/components/neu";

export function ComingSoon({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 pb-32 pt-10 md:pb-12">
      <NeuCard className="w-full text-center sm:p-10">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full text-red neu-inset">{icon}</div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{text}</p>
        <Link to="/" className="mt-6 inline-flex min-h-12 items-center rounded-2xl px-6 font-semibold text-red neu-interactive">
          Back to home
        </Link>
      </NeuCard>
    </main>
  );
}
