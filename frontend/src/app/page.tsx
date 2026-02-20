"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Target, TrendingUp, Zap } from "lucide-react";
import StreakCounter from "@/components/StreakCounter";
import ChallengeCard from "@/components/ChallengeCard";
import XPBar from "@/components/XPBar";
import { getGreeting, TRACKS, type TrackSlug } from "@/lib/constants";
import type { DailyChallenge, ProgressOverview, WeeklyData } from "@/lib/api";

// Demo data for first render (before backend is connected)
const DEMO_CHALLENGES: DailyChallenge[] = [
  {
    id: 1,
    track: "python-advanced",
    track_name: "Python Advanced",
    track_icon: "🐍",
    track_color: "#22C55E",
    title: "Implement a Thread-Safe Singleton with Metaclasses",
    type: "code",
    difficulty: 4,
    completed: false,
    is_correct: null,
    xp_earned: null,
  },
  {
    id: 2,
    track: "dsa-mastery",
    track_name: "DSA Mastery",
    track_icon: "🧮",
    track_color: "#06B6D4",
    title: "Find the Shortest Path in a Weighted DAG",
    type: "code",
    difficulty: 3,
    completed: true,
    is_correct: true,
    xp_earned: 42,
  },
  {
    id: 3,
    track: "java-enterprise",
    track_name: "Java Enterprise",
    track_icon: "☕",
    track_color: "#F97316",
    title: "Spot the Race Condition in This Spring Service",
    type: "bughunt",
    difficulty: 5,
    completed: false,
    is_correct: null,
    xp_earned: null,
  },
  {
    id: 4,
    track: "automation-devops",
    track_name: "Automation & DevOps",
    track_icon: "🤖",
    track_color: "#A855F7",
    title: "What happens when a Kubernetes Pod exceeds its memory limit?",
    type: "quiz",
    difficulty: 2,
    completed: true,
    is_correct: false,
    xp_earned: 0,
  },
  {
    id: 5,
    track: "python-advanced",
    track_name: "Python Advanced",
    track_icon: "🐍",
    track_color: "#22C55E",
    title: "Design an Async Rate Limiter with Token Bucket",
    type: "design",
    difficulty: 4,
    completed: false,
    is_correct: null,
    xp_earned: null,
  },
  {
    id: 6,
    track: "dsa-mastery",
    track_name: "DSA Mastery",
    track_icon: "🧮",
    track_color: "#06B6D4",
    title: "Binary Search Speed Round — 5 Problems, 10 Minutes",
    type: "speedround",
    difficulty: 2,
    completed: false,
    is_correct: null,
    xp_earned: null,
  },
];

const DEMO_OVERVIEW: ProgressOverview = {
  user_id: 1,
  total_xp: 1247,
  overall_level: 5,
  total_challenges_completed: 38,
  total_challenges_correct: 29,
  overall_accuracy: 76.3,
  streak: {
    current_streak: 7,
    longest_streak: 14,
    last_activity_date: new Date().toISOString().slice(0, 10),
    is_active_today: true,
    motivational_message: "A full week! You're officially committed.",
  },
  tracks: [
    {
      track: "python-advanced",
      name: "Python Advanced",
      icon: "🐍",
      level: 4,
      xp: 620,
      level_progress: { level: 4, current_xp: 620, xp_in_level: 20, xp_for_next_level: 400, xp_remaining: 380, is_max_level: false },
      challenges_completed: 15,
      challenges_correct: 12,
      accuracy: 80.0,
    },
    {
      track: "java-enterprise",
      name: "Java Enterprise",
      icon: "☕",
      level: 2,
      xp: 210,
      level_progress: { level: 2, current_xp: 210, xp_in_level: 110, xp_for_next_level: 200, xp_remaining: 90, is_max_level: false },
      challenges_completed: 8,
      challenges_correct: 5,
      accuracy: 62.5,
    },
    {
      track: "dsa-mastery",
      name: "DSA Mastery",
      icon: "🧮",
      level: 3,
      xp: 347,
      level_progress: { level: 3, current_xp: 347, xp_in_level: 47, xp_for_next_level: 300, xp_remaining: 253, is_max_level: false },
      challenges_completed: 10,
      challenges_correct: 8,
      accuracy: 80.0,
    },
    {
      track: "automation-devops",
      name: "Automation & DevOps",
      icon: "🤖",
      level: 1,
      xp: 70,
      level_progress: { level: 1, current_xp: 70, xp_in_level: 70, xp_for_next_level: 100, xp_remaining: 30, is_max_level: false },
      challenges_completed: 5,
      challenges_correct: 4,
      accuracy: 80.0,
    },
  ],
};

const DEMO_WEEKLY: WeeklyData = {
  user_id: 1,
  period: { from: "2026-02-14", to: "2026-02-20" },
  days: [
    { date: "2026-02-14", challenges_done: 2, xp_earned: 85, correct: 2 },
    { date: "2026-02-15", challenges_done: 3, xp_earned: 120, correct: 2 },
    { date: "2026-02-16", challenges_done: 1, xp_earned: 50, correct: 1 },
    { date: "2026-02-17", challenges_done: 4, xp_earned: 195, correct: 3 },
    { date: "2026-02-18", challenges_done: 2, xp_earned: 80, correct: 2 },
    { date: "2026-02-19", challenges_done: 3, xp_earned: 140, correct: 2 },
    { date: "2026-02-20", challenges_done: 1, xp_earned: 42, correct: 1 },
  ],
  summary: { total_challenges: 16, total_xp: 712, active_days: 7 },
};

