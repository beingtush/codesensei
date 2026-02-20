"use client";

import { TRACKS, type TrackSlug } from "@/lib/constants";

interface TrackBadgeProps {
  slug: string;
  size?: "sm" | "md";
}

export default function TrackBadge({ slug, size = "sm" }: TrackBadgeProps) {
  const track = TRACKS[slug as TrackSlug];
  if (!track) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
        📘 {slug}
      </span>
    );
  }

  const sizeClasses = size === "md"
    ? "px-3 py-1 text-sm gap-1.5"
    : "px-2 py-0.5 text-xs gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${track.badge}`}
    >
      {track.icon} {track.name}
    </span>
  );
}
