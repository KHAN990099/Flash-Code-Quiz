import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  FileCode,
  HelpCircle,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { NeuBadge, NeuButton, NeuInput } from "@/components/neu";
import { api, type QuizQuestion } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface AiChatbotProps {
  quizId: string | null;
  codebaseName: string;
  currentQuestion?: QuizQuestion | undefined;
  userSelectedOption?: string | null | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function AiChatbot({
  quizId,
  codebaseName,
  currentQuestion,
  userSelectedOption,
  isOpen,
  onToggle,
  onClose,
}: AiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          text: `👋 Hi! I'm your **AI Code Mentor** for **${codebaseName}**\n*(Platform Developed by **MUZAMMIL KHAN**)*.\n\nI have access to the codebase context and your current quiz question. Ask me why an answer is right or wrong, how a function works, or ask for code examples!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [codebaseName]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isSending]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = (customMessage || input).trim();
    if (!textToSend || isSending) return;

    const userMessage: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Build history for multi-turn conversational context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.sendChatMessage(
        quizId,
        textToSend,
        currentQuestion?.id,
        history
      );

      const aiMessage: ChatMessage = {
        id: "ai_" + Date.now(),
        role: "ai",
        text: res.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get reply from AI Mentor.");
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          role: "ai",
          text: "⚠️ Sorry, I encountered a temporary connection issue. Please check your internet or try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared_" + Date.now(),
        role: "ai",
        text: `Chat cleared. Ready for your questions about **${codebaseName}**!`,
        timestamp: new Date(),
      },
    ]);
  };

  // Quick prompt suggestions
  const suggestions = [
    {
      label: "💡 Explain this question",
      prompt: `Can you explain what question "${currentQuestion?.question}" is testing and why in simple terms?`,
    },
    {
      label: userSelectedOption ? "❌ Why was my choice wrong?" : "🎯 Hint for this question",
      prompt: userSelectedOption
        ? `I chose "${userSelectedOption}". Can you explain why that was wrong without giving away the exact answer?`
        : `Can you give me a subtle hint to help solve this question?`,
    },
    {
      label: "📁 Explain this file",
      prompt: `What is the role and importance of ${currentQuestion?.fileReference || "this file"} in the codebase?`,
    },
    {
      label: "💻 Code Example",
      prompt: `Can you give a brief code snippet demonstrating how the concept in "${currentQuestion?.question}" is used?`,
    },
  ];

  if (!isOpen) {
    return (
      /* Floating Chatbot Bubble */
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 font-semibold text-red shadow-[var(--shadow-raised),var(--glow)] neu-raised neu-glow-hover transition-all duration-300"
        aria-label="Open AI Mentor Chatbot"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red" />
        </span>
        <Bot className="h-5 w-5" />
        <span className="text-sm font-bold tracking-tight">AI Helper</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-3xl neu-raised shadow-2xl transition-all duration-300 border border-border/40",
        isMinimized
          ? "w-80 h-16 overflow-hidden"
          : "w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]"
      )}
      style={{
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Chatbot Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl text-red neu-inset-sm">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 font-semibold text-foreground text-sm truncate">
              <span>AI Code Mentor</span>
              <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-500">
                Online
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {codebaseName} • <span className="text-red font-semibold">Dev: MUZAMMIL KHAN</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={clearChat}
            className="grid h-8 w-8 place-items-center rounded-xl hover:text-foreground neu-interactive"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="grid h-8 w-8 place-items-center rounded-xl hover:text-foreground neu-interactive"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl hover:text-foreground neu-interactive"
            title="Close Chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Current Question Context Badge */}
          {currentQuestion && (
            <div className="shrink-0 bg-background/50 px-4 py-2 border-b border-border/30 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <FileCode className="h-3.5 w-3.5 text-red shrink-0" />
                <span className="font-mono truncate">{currentQuestion.fileReference || "Current Question"}</span>
              </span>
              <span className="shrink-0 text-[10px] uppercase font-bold text-red neu-raised-sm px-2 py-0.5 rounded-md">
                Active Question
              </span>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          <div className="shrink-0 flex gap-1.5 overflow-x-auto p-3 no-scrollbar border-b border-border/20">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={isSending}
                onClick={() => handleSend(s.prompt)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-medium neu-interactive text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col max-w-[85%] text-sm leading-relaxed",
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {m.role === "user" ? "You" : "AI Mentor"}
                </span>
                <div
                  className={cn(
                    "rounded-2xl p-3.5 whitespace-pre-wrap break-words",
                    m.role === "user"
                      ? "neu-inset text-foreground rounded-tr-sm"
                      : "neu-raised text-foreground/90 rounded-tl-sm border border-border/20"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 rounded-2xl p-3.5 mr-auto neu-raised text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-red" />
                <span>AI Mentor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="shrink-0 border-t border-border/40 p-3 bg-background/40 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about the code or quiz..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className="flex-1 min-h-11 rounded-2xl px-4 text-sm neu-inset placeholder:text-muted-foreground/60 outline-none focus:shadow-[var(--shadow-inset),var(--glow)] transition-shadow"
            />
            <NeuButton
              size="icon"
              type="submit"
              variant="primary"
              disabled={isSending || !input.trim()}
              className="h-11 w-11 shrink-0"
              title="Send message"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </NeuButton>
          </form>
        </>
      )}
    </div>
  );
}
