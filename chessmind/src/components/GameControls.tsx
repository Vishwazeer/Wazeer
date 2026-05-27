"use client";

import { useGameStore } from "@/store/gameStore";

export default function GameControls() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const result = useGameStore((s) => s.result);
  const flipBoard = useGameStore((s) => s.flipBoard);
  const resign = useGameStore((s) => s.resign);
  const resetGame = useGameStore((s) => s.resetGame);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const gameMode = useGameStore((s) => s.gameMode);
  const saveCurrentGame = useGameStore((s) => s.saveCurrentGame);

  return (
    <div className="flex flex-col gap-3">
      {/* Game over banner */}
      {isGameOver && (
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <div className="text-sm text-[var(--color-text-muted)] mb-1">
            Game Over
          </div>
          <div className="text-2xl font-bold text-[var(--color-accent-light)]">
            {result === "1-0"
              ? "White Wins"
              : result === "0-1"
              ? "Black Wins"
              : "Draw"}
          </div>
          <div className="text-xs text-[var(--color-text-dim)] mt-1">
            {result}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        <button
          onClick={resetGame}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-[var(--color-surface)] border border-[var(--color-border)] 
                     rounded-xl text-sm font-medium text-[var(--color-text-muted)]
                     hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]
                     hover:border-[var(--color-border-light)] transition-all"
        >
          <span>🔄</span>
          New Game
        </button>

        <button
          onClick={flipBoard}
          className="flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-[var(--color-surface)] border border-[var(--color-border)] 
                     rounded-xl text-sm font-medium text-[var(--color-text-muted)]
                     hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]
                     hover:border-[var(--color-border-light)] transition-all"
          title="Flip Board"
        >
          🔃
        </button>

        {!isGameOver && moveHistory.length > 0 && (
          <button
            onClick={resign}
            className="flex items-center justify-center gap-2 px-4 py-2.5 
                       bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 
                       rounded-xl text-sm font-medium text-[var(--color-red)]
                       hover:bg-[var(--color-red)]/20 hover:border-[var(--color-red)]/30
                       transition-all"
            title="Resign"
          >
            🏳️
          </button>
        )}
      </div>

      {!isGameOver && gameMode !== "online" && (
        <button
          onClick={() => {
            saveCurrentGame();
            alert("Game state saved successfully!");
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 
                     rounded-xl text-sm font-bold text-[var(--color-accent-light)]
                     hover:bg-[var(--color-accent)]/25 hover:border-[var(--color-accent)]/40
                     active:scale-[0.98] transition-all shadow-md"
        >
          💾 Save Game State
        </button>
      )}
    </div>
  );
}
