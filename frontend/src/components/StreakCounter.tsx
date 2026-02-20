"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  count: number;
  isActiveToday: boolean;
  message: string;
}

export default function StreakCounter({ count, isActiveToday, message }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-4 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent px-6 py-4"
    >
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="fire-flicker"
        >
          <Flame
            className={`h-10 w-10 ${
              count > 0 ? "text-orange-400" : "text-slate-600"
            } fire-glow`}
            fill={count > 0 ? "currentColor" : "none"}
          />
        </motion.div>
        {isActiveToday && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-[#0F172A]"
          />
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-orange-400">
            {count}
          </span>
          <span className="text-sm font-medium text-slate-400">
            day{count !== 1 ? "s" : ""} streak
          </span>
        </div>
        <p className="text-xs text-slate-500">{message}</p>
      </div>
    </motion.div>
  );
}
