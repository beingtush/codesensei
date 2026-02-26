"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Swords, Zap, BarChart3, BookOpen, History } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Swords },
  { href: "/tracks", label: "Tracks", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-amber-400" />
          <span className="text-lg font-bold tracking-tight">
            Code<span className="text-amber-400">Sensei</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-amber-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
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
