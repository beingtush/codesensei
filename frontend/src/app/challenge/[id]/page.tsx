"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, BookOpen, Tag } from "lucide-react";
import { getChallenge, submitChallenge, getHint } from "@/lib/api";
import type { ChallengeDetail, SubmissionResult } from "@/lib/api";
import { TRACKS, CHALLENGE_TYPES, difficultyStars } from "@/lib/constants";
import type { TrackSlug, ChallengeType } from "@/lib/constants";
import CodeEditor, { getLanguageForTrack } from "@/components/CodeEditor";
import HintPanel from "@/components/HintPanel";
import Timer from "@/components/Timer";
import Confetti from "@/components/Confetti";
import LevelUpModal from "@/components/LevelUpModal";
import EvaluationResult from "@/components/EvaluationResult";
import { useTimer } from "@/hooks/useTimer";

// Demo challenge for when API is unavailable
const DEMO_CHALLENGE: ChallengeDetail = {
  id: 1,
  track_id: 1,
  track: "python-advanced",
  track_name: "Python Advanced",
  title: "Implement a LRU Cache",
  type: "code",
  difficulty: 3,
  description: `## LRU Cache Implementation

Design and implement a **Least Recently Used (LRU) Cache** class.

### Requirements:
- \`LRUCache(capacity: int)\` - Initialize the cache with a positive capacity.
- \`get(key: int) -> int\` - Return the value of the key if it exists, otherwise return -1.
- \`put(key: int, value: int)\` - Update or insert the value. When the cache reaches capacity, evict the least recently used key.

### Constraints:
- Both \`get\` and \`put\` must run in **O(1)** average time complexity.

### Example:
\`\`\`python
cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
cache.get(1)     # returns 1
cache.put(3, 3)  # evicts key 2
cache.get(2)     # returns -1 (not found)
\`\`\``,
  hints_available: 3,
  hints: [
    "Consider using a dictionary (hash map) for O(1) lookups.",
    "A doubly-linked list can help track the order of usage.",
    "Python's OrderedDict from collections combines both data structures.",
  ],
  test_cases: [
    { input: "LRUCache(2); put(1,1); put(2,2); get(1)", expected: "1", description: "Basic get after put" },
    { input: "LRUCache(2); put(1,1); put(2,2); put(3,3); get(2)", expected: "-1", description: "Eviction check" },
  ],
  topics_covered: ["Hash Maps", "Linked Lists", "Design Patterns"],
  estimated_minutes: 15,
};

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { elapsedSeconds, formattedTime, isRunning, pause } = useTimer();

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [answer, setAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Fetch challenge on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getChallenge(Number(id));
        setChallenge(data);
      } catch {
        // Fallback to demo challenge
        setChallenge(DEMO_CHALLENGE);
        setLoadError(true);
      }
    }
    load();
  }, [id]);

  // Handle hint request
  const handleRequestHint = useCallback(async () => {
    if (!challenge || hintLoading) return;
    setHintLoading(true);
    try {
      await getHint(challenge.id, hintsUsed);
      setHintsUsed((prev) => prev + 1);
    } catch {
      // If API fails but we have local hints, still reveal
      if (hintsUsed < (challenge.hints?.length || 0)) {
        setHintsUsed((prev) => prev + 1);
      }
    } finally {
      setHintLoading(false);
    }
  }, [challenge, hintsUsed, hintLoading]);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (!challenge || !answer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    pause();

    try {
      const res = await submitChallenge(challenge.id, answer, hintsUsed, elapsedSeconds);
      setResult(res);

      // Trigger celebrations
      if (res.correctness_pct >= 90) {
        setShowConfetti(true);
      }
      if (res.new_level && res.new_level > (previousLevel || 0)) {
        setTimeout(() => setShowLevelUp(true), 1500);
      }
    } catch {
      // Fallback demo result
      setResult({
        is_correct: true,
        correctness_pct: 85,
        feedback: "Good implementation! Your solution correctly handles the basic LRU cache operations.",
        strengths: ["Clean code structure", "Handles edge cases"],
        improvements: ["Consider thread safety", "Add documentation"],
        xp_earned: 30,
        new_streak: 3,
        new_level: null,
        solution: "# See the model solution in the challenge description",
        track_level: 2,
        track_xp: 150,
        current_streak: 3,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, answer, hintsUsed, elapsedSeconds, isSubmitting, pause, previousLevel]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setResult(null);
    setAnswer("");
  }, []);

  if (!challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const trackData = TRACKS[challenge.track as TrackSlug] ?? {
    name: challenge.track_name || challenge.track,
    icon: "📘",
    color: "#64748B",
    bgGlow: "from-slate-500/20 to-slate-500/0",
    border: "border-slate-500/30",
    badge: "bg-slate-500/15 text-slate-400",
    ring: "ring-slate-500/40",
  };

  const typeData = CHALLENGE_TYPES[challenge.type as ChallengeType] ?? { icon: "📝", label: challenge.type };
  const language = getLanguageForTrack(challenge.track);
  const isQuiz = challenge.type === "quiz" || challenge.type === "speedround";

  return (
    <div className="min-h-screen pb-24">
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <AnimatePresence>
        {showLevelUp && result?.new_level && (
          <LevelUpModal
            show={showLevelUp}
            newLevel={result.new_level}
            onContinue={() => {
              setShowLevelUp(false);
              router.push("/");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !showLevelUp && (
          <EvaluationResult
            result={result}
            onClose={() => setResult(null)}
            onContinue={() => router.push("/")}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>

          <div className="flex items-center gap-4">
            <Timer formattedTime={formattedTime} isRunning={isRunning} />

            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${trackData.badge}`}>
              {trackData.icon} {trackData.name}
            </span>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{typeData.icon} {typeData.label}</span>
              <span className="text-amber-400/80">{difficultyStars(challenge.difficulty)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400"
          >
            Using demo challenge — backend unavailable
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-2xl font-bold text-slate-100"
        >
          {challenge.title}
        </motion.h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left panel: Description + Hints */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Description card */}
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Description</h2>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-line">
                {challenge.description}
              </div>
            </div>

            {/* Topics */}
            {challenge.topics_covered && challenge.topics_covered.length > 0 && (
              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {challenge.topics_covered.map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hints */}
            {challenge.hints && challenge.hints.length > 0 && (
              <HintPanel
                hints={challenge.hints}
                hintsUsed={hintsUsed}
                onRequestHint={handleRequestHint}
                isLoading={hintLoading}
              />
            )}
          </motion.div>

          {/* Right panel: Editor / Quiz */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {isQuiz ? (
              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Your Answer</h2>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={8}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
                />
              </div>
            ) : (
              <CodeEditor
                language={language}
                initialValue={`# Write your ${language} solution here\n\n`}
                onChange={setAnswer}
              />
            )}

            {/* Test cases preview */}
            {challenge.test_cases && challenge.test_cases.length > 0 && (
              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Test Cases</h3>
                <div className="space-y-2">
                  {challenge.test_cases.slice(0, 3).map((tc, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/50 p-3 text-xs font-mono">
                      {tc.description && (
                        <p className="mb-1 font-sans text-slate-400">{tc.description}</p>
                      )}
                      <p className="text-slate-300">
                        <span className="text-slate-500">Input: </span>{tc.input}
                      </p>
                      <p className="text-green-400/80">
                        <span className="text-slate-500">Expected: </span>{tc.expected}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom submit bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Timer formattedTime={formattedTime} isRunning={isRunning} />
            {hintsUsed > 0 && (
              <span className="text-amber-400/60">
                {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !answer.trim()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Answer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
