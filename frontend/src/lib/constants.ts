// Track definitions and colors
export const TRACKS = {
  "python-advanced": {
    name: "Python Advanced",
    icon: "🐍",
    color: "#22C55E",
    bgGlow: "from-green-500/20 to-green-500/0",
    border: "border-green-500/30",
    badge: "bg-green-500/15 text-green-400",
    ring: "ring-green-500/40",
  },
  "java-enterprise": {
    name: "Java Enterprise",
    icon: "☕",
    color: "#F97316",
    bgGlow: "from-orange-500/20 to-orange-500/0",
    border: "border-orange-500/30",
    badge: "bg-orange-500/15 text-orange-400",
    ring: "ring-orange-500/40",
  },
  "dsa-mastery": {
    name: "DSA Mastery",
    icon: "🧮",
    color: "#06B6D4",
    bgGlow: "from-cyan-500/20 to-cyan-500/0",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/15 text-cyan-400",
    ring: "ring-cyan-500/40",
  },
  "automation-devops": {
    name: "Automation & DevOps",
    icon: "🤖",
    color: "#A855F7",
    bgGlow: "from-purple-500/20 to-purple-500/0",
    border: "border-purple-500/30",
    badge: "bg-purple-500/15 text-purple-400",
    ring: "ring-purple-500/40",
  },
} as const;

export type TrackSlug = keyof typeof TRACKS;

// Challenge type icons and labels
export const CHALLENGE_TYPES = {
  code: { icon: "🧩", label: "Code" },
  quiz: { icon: "🤔", label: "Quiz" },
  bughunt: { icon: "🐛", label: "Bug Hunt" },
  design: { icon: "🏗️", label: "Design" },
  speedround: { icon: "⚡", label: "Speed" },
} as const;

export type ChallengeType = keyof typeof CHALLENGE_TYPES;

// Level thresholds (matches backend)
export const LEVEL_THRESHOLDS = [
  { xp: 0, level: 1 },
  { xp: 100, level: 2 },
  { xp: 300, level: 3 },
  { xp: 600, level: 4 },
  { xp: 1000, level: 5 },
  { xp: 1500, level: 6 },
  { xp: 2100, level: 7 },
  { xp: 2800, level: 8 },
  { xp: 3600, level: 9 },
  { xp: 4500, level: 10 },
];

// Difficulty star display
export function difficultyStars(level: number): string {
  return "★".repeat(level) + "☆".repeat(5 - level);
}

// Time-based greeting
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
