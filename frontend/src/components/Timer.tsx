"use client";

import { Clock } from "lucide-react";

interface TimerProps {
  formattedTime: string;
  isRunning: boolean;
}

export default function Timer({ formattedTime, isRunning }: TimerProps) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Clock className={`h-4 w-4 ${isRunning ? "text-amber-400" : "text-slate-500"}`} />
      <span className="font-mono text-sm tabular-nums">{formattedTime}</span>
    </div>
  );
}
