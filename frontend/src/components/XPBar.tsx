"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  xpInLevel: number;
  xpForNext: number | null;
  level: number;
  trackColor?: string;
  label?: string;
}

export default function XPBar({
  currentXP,
  xpInLevel,
  xpForNext,
  level,
  trackColor = "#FBBF24",
  label,
}: XPBarProps) {
  const isMaxLevel = xpForNext === null;
  const pct = isMaxLevel ? 100 : xpForNext > 0 ? (xpInLevel / xpForNext) * 100 : 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            Lv.{level}
          </span>
          {label && (
            <span className="text-xs text-slate-500">{label}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Zap className="h-3 w-3" style={{ color: trackColor }} />
          {isMaxLevel ? (
            <span>{currentXP.toLocaleString()} XP (MAX)</span>
          ) : (
            <span>
              {xpInLevel.toLocaleString()} / {xpForNext?.toLocaleString()} XP
            </span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="xp-shimmer absolute inset-y-0 left-0 rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, ${trackColor}, ${trackColor}dd, ${trackColor})`,
          }}
        />
      </div>
    </div>
  );
}
