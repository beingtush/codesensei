"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Send,
  Loader2,
  BookOpen,
  Code2,
  Eye,
  EyeOff,
} from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import HintPanel from "@/components/HintPanel";
import Timer from "@/components/Timer";
import EvaluationResult from "@/components/EvaluationResult";
import TrackBadge from "@/components/TrackBadge";
import Confetti, { StreakMilestone, LevelUpPopup } from "@/components/Confetti";
import {
  getTrackData,
  CHALLENGE_TYPES,
  type ChallengeType,
  difficultyStars,
} from "@/lib/constants";
import {
  getChallenge,
  submitChallenge,
  type ChallengeDetail,
  type EvaluationResponse,
} from "@/lib/api";

// Track ID to slug mapping (backend returns track_id, not slug)
const TRACK_SLUGS: Record<number, string> = {
  1: "python-advanced",
  2: "java-deep-dive",
  3: "automation-testing",
  4: "dsa-problem-solving",
};

// Demo challenge for offline development
const DEMO_CHALLENGE: ChallengeDetail = {
  id: 1,
  track_id: 1,
  type: "code",
  difficulty: 3,
  title: "Build a Retry Decorator with Exponential Backoff",
  description:
    'Create a Python decorator `@retry(max_attempts=3, backoff_factor=2)` that:\n\n' +
    '1. Retries the decorated function up to `max_attempts` times on any exception\n' +
    '2. Waits `backoff_factor ** attempt` seconds between retries\n' +
    '3. Raises the last exception if all attempts fail\n' +
    '4. Logs each retry attempt\n\n' +
    '```python\n@retry(max_attempts=3, backoff_factor=2)\ndef fetch_data(url):\n    # may raise ConnectionError\n    ...\n```',
  hints: [
    "Use a nested function structure: outer takes params, middle is the decorator, inner is the wrapper",
    "Use time.sleep() for the backoff delay and functools.wraps to preserve the function metadata",
    "Catch exceptions in a loop, sleep on failure, and re-raise after the final attempt",
  ],
  test_cases: [
    { input: "Decorate a function that fails twice then succeeds", expected: "Returns result on 3rd attempt" },
    { input: "Decorate a function that always fails with max_attempts=2", expected: "Raises exception after 2 attempts" },
  ],
  topics_covered: ["decorators", "error handling", "functools"],
  estimated_minutes: 11,
};

