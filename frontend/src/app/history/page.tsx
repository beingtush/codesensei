"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Filter,
  RotateCcw,
  Clock,
} from "lucide-react";
import { getChallengeHistory } from "@/lib/api";
import type { HistoryItem } from "@/lib/api";
import { CHALLENGE_TYPES, type ChallengeType } from "@/lib/constants";

// Demo data
const DEMO_HISTORY: HistoryItem[] = [
  { id: 1, challenge_id: 1, challenge_title: "Implement a Retry Decorator", challenge_type: "code", track_name: "Python Advanced", track_icon: "🐍", is_correct: true, xp_earned: 45, completed_at: "2026-02-20T14:30:00Z" },
  { id: 2, challenge_id: 2, challenge_title: "GIL Deep Dive", challenge_type: "quiz", track_name: "Python Advanced", track_icon: "🐍", is_correct: true, xp_earned: 30, completed_at: "2026-02-20T13:15:00Z" },
  { id: 3, challenge_id: 3, challenge_title: "Memory Leak Bug", challenge_type: "bughunt", track_name: "Python Advanced", track_icon: "🐍", is_correct: false, xp_earned: 10, completed_at: "2026-02-19T18:00:00Z" },
  { id: 4, challenge_id: 4, challenge_title: "LRU Cache Implementation", challenge_type: "code", track_name: "Java Deep Dive", track_icon: "☕", is_correct: true, xp_earned: 50, completed_at: "2026-02-19T15:30:00Z" },
  { id: 5, challenge_id: 5, challenge_title: "Volatile vs Synchronized", challenge_type: "quiz", track_name: "Java Deep Dive", track_icon: "☕", is_correct: true, xp_earned: 25, completed_at: "2026-02-18T10:00:00Z" },
  { id: 6, challenge_id: 6, challenge_title: "Page Object Model", challenge_type: "code", track_name: "Automation & Testing", track_icon: "🤖", is_correct: true, xp_earned: 40, completed_at: "2026-02-18T09:00:00Z" },
  { id: 7, challenge_id: 7, challenge_title: "Kth Largest Element", challenge_type: "code", track_name: "DSA & Problem Solving", track_icon: "🧮", is_correct: false, xp_earned: 15, completed_at: "2026-02-17T16:45:00Z" },
  { id: 8, challenge_id: 8, challenge_title: "Valid Parentheses", challenge_type: "code", track_name: "DSA & Problem Solving", track_icon: "🧮", is_correct: true, xp_earned: 35, completed_at: "2026-02-17T14:20:00Z" },
  { id: 9, challenge_id: 9, challenge_title: "Binary Search Bug", challenge_type: "bughunt", track_name: "DSA & Problem Solving", track_icon: "🧮", is_correct: true, xp_earned: 40, completed_at: "2026-02-16T11:00:00Z" },
  { id: 10, challenge_id: 10, challenge_title: "Wait Strategies in Selenium", challenge_type: "quiz", track_name: "Automation & Testing", track_icon: "🤖", is_correct: true, xp_earned: 25, completed_at: "2026-02-16T09:30:00Z" },
];

type FilterResult = "all" | "correct" | "incorrect";
type FilterType = "all" | ChallengeType;

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterResult, setFilterResult] = useState<FilterResult>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const pageSize = 10;

  const loadData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await getChallengeHistory(p, pageSize);
      setItems(data.challenges.length > 0 ? data.challenges : DEMO_HISTORY);
      setTotalCount(data.total_count || DEMO_HISTORY.length);
    } catch {
      setItems(DEMO_HISTORY);
      setTotalCount(DEMO_HISTORY.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  // Filtered items
  const filtered = items.filter((item) => {
    if (filterResult === "correct" && !item.is_correct) return false;
    if (filterResult === "incorrect" && item.is_correct) return false;
    if (filterType !== "all" && item.challenge_type !== filterType) return false;
    return true;
  });

  // Group by date
  const grouped = new Map<string, HistoryItem[]>();
  for (const item of filtered) {
    const dateStr = new Date(item.completed_at).toLocaleDateString("en", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!grouped.has(dateStr)) grouped.set(dateStr, []);
    grouped.get(dateStr)!.push(item);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  function formatTime(isoStr: string) {
    return new Date(isoStr).toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100">History</h1>
          <p className="mt-1 text-sm text-slate-400">
            {totalCount} challenge{totalCount !== 1 ? "s" : ""} completed
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            showFilters
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              {/* Result filter */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Result</p>
                <div className="flex gap-1.5">
                  {(["all", "correct", "incorrect"] as FilterResult[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFilterResult(v)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        filterResult === v
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {v === "all" ? "All" : v === "correct" ? "Correct" : "Incorrect"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Type</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      filterType === "all"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    All
                  </button>
                  {(Object.entries(CHALLENGE_TYPES) as [ChallengeType, { icon: string; label: string }][]).map(
                    ([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setFilterType(key)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          filterType === key
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {val.icon} {val.label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-16 text-center">
          <p className="text-slate-500">No challenges match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateStr, dayItems]) => (
            <div key={dateStr}>
              {/* Date header */}
              <h3 className="mb-3 text-sm font-semibold text-slate-500">{dateStr}</h3>

              <div className="space-y-2">
                {dayItems.map((item, i) => {
                  const typeData = CHALLENGE_TYPES[item.challenge_type as ChallengeType] ?? {
                    icon: "📝",
                    label: item.challenge_type,
                  };
                  const isExpanded = expandedId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="group w-full rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition-all hover:border-slate-700 hover:bg-slate-900/80"
                      >
                        <div className="flex items-center gap-3">
                          {/* Result icon */}
                          {item.is_correct ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                          )}

                          {/* Track icon */}
                          <span className="text-lg">{item.track_icon}</span>

                          {/* Title + meta */}
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium text-slate-200">
                              {item.challenge_title}
                            </h4>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                              <span>{typeData.icon} {typeData.label}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(item.completed_at)}
                              </span>
                            </div>
                          </div>

                          {/* XP */}
                          <span className="shrink-0 text-sm font-semibold text-amber-400">
                            +{item.xp_earned} XP
                          </span>

                          {/* Expand icon */}
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-3 rounded-b-xl border border-t-0 border-slate-800 bg-slate-900/30 px-4 py-3">
                              <span className="text-xs text-slate-500">
                                {item.track_name} &middot; {item.is_correct ? "Passed" : "Failed"}
                              </span>
                              <div className="flex-1" />
                              <Link
                                href={`/challenge/${item.challenge_id}`}
                                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Retry
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
