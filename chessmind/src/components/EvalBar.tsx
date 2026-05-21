"use client";

import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";

export default function EvalBar() {
  const currentEval = useGameStore((s) => s.currentEval);
  const isGameOver = useGameStore((s) => s.isGameOver);

  // Convert centipawn eval to a percentage for the bar
  // Clamp between -1000 and 1000 cp, map to 0-100%
  const clampedEval = Math.max(-1000, Math.min(1000, currentEval));
  const whitePercent = 50 + (clampedEval / 1000) * 50;

  // Format eval display
  const formatEval = (cp: number): string => {
    if (Math.abs(cp) > 900) return cp > 0 ? "+∞" : "-∞";
    const pawns = (cp / 100).toFixed(1);
    return cp >= 0 ? `+${pawns}` : pawns;
  };

  return (
    <div className="w-7 h-full rounded-lg overflow-hidden bg-[#333] relative flex-shrink-0 border border-[var(--color-border)]">
      {/* White portion (from bottom) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-[#e8e8ed]"
        animate={{ height: `${whitePercent}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      />

      {/* Eval number */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <span
          className="text-[9px] font-mono font-bold px-0.5 py-px rounded"
          style={{
            color: currentEval >= 0 ? "#333" : "#e8e8ed",
            textShadow:
              currentEval >= 0
                ? "0 0 4px rgba(255,255,255,0.5)"
                : "0 0 4px rgba(0,0,0,0.5)",
          }}
        >
          {isGameOver ? "—" : formatEval(currentEval)}
        </span>
      </div>
    </div>
  );
}
