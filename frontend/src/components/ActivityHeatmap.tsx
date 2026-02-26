"use client";

import { motion } from "framer-motion";

interface ActivityHeatmapProps {
  /** Array of { date: string (YYYY-MM-DD), count: number } */
  data: { date: string; count: number }[];
  /** Number of weeks to display */
  weeks?: number;
}

const LEVELS = [
  { min: 0, max: 0, color: "#1E293B" },
  { min: 1, max: 2, color: "#164E36" },
  { min: 3, max: 4, color: "#166534" },
  { min: 5, max: 7, color: "#22C55E" },
  { min: 8, max: Infinity, color: "#4ADE80" },
];

function getColor(count: number): string {
  for (const level of LEVELS) {
    if (count >= level.min && count <= level.max) return level.color;
  }
  return LEVELS[LEVELS.length - 1].color;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  // Build a map from date string to count
  const countMap = new Map<string, number>();
  for (const d of data) {
    countMap.set(d.date, d.count);
  }

  // Generate grid: weeks × 7 days
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);
  // Align to start of week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const grid: { date: string; count: number; dayOfWeek: number }[][] = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const week: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split("T")[0];
      week.push({
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
        dayOfWeek: d,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-3 w-6 items-center text-[9px] text-slate-500"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: wi * 0.02 }}
                  title={`${day.date}: ${day.count} challenge${day.count !== 1 ? "s" : ""}`}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        <span>Less</span>
        {LEVELS.map((level, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: level.color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
