import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* NeuCard */
export function NeuCard({ className, interactive, inset, ...p }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; inset?: boolean }) {
  return (
    <div
      className={cn("rounded-3xl p-5 sm:p-6", inset ? "neu-inset" : "neu-raised", interactive && "neu-glow-hover", className)}
      {...p}
    />
  );
}

/* NeuButton */
type BtnVariant = "default" | "primary" | "ghost";
type BtnSize = "sm" | "md" | "lg" | "icon";
const btnSize: Record<BtnSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm sm:text-base",
  lg: "min-h-14 px-7 text-base sm:text-lg",
  icon: "h-11 w-11 shrink-0",
};
export const NeuButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; active?: boolean }>(
  ({ className, variant = "default", size = "md", active, ...p }, ref) => (
    <button
      ref={ref}
      data-active={active ? "true" : undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold neu-interactive disabled:pointer-events-none disabled:opacity-50",
        btnSize[size],
        variant === "primary" && "text-red",
        variant === "ghost" && "shadow-none",
        active && "text-red",
        className,
      )}
      {...p}
    />
  ),
);
NeuButton.displayName = "NeuButton";

/* NeuInput */
export const NeuInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...p }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-12 w-full min-w-0 rounded-2xl px-4 text-base neu-inset placeholder:text-muted-foreground/70 outline-none transition-shadow duration-250",
        "focus-visible:outline-none focus:shadow-[var(--shadow-inset),var(--glow)]",
        invalid && "shadow-[var(--shadow-inset),0_0_0_1px_var(--red)]",
        className,
      )}
      {...p}
    />
  ),
);
NeuInput.displayName = "NeuInput";

/* NeuTabs */
export function NeuTabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("grid gap-2 rounded-2xl p-1.5 neu-inset", className)} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              "flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-all duration-250",
              on ? "neu-raised-sm text-red hover:shadow-[var(--shadow-raised-sm),var(--glow)]" : "text-muted-foreground hover:text-foreground hover:shadow-[var(--glow)]",
            )}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* NeuProgress */
export function NeuProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className={cn("h-3 w-full overflow-hidden rounded-full neu-inset-sm", className)}>
      <div className="h-full rounded-full bg-gradient-red transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* NeuToggle */
export function NeuToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-11 w-[4.5rem] shrink-0 items-center rounded-full p-1.5 neu-inset transition-shadow duration-250 hover:shadow-[var(--shadow-inset),var(--glow)]"
    >
      <span className={cn("h-8 w-8 rounded-full transition-all duration-250", checked ? "translate-x-7 bg-gradient-red" : "neu-raised-sm")} />
    </button>
  );
}

/* NeuBadge */
export function NeuBadge({ className, tone = "default", ...p }: HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "red" | "mono" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-3 py-1 text-xs font-semibold neu-raised-sm",
        tone === "red" && "text-red",
        tone === "mono" && "font-mono font-medium text-muted-foreground",
        className,
      )}
      {...p}
    />
  );
}
