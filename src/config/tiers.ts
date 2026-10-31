export type TierId = "novice" | "explorer" | "craftsman" | "ninja" | "master" | "legend";

export interface Tier {
  id: TierId;
  title: string;
  min: number;
  max: number;
  tagline: string;
  colors: { primary: string; secondary: string; glow: string };
  /** Optional custom PNG artwork; overrides the built-in emblem when set. */
  imageSrc?: string;
}

export const TIERS: Tier[] = [
  { id: "novice", title: "Code Novice", min: 0, max: 29, tagline: "Every legend starts with hello world.", colors: { primary: "#b87333", secondary: "#5a3a22", glow: "rgba(184,115,51,0.5)" } },
  { id: "explorer", title: "Code Explorer", min: 30, max: 49, tagline: "Mapping the unknown, one file at a time.", colors: { primary: "#d9dde3", secondary: "#7d8590", glow: "rgba(217,221,227,0.45)" } },
  { id: "craftsman", title: "Code Craftsman", min: 50, max: 69, tagline: "Building with intent and precision.", colors: { primary: "#f2c14e", secondary: "#9a6b12", glow: "rgba(242,193,78,0.5)" } },
  { id: "ninja", title: "Code Ninja", min: 70, max: 84, tagline: "Silent, swift, and always on target.", colors: { primary: "#e6ecf2", secondary: "#e5254b", glow: "rgba(229,37,75,0.5)" } },
  { id: "master", title: "Code Master", min: 85, max: 94, tagline: "You know where every bug hides.", colors: { primary: "#ff3b5f", secondary: "#8a1430", glow: "rgba(255,59,95,0.55)" } },
  { id: "legend", title: "Code Legend", min: 95, max: 100, tagline: "The codebase bends to your will.", colors: { primary: "#f5c542", secondary: "#722f37", glow: "rgba(229,37,75,0.75)" } },
];

export function getTierForScore(score: number): Tier {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return TIERS.find((t) => s >= t.min && s <= t.max) ?? TIERS[0]!;
}
