"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import GameSetup from "@/components/GameSetup";
import MoveHistory from "@/components/MoveHistory";
import ChessClock from "@/components/ChessClock";
import EvalBar from "@/components/EvalBar";
import GameControls from "@/components/GameControls";
import AICoach from "@/components/AICoach";
import PostGameReport from "@/components/PostGameReport";
import GameHistory from "@/components/GameHistory";
import AuthModal from "@/components/AuthModal";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";

// Dynamic imports to avoid SSR issues with chess board and Stockfish
const Board = dynamic(() => import("@/components/Board"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square bg-[var(--color-surface)] rounded-xl animate-pulse" />
  ),
});

export default function PlayPage() {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const [rightTab, setRightTab] = useState<"game" | "history">("game");

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Game Setup Modal */}
      <GameSetup />

      {/* Auth Modal */}
      <AuthModal />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)] bg-clip-text text-transparent">
              Wazeer
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            AI Powered
          </span>

          {/* Auth status */}
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-5 h-5 rounded-full" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-accent)]/30 flex items-center justify-center text-[9px] font-bold text-[var(--color-accent-light)]">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] max-w-[80px] truncate">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="text-[10px] font-bold text-[var(--color-text-dim)] hover:text-[var(--color-red)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--color-red)]/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="px-4 py-1.5 text-xs font-bold rounded-xl
                           bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30
                           text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/25 transition-all"
              >
                Sign In
              </button>
            )
          )}
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

          {/* Right Panel: Tabs for Active Game vs Saved History */}
          <div className="flex flex-col gap-4 w-full lg:w-72 xl:w-80 shrink-0">
            {/* Tab selection pills */}
            <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] w-full shrink-0">
              <button
                onClick={() => setRightTab("game")}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider
                  ${rightTab === "game"
                    ? "bg-[var(--color-accent)] text-white shadow-md"
                    : "text-[var(--color-text-muted)] hover:text-white"
                  }
                `}
              >
                🎮 Active Match
              </button>
              <button
                onClick={() => setRightTab("history")}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider
                  ${rightTab === "history"
                    ? "bg-[var(--color-accent)] text-white shadow-md"
                    : "text-[var(--color-text-muted)] hover:text-white"
                  }
                `}
              >
                📊 Saved Matches
              </button>
            </div>

            {/* Sidebar content based on selected tab */}
            {rightTab === "game" ? (
              <div className="flex flex-col gap-4">
                {/* AI Coach Card */}
                <AICoach />

                {/* Move History / Post-Game Report */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden lg:h-[420px] h-[300px]">
                  {isGameOver ? <PostGameReport /> : <MoveHistory />}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden lg:h-[580px] h-[400px]">
                <GameHistory />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