export default function Dashboard() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>(DEMO_CHALLENGES);
  const [overview, setOverview] = useState<ProgressOverview>(DEMO_OVERVIEW);
  const [weekly, setWeekly] = useState<WeeklyData>(DEMO_WEEKLY);

  // Try to load real data from API
  useEffect(() => {
    async function loadData() {
      try {
        const { getOverview, getDailyChallenges, getWeekly } = await import("@/lib/api");
        const [overviewData, dailyData, weeklyData] = await Promise.allSettled([
          getOverview(),
          getDailyChallenges(),
          getWeekly(),
        ]);
        if (overviewData.status === "fulfilled") setOverview(overviewData.value);
        if (dailyData.status === "fulfilled" && dailyData.value.challenges.length > 0) {
          setChallenges(dailyData.value.challenges);
        }
        if (weeklyData.status === "fulfilled") setWeekly(weeklyData.value);
      } catch {
        // Silently use demo data
      }
    }
    loadData();
  }, []);

  const streak = overview.streak;
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Section: Greeting + Streak + XP */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Greeting */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Sensei
            </span>
            !
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {challenges.filter(c => !c.completed).length} challenges waiting for you today
          </p>
        </motion.div>

        {/* Right: Streak + Total XP */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <StreakCounter
            count={streak.current_streak}
            isActiveToday={streak.is_active_today}
            message={streak.motivational_message}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent px-6 py-4"
          >
            <Zap className="h-8 w-8 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {overview.total_xp.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Total XP &middot; Lv.{overview.overall_level}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Middle Section: Today&apos;s Challenges */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 flex items-center gap-2"
        >
          <BookOpen className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Today&apos;s Challenges</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c, i) => (
            <ChallengeCard
              key={c.id}
              id={c.id}
              track={c.track}
              title={c.title}
              type={c.type}
              difficulty={c.difficulty}
              completed={c.completed}
              isCorrect={c.is_correct}
              xpEarned={c.xp_earned}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Bottom Section: Track Progress + Quick Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Track Progress (takes 2 cols) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Track Progress</h2>
          </div>

          <div className="space-y-5">
            {overview.tracks.map((t) => {
              const trackInfo = TRACKS[t.track as TrackSlug];
              return (
                <div key={t.track} className="flex items-center gap-4">
                  <div className="w-8 text-center text-xl">{t.icon}</div>
                  <div className="flex-1">
                    <XPBar
                      currentXP={t.xp}
                      xpInLevel={t.level_progress.xp_in_level}
                      xpForNext={t.level_progress.xp_for_next_level}
                      level={t.level}
                      trackColor={trackInfo?.color ?? "#64748B"}
                      label={t.name}
                    />
                  </div>
                  <div className="w-16 text-right text-xs text-slate-500">
                    {t.accuracy}%
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Quick Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">This Week</h2>
          </div>

          <div className="space-y-4">
            {/* Weekly summary stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Challenges"
                value={weekly.summary.total_challenges}
                color="text-blue-400"
              />
              <StatCard
                label="XP Earned"
                value={weekly.summary.total_xp}
                color="text-amber-400"
                prefix="+"
              />
              <StatCard
                label="Active Days"
                value={`${weekly.summary.active_days}/7`}
                color="text-green-400"
              />
              <StatCard
                label="Accuracy"
                value={`${overview.overall_accuracy}%`}
                color="text-purple-400"
              />
            </div>

            {/* Mini activity heatmap */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Daily Activity</p>
              <div className="flex items-end justify-between gap-1 h-16">
                {weekly.days.map((d) => {
                  const maxChallenges = Math.max(...weekly.days.map(dd => dd.challenges_done), 1);
                  const heightPct = d.challenges_done > 0
                    ? Math.max(20, (d.challenges_done / maxChallenges) * 100)
                    : 8;
                  const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);

                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                      <div
                        className={`w-full rounded-sm transition-all ${
                          d.challenges_done > 0
                            ? "bg-gradient-to-t from-amber-500/60 to-amber-400"
                            : "bg-slate-800"
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: d.challenges_done > 0 ? 12 : 3 }}
                      />
                      <span className="text-[10px] text-slate-600">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strongest track */}
            {overview.tracks.length > 0 && (
              <div className="mt-3 rounded-xl bg-slate-800/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Strongest Track</p>
                {(() => {
                  const best = [...overview.tracks].sort((a, b) => b.accuracy - a.accuracy)[0];
                  const trackInfo = TRACKS[best.track as TrackSlug];
                  return (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg">{best.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: trackInfo?.color }}>
                        {best.name}
                      </span>
                      <span className="ml-auto text-xs text-slate-400">{best.accuracy}% accuracy</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  prefix = "",
}: {
  label: string;
  value: string | number;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {prefix}{typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
