"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  /** Whether the timer is running */
  running: boolean;
  /** Callback with elapsed seconds whenever the timer updates */
  onTick?: (seconds: number) => void;
}

export default function Timer({ running, onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, onTick]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-400">
      <Clock className="h-4 w-4" />
      <span className="font-mono tabular-nums">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
