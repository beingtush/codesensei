"use client";

import { motion } from "framer-motion";

interface TopicStrengthProps {
  /** Topic name → strength 0-100 */
  topics: { name: string; strength: number }[];
  color?: string;
}

export default function TopicStrength({
  topics,
  color = "#22C55E",
}: TopicStrengthProps) {
  if (topics.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
        Complete challenges to see topic strengths
      </div>
    );
  }

  const sorted = [...topics].sort((a, b) => b.strength - a.strength);

  return (
    <div className="space-y-2.5">
      {sorted.map((topic, i) => {
        const isWeak = topic.strength < 50;
        const barColor = isWeak ? "#EF4444" : color;
        return (
          <div key={topic.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-300">{topic.name}</span>
              <span
                className="font-medium"
                style={{ color: barColor }}
              >
                {topic.strength}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${topic.strength}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
