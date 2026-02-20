"use client";

import { Flame, Swords, Zap } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-amber-400" />
          <span className="text-lg font-bold tracking-tight">
            Code<span className="text-amber-400">Sensei</span>
          </span>
        </div>

        {/* Right side: streak + XP */}
        <div className="flex items-center gap-6">
          {/* Streak */}
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-orange-400 fire-glow" />
            <span className="text-sm font-semibold text-orange-400">0</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">0 XP</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
