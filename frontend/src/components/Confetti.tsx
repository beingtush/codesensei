"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  active: boolean;
  /** Duration in ms before auto-cleanup */
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  size: number;
  rotation: number;
}

const COLORS = [
  "#FBBF24", // amber
  "#F97316", // orange
  "#22C55E", // green
  "#06B6D4", // cyan
  "#A855F7", // purple
  "#EC4899", // pink
  "#3B82F6", // blue
];

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: -20,
                rotate: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                y: "110vh",
                rotate: p.rotation + 720,
                opacity: [1, 1, 0.8, 0],
                scale: [1, 1.2, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random() * 1.5,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/** Streak milestone popup */
export function StreakMilestone({
  streak,
  visible,
  onClose,
}: {
  streak: number;
  visible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const milestoneText =
    streak >= 100
      ? "LEGENDARY"
      : streak >= 30
        ? "UNSTOPPABLE"
        : streak >= 14
          ? "ON FIRE"
          : streak >= 7
            ? "COMMITTED"
            : streak >= 3
              ? "BUILDING MOMENTUM"
              : "";

  if (!milestoneText) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 px-8 py-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center">
            <div className="text-3xl">🔥</div>
            <div className="mt-1 text-lg font-bold text-orange-400">
              {streak} Day Streak!
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-400/70">
              {milestoneText}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Level up animation */
export function LevelUpPopup({
  level,
  visible,
  onClose,
}: {
  level: number;
  visible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="fixed top-1/3 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="rounded-3xl border border-amber-500/30 bg-slate-900/95 px-12 py-8 text-center shadow-2xl backdrop-blur-xl">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl"
            >
              ⬆️
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-sm font-semibold uppercase tracking-widest text-amber-400/70"
            >
              Level Up!
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              className="mt-1 text-4xl font-black text-amber-400"
            >
              Level {level}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