type ViewMode = "solving" | "result" | "solution";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = Number(params.id);

  // Challenge state
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Solving state
  const [answer, setAnswer] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const elapsedRef = useRef(0);

  // Result state
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("solving");
  const [showSolution, setShowSolution] = useState(false);

  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const previousLevel = useRef<number | null>(null);

  // Load challenge
  useEffect(() => {
    async function load() {
      try {
        const data = await getChallenge(challengeId);
        setChallenge(data);
        // Pre-fill for bughunt: extract code from description
        if (data.type === "bughunt") {
          const codeMatch = data.description.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeMatch) {
            setAnswer(codeMatch[1].trim());
          }
        }
      } catch {
        // Fall back to demo
        setChallenge(DEMO_CHALLENGE);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [challengeId]);

  const trackSlug = challenge ? TRACK_SLUGS[challenge.track_id] ?? "python-advanced" : "python-advanced";
  const trackData = getTrackData(trackSlug);
  const typeData = challenge
    ? CHALLENGE_TYPES[challenge.type as ChallengeType] ?? { icon: "📝", label: challenge.type }
    : { icon: "📝", label: "Challenge" };

  const handleTimerTick = useCallback((s: number) => {
    elapsedRef.current = s;
  }, []);

  const handleSubmit = async () => {
    if (!challenge || !answer.trim() || submitting) return;

    setSubmitting(true);
    setTimerRunning(false);

    try {
      const res = await submitChallenge(
        challenge.id,
        answer,
        hintsRevealed,
        elapsedRef.current,
      );
      setResult(res);
      setViewMode("result");

      // Celebrations
      if (res.correctness_pct >= 95) {
        setShowConfetti(true);
      }
      // Streak milestone (3, 7, 14, 30, 100)
      if (res.new_streak && [3, 7, 14, 30, 50, 100].includes(res.new_streak)) {
        setTimeout(() => setStreakMilestone(res.new_streak), 1500);
      }
      // Level up
      if (res.new_level && previousLevel.current != null && res.new_level > previousLevel.current) {
        setTimeout(() => setLevelUp(res.new_level), 2000);
      }
      if (res.new_level) {
        previousLevel.current = res.new_level;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setViewMode("solving");
    setResult(null);
    setTimerRunning(true);
    setShowConfetti(false);
  };

  const handleShowSolution = () => {
    setShowSolution(true);
  };

  const handleNextChallenge = () => {
    router.push("/");
  };

  // Render description with basic markdown-like formatting
  function renderDescription(text: string) {
    // Split into code blocks and text segments
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
        return (
          <pre
            key={i}
            className="my-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-300"
          >
            <code>{code}</code>
          </pre>
        );
      }
      // Process inline formatting
      return (
        <div key={i} className="whitespace-pre-wrap">
          {part.split("\n").map((line, j) => {
            // Bold: **text**
            const formatted = line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-slate-100">$1</strong>',
            );
            // Inline code: `text`
            const withCode = formatted.replace(
              /`([^`]+)`/g,
              '<code class="rounded bg-slate-800 px-1.5 py-0.5 text-sm font-mono text-amber-300">$1</code>',
            );
            return (
              <span key={j}>
                <span dangerouslySetInnerHTML={{ __html: withCode }} />
                {j < part.split("\n").length - 1 && <br />}
              </span>
            );
          })}
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Challenge not found</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-amber-400 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isCodeType = challenge.type === "code" || challenge.type === "bughunt";

  return (
    <>
      {/* Celebrations */}
      <Confetti active={showConfetti} />
      <StreakMilestone
        streak={streakMilestone ?? 0}
        visible={streakMilestone !== null}
        onClose={() => setStreakMilestone(null)}
      />
      <LevelUpPopup
        level={levelUp ?? 0}
        visible={levelUp !== null}
        onClose={() => setLevelUp(null)}
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Top bar: Back + title + meta + timer */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrackBadge slug={trackSlug} size="sm" />
                <span className="text-xs text-slate-500">
                  {typeData.icon} {typeData.label}
                </span>
                <span className="text-xs text-amber-400/80">
                  {difficultyStars(challenge.difficulty)}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 sm:text-xl">
                {challenge.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              ~{challenge.estimated_minutes}m
            </div>
            <Timer running={timerRunning} onTick={handleTimerTick} />
          </div>
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content: Two-panel layout */}
        <AnimatePresence mode="wait">
          {viewMode === "result" && result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8"
            >
              <EvaluationResult
                result={result}
                onNextChallenge={handleNextChallenge}
                onTryAgain={handleTryAgain}
                onShowSolution={handleShowSolution}
              />

              {/* Solution panel (shown on demand) */}
              <AnimatePresence>
                {showSolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-400">
                        <BookOpen className="h-4 w-4" />
                        Ideal Solution
                      </div>
                      {/* If it looks like code, render in a code block */}
                      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
                        <code>
                          {/* Solution comes from the challenge model but is not exposed in response,
                              show a placeholder or re-fetch */}
                          Solution details are available in the challenge review.
                        </code>
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="solving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              {/* Left panel: Challenge description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col gap-4"
              >
                {/* Problem statement */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <BookOpen className="h-4 w-4" />
                    Problem
                  </div>
                  <div className="prose-sm text-sm leading-relaxed text-slate-300">
                    {renderDescription(challenge.description)}
                  </div>

                  {/* Test cases (for code challenges) */}
                  {challenge.test_cases.length > 0 && (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Test Cases
                      </h4>
                      <div className="space-y-2">
                        {challenge.test_cases.map((tc, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-slate-950 p-3 text-xs font-mono"
                          >
                            <div className="text-slate-500">
                              Input:{" "}
                              <span className="text-slate-300">{tc.input}</span>
                            </div>
                            <div className="text-slate-500">
                              Expected:{" "}
                              <span className="text-green-400">{tc.expected}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {challenge.topics_covered.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {challenge.topics_covered.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hints */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
                  <div className="mb-3 text-sm font-semibold text-slate-400">
                    Hints
                  </div>
                  <HintPanel
                    hints={challenge.hints}
                    hintsRevealed={hintsRevealed}
                    onRevealHint={() =>
                      setHintsRevealed((prev) =>
                        Math.min(prev + 1, challenge.hints.length),
                      )
                    }
                  />
                </div>
              </motion.div>

              {/* Right panel: Answer input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <Code2 className="h-4 w-4" />
                      {isCodeType ? "Your Code" : "Your Answer"}
                    </div>
                    {isCodeType && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-500">
                        {trackData.editorLang}
                      </span>
                    )}
                  </div>

                  {/* Code editor for code/bughunt, text area for others */}
                  {isCodeType ? (
                    <CodeEditor
                      value={answer}
                      onChange={setAnswer}
                      language={trackData.editorLang}
                      height="400px"
                    />
                  ) : challenge.type === "quiz" ? (
                    <QuizInput
                      description={challenge.description}
                      value={answer}
                      onChange={setAnswer}
                    />
                  ) : (
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="h-[400px] w-full resize-none rounded-xl border border-slate-700/50 bg-slate-950 p-4 font-mono text-sm text-slate-300 placeholder-slate-600 outline-none transition-colors focus:border-amber-500/30"
                    />
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || submitting}
                  whileHover={answer.trim() && !submitting ? { scale: 1.02 } : {}}
                  whileTap={answer.trim() && !submitting ? { scale: 0.98 } : {}}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all ${
                    answer.trim() && !submitting
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:shadow-lg hover:shadow-amber-500/20"
                      : "cursor-not-allowed bg-slate-800 text-slate-600"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Answer
                    </>
                  )}
                </motion.button>

                {/* Hint cost indicator */}
                {hintsRevealed > 0 && (
                  <p className="text-center text-xs text-slate-600">
                    {hintsRevealed} hint{hintsRevealed > 1 ? "s" : ""} used &middot;{" "}
                    -{hintsRevealed * 10}% XP penalty
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/** Quiz-specific input: detect multiple choice options and render as buttons */
function QuizInput({
  description,
  value,
  onChange,
}: {
  description: string;
  value: string;
  onChange: (val: string) => void;
}) {
  // Try to extract options (A) ... B) ... C) ... D) ...)
  const optionRegex = /([A-D])\)\s*(.+?)(?=\n[A-D]\)|$)/g;
  const options: { letter: string; text: string }[] = [];
  let match;
  while ((match = optionRegex.exec(description)) !== null) {
    options.push({ letter: match[1], text: match[2].trim() });
  }

  if (options.length >= 2) {
    return (
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.letter}
            onClick={() => onChange(opt.letter)}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
              value === opt.letter
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
            }`}
          >
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                value === opt.letter
                  ? "border-amber-500 bg-amber-500 text-slate-900"
                  : "border-slate-600 text-slate-400"
              }`}
            >
              {opt.letter}
            </span>
            <span className="pt-0.5">{opt.text}</span>
          </button>
        ))}
      </div>
    );
  }

  // Fallback: plain text input
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here..."
      className="h-[300px] w-full resize-none rounded-xl border border-slate-700/50 bg-slate-950 p-4 text-sm text-slate-300 placeholder-slate-600 outline-none transition-colors focus:border-amber-500/30"
    />
  );
}
