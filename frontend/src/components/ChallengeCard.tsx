"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { CHALLENGE_TYPES, TRACKS, type ChallengeType, type TrackSlug, difficultyStars } from "@/lib/constants";

interface ChallengeCardProps {
  id: number;
  track: string;
  title: string;
  type: string;
  difficulty: number;
  completed: boolean;
  isCorrect: boolean | null;
  xpEarned: number | null;
  index: number;
}

export default function ChallengeCard({
  id,
  track,
  title,
  type,
  difficulty,
  completed,
  isCorrect,
  xpEarned,
  index,
}: ChallengeCardProps) {
  const trackData = TRACKS[track as TrackSlug] ?? {
    name: track,
    icon: "📘",
    color: "#64748B",
    bgGlow: "from-slate-500/20 to-slate-500/0",
    border: "border-slate-500/30",
    badge: "bg-slate-500/15 text-slate-400",
    ring: "ring-slate-500/40",
  };
  const typeData = CHALLENGE_TYPES[type as ChallengeType] ?? { icon: "📝", label: type };

  const estimatedMinutes = 5 + difficulty * 2;

  return (
    <Link href={`/challenge/${id}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border ${trackData.border} bg-slate-900/50 p-5 transition-all hover:bg-slate-900/80`}
    >
      {/* Background glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${trackData.bgGlow} opacity-0 transition-opacity group-hover:opacity-100`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Top row: badge + status */}
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${trackData.badge}`}>
            {trackData.icon} {trackData.name}
          </span>

          {completed ? (
            isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )
          ) : (
            <Circle className="h-5 w-5 text-slate-600" />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base font-semibold text-slate-100 line-clamp-2">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            {typeData.icon} {typeData.label}
          </span>
          <span className="text-amber-400/80">{difficultyStars(difficulty)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{estimatedMinutes}m
          </span>
        </div>

        {/* XP earned badge */}
        {completed && xpEarned != null && xpEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400"
          >
            +{xpEarned} XP
          </motion.div>
        )}
      </div>

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
        style={{ backgroundColor: trackData.color }}
      />
    </motion.div>
    </Link>
  );
}
