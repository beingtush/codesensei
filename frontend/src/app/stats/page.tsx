"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import { getOverview, getWeekly } from "@/lib/api";
import type { ProgressOverview, WeeklyData } from "@/lib/api";
import { TRACKS, type TrackSlug } from "@/lib/constants";
import SkillRadar from "@/components/SkillRadar";
import ActivityHeatmap from "@/components/ActivityHeatmap";

// Demo data for when API is unavailable
const DEMO_OVERVIEW: ProgressOverview = {
  user_id: 1,
  total_xp: 2450,
  overall_level: 5,
  total_challenges_completed: 47,
  total_challenges_correct: 38,
  overall_accuracy: 80.9,
  streak: {
    current_streak: 5,
    longest_streak: 12,
    last_activity_date: new Date().toISOString().split("T")[0],
    is_active_today: true,
    motivational_message: "Great streak! Keep it going!",
  },
  tracks: [
    { track: "python-advanced", name: "Python Advanced", icon: "🐍", level: 4, xp: 820, level_progress: { level: 4, current_xp: 820, xp_in_level: 220, xp_for_next_level: 400, xp_remaining: 180, is_max_level: false }, challenges_completed: 18, challenges_correct: 15, accuracy: 83.3 },
    { track: "java-deep-dive", name: "Java Deep Dive", icon: "☕", level: 3, xp: 540, level_progress: { level: 3, current_xp: 540, xp_in_level: 240, xp_for_next_level: 300, xp_remaining: 60, is_max_level: false }, challenges_completed: 12, challenges_correct: 10, accuracy: 83.3 },
    { track: "dsa-problem-solving", name: "DSA & Problem Solving", icon: "🧮", level: 3, xp: 480, level_progress: { level: 3, current_xp: 480, xp_in_level: 180, xp_for_next_level: 300, xp_remaining: 120, is_max_level: false }, challenges_completed: 10, challenges_correct: 7, accuracy: 70.0 },
    { track: "automation-testing", name: "Automation & Testing", icon: "🤖", level: 3, xp: 610, level_progress: { level: 3, current_xp: 610, xp_in_level: 10, xp_for_next_level: 300, xp_remaining: 290, is_max_level: false }, challenges_completed: 7, challenges_correct: 6, accuracy: 85.7 },
  ],
};

const DEMO_WEEKLY: WeeklyData = {
  user_id: 1,
  period: { from: "2026-02-14", to: "2026-02-20" },
  days: [
    { date: "2026-02-14", challenges_done: 3, xp_earned: 120, correct: 2 },
    { date: "2026-02-15", challenges_done: 5, xp_earned: 200, correct: 4 },
    { date: "2026-02-16", challenges_done: 2, xp_earned: 80, correct: 2 },
    { date: "2026-02-17", challenges_done: 0, xp_earned: 0, correct: 0 },
    { date: "2026-02-18", challenges_done: 4, xp_earned: 175, correct: 3 },
    { date: "2026-02-19", challenges_done: 3, xp_earned: 140, correct: 3 },
    { date: "2026-02-20", challenges_done: 2, xp_earned: 90, correct: 1 },
  ],
  summary: { total_challenges: 19, total_xp: 805, active_days: 6 },
};

// Generate demo heatmap data (last 12 weeks)
function generateDemoHeatmap() {
  const data: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 84; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    // Random activity pattern — more on weekdays
    const dayOfWeek = d.getDay();
    const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
    const count = Math.random() > (isWeekday ? 0.3 : 0.6) ? Math.floor(Math.random() * 6) + 1 : 0;
    data.push({ date: dateStr, count });
  }
  return data;
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "12px",
    fontSize: 12,
  },
  labelStyle: { color: "#CBD5E1" },
};

export default function StatsPage() {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [heatmapData] = useState(() => generateDemoHeatmap());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, wk] = await Promise.allSettled([getOverview(), getWeekly()]);
        setOverview(ov.status === "fulfilled" ? ov.value : DEMO_OVERVIEW);
        setWeekly(wk.status === "fulfilled" ? wk.value : DEMO_WEEKLY);
      } catch {
        setOverview(DEMO_OVERVIEW);
        setWeekly(DEMO_WEEKLY);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !overview || !weekly) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  // Prepare chart data
  const radarData = overview.tracks.map((t) => ({
    name: t.name,
    accuracy: t.accuracy,
    level: t.level,
    color: TRACKS[t.track as TrackSlug]?.color ?? "#64748B",
  }));

  const weeklyChartData = weekly.days.map((d) => {
    const dayName = new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
    return { name: dayName, challenges: d.challenges_done, xp: d.xp_earned, accuracy: d.challenges_done > 0 ? Math.round((d.correct / d.challenges_done) * 100) : 0 };
  });

  // Challenge type breakdown (from track data)
  const trackBreakdown = overview.tracks.map((t) => ({
    name: t.name.split(" ")[0], // short name
    challenges: t.challenges_completed,
    color: TRACKS[t.track as TrackSlug]?.color ?? "#64748B",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-100">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Track your progress and identify areas to improve</p>
      </motion.div>

      {/* Top stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { icon: Zap, label: "Total XP", value: overview.total_xp.toLocaleString(), color: "text-amber-400", bg: "bg-amber-500/10" },
          { icon: TrendingUp, label: "Level", value: `Lv. ${overview.overall_level}`, color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: Target, label: "Accuracy", value: `${overview.overall_accuracy}%`, color: "text-green-400", bg: "bg-green-500/10" },
          { icon: Calendar, label: "Streak", value: `${overview.streak.current_streak} days`, color: "text-orange-400", bg: "bg-orange-500/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
          >
            <div className={`mb-2 inline-flex rounded-lg ${stat.bg} p-2`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Row: Skill Radar + Activity Heatmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-slate-100">Skill Radar</h2>
          </div>
          <SkillRadar tracks={radarData} />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Accuracy
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Level
            </span>
          </div>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-slate-100">Activity</h2>
          </div>
          <ActivityHeatmap data={heatmapData} weeks={12} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
              <p className="text-lg font-bold text-slate-100">{overview.total_challenges_completed}</p>
              <p className="text-[10px] text-slate-500">Total Challenges</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
              <p className="text-lg font-bold text-slate-100">{weekly.summary.active_days}/7</p>
              <p className="text-[10px] text-slate-500">Active This Week</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
              <p className="text-lg font-bold text-slate-100">{overview.streak.longest_streak}</p>
              <p className="text-[10px] text-slate-500">Best Streak</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row: Weekly XP + Accuracy Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-100">XP This Week</h2>
            <span className="ml-auto text-sm font-bold text-amber-400">
              {weekly.summary.total_xp} XP
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="xp" radius={[6, 6, 0, 0]}>
                {weeklyChartData.map((_, index) => (
                  <Cell key={index} fill={index === weeklyChartData.length - 1 ? "#FBBF24" : "#92400E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Accuracy Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-slate-100">Accuracy Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(val) => [`${val}%`, "Accuracy"]} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#22C55E"
                strokeWidth={2.5}
                dot={{ fill: "#22C55E", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#22C55E", stroke: "#0F172A", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Track Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-100">Challenges by Track</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trackBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar dataKey="challenges" radius={[0, 6, 6, 0]}>
              {trackBreakdown.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
