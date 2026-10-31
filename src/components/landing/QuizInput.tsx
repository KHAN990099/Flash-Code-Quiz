import { useNavigate } from "@tanstack/react-router";
import { ClipboardPaste, Code, Github, Minus, Plus, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { NeuButton, NeuCard, NeuInput, NeuTabs } from "@/components/neu";
import { DIFFICULTIES, LANGUAGES, type Difficulty } from "@/data/samples";
import { api, isValidRepoUrl } from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Reveal } from "./Reveal";

type Source = "github" | "code";

export function QuizInput() {
  const navigate = useNavigate();
  const [source, setSource] = useState<Source>("github");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Mixed");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const urlValid = isValidRepoUrl(url);
  const canSubmit = source === "github" ? urlValid : code.trim().length > 10;

  const paste = async () => {
    try {
      setUrl((await navigator.clipboard.readText()).trim());
      setTouched(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    const toastId = toast.loading("Analyzing codebase and generating AI flashcards...");

    try {
      const quiz = await api.createQuiz({ source, repoUrl: url, code, language, difficulty, count });
      toast.success("Quiz generated successfully!", { id: toastId });
      navigate({ to: "/quiz" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate quiz. Check server and API key.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="start" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-16">
      <Reveal>
        <NeuCard className="p-4 sm:p-8">
          <h2 className="mb-1 text-xl font-bold sm:text-2xl">Create your quiz</h2>
          <p className="mb-5 text-sm text-muted-foreground">Pick a source, set the challenge, and play.</p>

          <NeuTabs
            value={source}
            onChange={setSource}
            tabs={[
              { value: "github", label: "GitHub Repository", icon: <Github className="h-4 w-4 shrink-0" /> },
              { value: "code", label: "Paste Code", icon: <Code className="h-4 w-4 shrink-0" /> },
            ]}
          />

          <div className="mt-6">
            {source === "github" ? (
              <div>
                <label htmlFor="repo" className="mb-2 block text-sm font-semibold">Repository URL</label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <NeuInput
                    id="repo"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="github.com/owner/repo"
                    value={url}
                    invalid={touched && !!url && !urlValid}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={() => setTouched(true)}
                  />
                  <NeuButton size="icon" onClick={paste} aria-label="Paste from clipboard" className="h-12 w-12">
                    <ClipboardPaste className="h-5 w-5" />
                  </NeuButton>
                </div>
                <div className="mt-3 flex min-h-6 flex-wrap items-center gap-3">
                  {touched && url && !urlValid ? (
                    <p className="text-sm text-destructive">Use the format github.com/owner/repo</p>
                  ) : null}
                  <button
                    onClick={() => { setUrl(api.sampleRepoUrl); setTouched(true); }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-red neu-interactive"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Try sample repo
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <label htmlFor="code" className="text-sm font-semibold">Your code</label>
                  <select
                    aria-label="Language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="min-h-11 rounded-xl bg-background px-3 text-sm neu-raised-sm outline-none hover:shadow-[var(--shadow-raised-sm),var(--glow)]"
                  >
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={"function hello() {\n  return 'world';\n}"}
                  spellCheck={false}
                  className="min-h-48 w-full resize-y rounded-2xl p-4 font-mono text-sm neu-inset outline-none placeholder:text-muted-foreground/60 focus:shadow-[var(--shadow-inset),var(--glow)]"
                />
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold">Difficulty</p>
              <div role="radiogroup" className="grid grid-cols-2 gap-2 rounded-2xl p-1.5 neu-inset sm:grid-cols-4">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    role="radio"
                    aria-checked={difficulty === d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "min-h-11 rounded-xl px-2 text-sm font-semibold transition-all duration-250",
                      difficulty === d ? "neu-raised-sm text-red hover:shadow-[var(--shadow-raised-sm),var(--glow)]" : "text-muted-foreground hover:text-foreground hover:shadow-[var(--glow)]",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Questions</p>
              <div className="flex items-center justify-between gap-3 rounded-2xl p-1.5 neu-inset md:justify-start">
                <NeuButton size="icon" aria-label="Fewer questions" onClick={() => setCount((c) => Math.max(5, c - 5))} disabled={count <= 5}>
                  <Minus className="h-4 w-4" />
                </NeuButton>
                <span className="w-10 text-center font-display text-xl font-bold tabular-nums" aria-live="polite">{count}</span>
                <NeuButton size="icon" aria-label="More questions" onClick={() => setCount((c) => Math.min(30, c + 5))} disabled={count >= 30}>
                  <Plus className="h-4 w-4" />
                </NeuButton>
              </div>
            </div>
          </div>

          <NeuButton size="lg" variant="primary" onClick={submit} disabled={loading} className="mt-8 w-full min-h-16 text-lg">
            <Sparkles className="h-5 w-5" /> {loading ? "Preparing…" : "Generate Quiz"}
          </NeuButton>
        </NeuCard>
      </Reveal>
    </section>
  );
}
