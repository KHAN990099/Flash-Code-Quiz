export const TIERS = [
  { rank: "Code Novice", badge: "novice", min: 0, max: 29, description: "Every legend starts with hello world." },
  { rank: "Code Explorer", badge: "explorer", min: 30, max: 49, description: "Mapping the unknown, one file at a time." },
  { rank: "Code Craftsman", badge: "craftsman", min: 50, max: 69, description: "Building with intent and precision." },
  { rank: "Code Ninja", badge: "ninja", min: 70, max: 84, description: "Silent, swift, and always on target." },
  { rank: "Code Master", badge: "master", min: 85, max: 94, description: "You know where every bug hides." },
  { rank: "Code Legend", badge: "legend", min: 95, max: 100, description: "The codebase bends to your will." },
];

export function calculateRank(percentage) {
  const score = Math.max(0, Math.min(100, Math.round(percentage)));
  const tier = TIERS.find((t) => score >= t.min && score <= t.max) || TIERS[0];
  return {
    rank: tier.rank,
    badge: tier.badge,
    description: tier.description,
  };
}
