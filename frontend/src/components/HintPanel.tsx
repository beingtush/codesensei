"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Lock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface HintPanelProps {
  hints: string[];
  hintsUsed: number;
  onRequestHint: () => void;
  isLoading?: boolean;
}

export default function HintPanel({ hints, hintsUsed, onRequestHint, isLoading = false }: HintPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalHints = hints.length;

  if (totalHints === 0) return null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-slate-300 hover:text-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          <span>Hints ({hintsUsed}/{totalHints})</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              {Array.from({ length: totalHints }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {i < hintsUsed ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2"
                    >
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="text-slate-300">{hints[i]}</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>Hint {i + 1} locked</span>
                    </div>
                  )}
                </div>
              ))}

              {hintsUsed < totalHints && (
                <button
                  onClick={onRequestHint}
                  disabled={isLoading}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Lightbulb className="h-3 w-3" />
                  )}
                  Show Hint
                  <span className="text-amber-500/60">(-10 XP)</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
