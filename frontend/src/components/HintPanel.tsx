"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, AlertTriangle } from "lucide-react";

interface HintPanelProps {
  hints: string[];
  hintsRevealed: number;
  onRevealHint: () => void;
  maxHints?: number;
}

export default function HintPanel({
  hints,
  hintsRevealed,
  onRevealHint,
  maxHints = 3,
}: HintPanelProps) {
  const canRevealMore = hintsRevealed < Math.min(hints.length, maxHints);

  return (
    <div className="space-y-3">
      {/* Revealed hints */}
      <AnimatePresence>
        {hints.slice(0, hintsRevealed).map((hint, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Hint {i + 1}
            </div>
            <p className="text-sm text-slate-300">{hint}</p>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show hint button */}
      {canRevealMore && (
        <button
          onClick={onRevealHint}
          className="group flex w-full items-center justify-between rounded-xl border border-dashed border-slate-700 bg-slate-800/50 p-4 text-left transition-colors hover:border-amber-500/30 hover:bg-amber-500/5"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-slate-500 transition-colors group-hover:text-amber-400" />
            <span className="text-sm font-medium text-slate-400 transition-colors group-hover:text-amber-400">
              Show Hint {hintsRevealed + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <AlertTriangle className="h-3 w-3" />
              -10% XP
            </span>
            <ChevronDown className="h-4 w-4 text-slate-600 transition-colors group-hover:text-amber-400" />
          </div>
        </button>
      )}

      {/* All hints used */}
      {!canRevealMore && hintsRevealed > 0 && (
        <p className="text-center text-xs text-slate-600">
          All {hintsRevealed} hint{hintsRevealed > 1 ? "s" : ""} revealed
        </p>
      )}
    </div>
  );
}
