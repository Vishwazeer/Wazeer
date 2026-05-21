"use client";

import dynamic from "next/dynamic";
import GameSetup from "@/components/GameSetup";
import MoveHistory from "@/components/MoveHistory";
import ChessClock from "@/components/ChessClock";
import EvalBar from "@/components/EvalBar";
import GameControls from "@/components/GameControls";

// Dynamic imports to avoid SSR issues with chess board and Stockfish
const Board = dynamic(() => import("@/components/Board"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square bg-[var(--color-surface)] rounded-xl animate-pulse" />
  ),
});

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Game Setup Modal */}
      <GameSetup />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)] bg-clip-text text-transparent">
              ChessMind
            </span>
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            AI Powered
          </span>
        </div>
      </header>

      {/* Main Game Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Left: Eval Bar + Board */}
          <div className="flex gap-3 items-stretch">
            <div className="hidden sm:block h-auto" style={{ minHeight: "400px" }}>
              <EvalBar />
            </div>

            <div className="flex flex-col">
              {/* Top clock */}
              <ChessClock />

              {/* Board */}
              <div className="w-[min(85vw,560px)]">
                <Board />
              </div>

              {/* Controls under board */}
              <div className="mt-4">
                <GameControls />
              </div>
            </div>
          </div>

          {/* Right: Move History Panel */}
          <div className="w-full lg:w-72 xl:w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden lg:h-[600px] h-[300px]">
            <MoveHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
