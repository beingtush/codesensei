"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Zap, ArrowRight, RotateCcw, TrendingUp, AlertTriangle } from "lucide-react";

interface SubmissionResult {
  is_correct: boolean;
  correctness_pct: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  xp_earned: number;
  new_streak: number | null;
  new_level: number | null;
  solution: string;
}

interface EvaluationResultProps {
  result: SubmissionResult;
  onClose: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

function useAnimatedCount(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function EvaluationResult({ result, onClose, onContinue, onRetry }: EvaluationResultProps) {
  const animatedPct = useAnimatedCount(result.correctness_pct);
  const scoreColor = result.correctness_pct >= 90 ? "text-green-400" : result.correctness_pct >= 70 ? "text-amber-400" : "text-red-400";
  const scoreBg = result.correctness_pct >= 90 ? "from-green-500/20" : result.correctness_pct >= 70 ? "from-amber-500/20" : "from-red-500/20";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl"
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 z-10">
          <X className="h-5 w-5" />
        </button>

        {/* Score header */}
        <div className={`bg-gradient-to-b ${scoreBg} to-transparent px-6 pt-6 pb-4 text-center`}>
          <div className="mb-1">
            {result.is_correct ? (
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-red-400" />
            )}
          </div>
          <p className={`text-5xl font-black ${scoreColor} count-up`}>{animatedPct}%</p>
          <p className="mt-1 text-sm text-slate-400">
            {result.is_correct ? "Great job!" : "Keep practicing!"}
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {/* XP Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-semibold text-amber-400">
              <Zap className="h-4 w-4" />
              +{result.xp_earned} XP
            </span>
          </motion.div>

          {/* Feedback */}
          <div className="rounded-xl bg-slate-800/50 p-4">
            <p className="text-sm text-slate-300 leading-relaxed">{result.feedback}</p>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="text-sm text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-green-400 mt-0.5">+</span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                To Improve
              </h4>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="text-sm text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-amber-400 mt-0.5">-</span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {!result.is_correct && (
              <button
                onClick={onRetry}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            )}
            <button
              onClick={onContinue}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
