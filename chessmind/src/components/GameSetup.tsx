"use client";

import { useGameStore, TIME_CONTROLS } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

export default function GameSetup() {
  const showSetup = useGameStore((s) => s.showSetup);
  const aiLevel = useGameStore((s) => s.aiLevel);
  const timeControl = useGameStore((s) => s.timeControl);
  const playerColor = useGameStore((s) => s.playerColor);
  const setAiLevel = useGameStore((s) => s.setAiLevel);
  const setTimeControl = useGameStore((s) => s.setTimeControl);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const startGame = useGameStore((s) => s.startGame);

  // Map skill level to approximate ELO
  const eloEstimate = Math.round(800 + (aiLevel / 20) * 2400);

  if (!showSetup) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[var(--color-border)]">
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)] bg-clip-text text-transparent">
                New Game
              </span>
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Configure your game settings
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Play As */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-widest mb-3">
                Play As
              </label>
              <div className="flex gap-2">
                {(["w", "b"] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setPlayerColor(color)}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border
                      ${
                        playerColor === color
                          ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-light)]"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]"
                      }
                    `}
                  >
                    {color === "w" ? "♔ White" : "♚ Black"}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-widest mb-3">
                AI Difficulty — ~{eloEstimate} ELO
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={aiLevel}
                onChange={(e) => setAiLevel(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-dim)] mt-1">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Master</span>
              </div>
            </div>

            {/* Time Control */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-widest mb-3">
                Time Control
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_CONTROLS.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => setTimeControl(tc)}
                    className={`
                      py-2.5 px-2 rounded-lg text-xs font-medium transition-all border
                      ${
                        timeControl.label === tc.label
                          ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-light)]"
                          : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]"
                      }
                    `}
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start button */}
          <div className="p-6 pt-2">
            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-xl text-sm font-bold
                         bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                         text-white shadow-lg shadow-[var(--color-accent)]/25
                         hover:shadow-[var(--color-accent)]/40
                         active:scale-[0.98] transition-all"
            >
              Start Game ♟
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
