import { Link } from "@tanstack/react-router";
import { Code2, Home, LayoutDashboard, Trophy, Zap } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/quiz", label: "Quiz", icon: Zap },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ranks", label: "Ranks", icon: Trophy },
] as const;

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-2xl" aria-label="CodeQuiz home">
        <span className="grid h-10 w-10 place-items-center rounded-xl text-red neu-raised-sm">
          <Code2 className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Code<span className="text-red">Quiz</span>
        </span>
      </Link>
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-medium neu-inset-sm">
        <span className="text-muted-foreground/80">Dev:</span>
        <span className="font-bold text-red">MUZAMMIL KHAN</span>
      </span>
    </div>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-3 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-semibold text-muted-foreground neu-interactive hover:text-foreground data-[status=active]:text-red data-[status=active]:shadow-[var(--shadow-inset-sm)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function BottomTabBar() {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1.5 rounded-3xl p-2 neu-raised">
        {LINKS.map((l) => (
          <li key={l.to} className="min-w-0">
            <Link
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-muted-foreground transition-all duration-250 hover:text-foreground hover:shadow-[var(--glow)] data-[status=active]:text-red data-[status=active]:shadow-[var(--shadow-inset-sm)]"
            >
              <l.icon className="h-5 w-5" />
              <span className="truncate">{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
