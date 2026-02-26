"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  Zap,
  TrendingUp,
  AlertTriangle,
  Star,
} from "lucide-react";
import {
  getTracks,
  getTrackProgress,
} from "@/lib/api";
import type {
  TrackWithUserProgress,
  TrackDetailProgress,
} from "@/lib/api";
import { TRACKS, type TrackSlug, difficultyStars } from "@/lib/constants";
import TopicStrength from "@/components/TopicStrength";

// Demo data
const DEMO_TRACKS: TrackWithUserProgress[] = [
  { id: 1, name: "Python Advanced", slug: "python-advanced", description: "Master advanced Python concepts: decorators, generators, async, metaclasses and more.", icon: "🐍", color_hex: "#22C55E", progress: { level: 4, xp: 820, challenges_completed: 18, challenges_correct: 15, accuracy: 83.3 } },
  { id: 2, name: "Java Deep Dive", slug: "java-deep-dive", description: "Deep dive into Java: concurrency, JVM internals, design patterns, and enterprise features.", icon: "☕", color_hex: "#F97316", progress: { level: 3, xp: 540, challenges_completed: 12, challenges_correct: 10, accuracy: 83.3 } },
  { id: 3, name: "Automation & Testing", slug: "automation-testing", description: "Automation frameworks, CI/CD, Selenium, API testing, and DevOps practices.", icon: "🤖", color_hex: "#A855F7", progress: { level: 2, xp: 210, challenges_completed: 7, challenges_correct: 6, accuracy: 85.7 } },
  { id: 4, name: "DSA & Problem Solving", slug: "dsa-problem-solving", description: "Data structures, algorithms, and competitive programming patterns.", icon: "🧮", color_hex: "#06B6D4", progress: { level: 3, xp: 480, challenges_completed: 10, challenges_correct: 7, accuracy: 70.0 } },
];

export default function TracksPage() {
  const [tracks, setTracks] = useState<TrackWithUserProgress[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [trackDetail, setTrackDetail] = useState<TrackDetailProgress | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTracks();
        setTracks(data.length > 0 ? data : DEMO_TRACKS);
      } catch {
        setTracks(DEMO_TRACKS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleExpand(slug: string) {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      setTrackDetail(null);
      return;
    }
    setExpandedSlug(slug);
    setDetailLoading(true);
    try {
      const detail = await getTrackProgress(slug);
      setTrackDetail(detail);
    } catch {
      // Build a fallback from the track list data
      const t = tracks.find((tr) => tr.slug === slug);
      setTrackDetail({
        track: slug,
        name: t?.name ?? slug,
        icon: t?.icon ?? "📘",
        level: t?.progress?.level ?? 1,
        xp: t?.progress?.xp ?? 0,
        level_progress: { level: t?.progress?.level ?? 1, current_xp: t?.progress?.xp ?? 0, xp_in_level: 0, xp_for_next_level: 300, xp_remaining: 300, is_max_level: false },
        challenges_completed: t?.progress?.challenges_completed ?? 0,
        challenges_correct: t?.progress?.challenges_correct ?? 0,
        accuracy: t?.progress?.accuracy ?? 0,
        weak_topics: ["Error handling", "Async patterns"],
        recommended_difficulty: 3,
      });
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-100">Learning Tracks</h1>
        <p className="mt-1 text-sm text-slate-400">Choose a track to practice and level up your skills</p>
      </motion.div>

      {/* Track Cards */}
      <div className="space-y-4">
        {tracks.map((track, i) => {
          const td = TRACKS[track.slug as TrackSlug];
          const color = td?.color ?? track.color_hex;
          const isExpanded = expandedSlug === track.slug;
          const progress = track.progress;
          const xpPct = progress
            ? Math.min((progress.xp % 300) / 300 * 100, 100)
            : 0;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Card */}
              <button
                onClick={() => handleExpand(track.slug)}
                className={`group w-full rounded-2xl border text-left transition-all ${
                  isExpanded
                    ? "border-slate-600 bg-slate-900/80"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70"
                }`}
              >
                <div className="flex items-center gap-4 p-5">
                  {/* Icon */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: color + "20" }}
                  >
                    {track.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-100">{track.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-400 line-clamp-1">{track.description}</p>

                    {/* Progress bar */}
                    {progress && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${xpPct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          Lv.{progress.level}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden items-center gap-4 sm:flex">
                    {progress && (
                      <>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-100">{progress.challenges_completed}</p>
                          <p className="text-[10px] text-slate-500">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold" style={{ color }}>{progress.accuracy}%</p>
                          <p className="text-[10px] text-slate-500">Accuracy</p>
                        </div>
                      </>
                    )}
                    {!progress && (
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">New</span>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className={`h-5 w-5 text-slate-600 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-b-2xl border border-t-0 border-slate-700 bg-slate-900/60 p-5">
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                        </div>
                      ) : trackDetail ? (
                        <div className="space-y-5">
                          {/* Stats row */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                              <Zap className="mx-auto mb-1 h-4 w-4 text-amber-400" />
                              <p className="text-lg font-bold text-slate-100">{trackDetail.xp}</p>
                              <p className="text-[10px] text-slate-500">Total XP</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-blue-400" />
                              <p className="text-lg font-bold text-slate-100">Lv.{trackDetail.level}</p>
                              <p className="text-[10px] text-slate-500">Level</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                              <BookOpen className="mx-auto mb-1 h-4 w-4 text-green-400" />
                              <p className="text-lg font-bold text-slate-100">{trackDetail.challenges_completed}</p>
                              <p className="text-[10px] text-slate-500">Completed</p>
                            </div>
                            <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                              <Star className="mx-auto mb-1 h-4 w-4 text-cyan-400" />
                              <p className="text-lg font-bold text-slate-100">{trackDetail.accuracy}%</p>
                              <p className="text-[10px] text-slate-500">Accuracy</p>
                            </div>
                          </div>

                          {/* Level progress bar */}
                          <div>
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                              <span>Level {trackDetail.level_progress.level} Progress</span>
                              <span>
                                {trackDetail.level_progress.xp_in_level} / {trackDetail.level_progress.xp_for_next_level ?? "MAX"} XP
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: trackDetail.level_progress.xp_for_next_level
                                    ? `${(trackDetail.level_progress.xp_in_level / trackDetail.level_progress.xp_for_next_level) * 100}%`
                                    : "100%",
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>

                          {/* Weak topics */}
                          {trackDetail.weak_topics.length > 0 && (
                            <div>
                              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                Weak Areas
                              </div>
                              <TopicStrength
                                topics={trackDetail.weak_topics.map((t, idx) => ({
                                  name: t,
                                  strength: Math.max(15, 50 - idx * 10),
                                }))}
                                color={color}
                              />
                            </div>
                          )}

                          {/* Recommended difficulty */}
                          <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-3">
                            <span className="text-sm text-slate-400">Recommended Difficulty</span>
                            <span className="text-sm text-amber-400">
                              {difficultyStars(trackDetail.recommended_difficulty)}
                            </span>
                          </div>

                          {/* CTA */}
                          <Link
                            href={`/?track=${track.slug}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:shadow-lg hover:shadow-amber-500/20"
                          >
                            Practice Now
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
