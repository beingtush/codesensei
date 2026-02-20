"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Eye,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import type { EvaluationResponse } from "@/lib/api";

interface EvaluationResultProps {
  result: EvaluationResponse;
  onNextChallenge: () => void;
  onTryAgain: () => void;
  onShowSolution: () => void;
}

export default function EvaluationResult({
  result,
  onNextChallenge,
  onTryAgain,
  onShowSolution,
}: EvaluationResultProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const isCorrect = result.is_correct;
  const isPerfect = result.correctness_pct >= 95;

  // Animated counter for correctness percentage
  useEffect(() => {
    const target = result.correctness_pct;
    const duration = 1200;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        setDisplayPct(target);
        clearInterval(timer);
      } else {
        setDisplayPct(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.correctness_pct]);

  const pctColor = result.correctness_pct >= 80
    ? "text-green-400"
    : result.correctness_pct >= 50
      ? "text-amber-400"
      : "text-red-400";

  const pctRingColor = result.correctness_pct >= 80
    ? "#22C55E"
    : result.correctness_pct >= 50
      ? "#FBBF24"
      : "#EF4444";

  // SVG circle values for progress ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header: Result icon + message */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
        >
          {isCorrect ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-400" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-red-400" />
          )}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`mt-3 text-2xl font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
        >
          {isPerfect
            ? "Perfect!"
            : isCorrect
              ? "Well Done!"
              : "Not Quite..."}
        </motion.h2>
      </div>

      {/* Score ring + XP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-10"
      >
        {/* Circular progress */}
        <div className="relative">
          <svg width="128" height="128" className="-rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#1E293B"
              strokeWidth="8"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={pctRingColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black tabular-nums ${pctColor}`}>
              {displayPct}%
            </span>
            <span className="text-xs text-slate-500">correct</span>
          </div>
        </div>

        {/* XP earned */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 300 }}
            className="flex items-center gap-2"
          >
            <Zap className="h-8 w-8 text-amber-400" />
            <span className="text-4xl font-black text-amber-400">
              +{result.xp_earned}
            </span>
          </motion.div>
          <p className="mt-1 text-sm text-slate-500">XP earned</p>

          {/* Level/streak badges */}
          <div className="mt-3 flex gap-2">
            {result.new_level != null && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400"
              >
                <TrendingUp className="h-3 w-3" />
                Lv.{result.new_level}
              </motion.span>
            )}
            {result.new_streak != null && result.new_streak > 1 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
                className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-400"
              >
                🔥 {result.new_streak} days
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
      >
        <p className="text-sm leading-relaxed text-slate-300">{result.feedback}</p>
      </motion.div>

      {/* Strengths + Improvements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {/* Strengths */}
        {result.strengths.length > 0 && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-400">
              <ThumbsUp className="h-4 w-4" />
              Strengths
            </div>
            <ul className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-green-500">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {result.improvements.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              To Improve
            </div>
            <ul className="space-y-1.5">
              {result.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-amber-500">-</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-wrap items-center justify-center gap-3 pt-2"
      >
        {!isCorrect && (
          <>
            <button
              onClick={onTryAgain}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={onShowSolution}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700"
            >
              <Eye className="h-4 w-4" />
              See Solution
            </button>
          </>
        )}
        <button
          onClick={onNextChallenge}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:shadow-lg hover:shadow-amber-500/20"
        >
          Next Challenge
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
