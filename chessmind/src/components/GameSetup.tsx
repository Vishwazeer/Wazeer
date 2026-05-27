"use client";

import { useState, useEffect } from "react";
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
  const setGameMode = useGameStore((s) => s.setGameMode);
  
  const startGame = useGameStore((s) => s.startGame);
  const createOnlineRoom = useGameStore((s) => s.createOnlineRoom);
  const joinOnlineRoom = useGameStore((s) => s.joinOnlineRoom);
  const onlineRoomCode = useGameStore((s) => s.onlineRoomCode);
  const onlineOpponentJoined = useGameStore((s) => s.onlineOpponentJoined);
  const syncOnlineState = useGameStore((s) => s.syncOnlineState);

  const hasSavedGame = useGameStore((s) => s.hasSavedGame);
  const checkSavedGame = useGameStore((s) => s.checkSavedGame);
  const resumeSavedGame = useGameStore((s) => s.resumeSavedGame);
  const deleteSavedGame = useGameStore((s) => s.deleteSavedGame);

  const [modeTab, setModeTab] = useState<"ai" | "local" | "online">("ai");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [onlineColorChoice, setOnlineColorChoice] = useState<"w" | "b" | "random">("random");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Map skill level to approximate ELO
  const eloEstimate = Math.round(800 + (aiLevel / 20) * 2400);

  // Lobby Polling: Wait for opponent to join
  useEffect(() => {
    if (!onlineRoomCode || onlineOpponentJoined || modeTab !== "online" || !lobbyCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${onlineRoomCode}`);
        if (res.ok) {
          const serverState = await res.json();
          if (serverState.whiteJoined && serverState.blackJoined) {
            syncOnlineState(serverState);
            useGameStore.setState({ showSetup: false }); // close setup modal and play!
          }
        }
      } catch (err) {
        console.error("Lobby polling error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onlineRoomCode, onlineOpponentJoined, modeTab, lobbyCode, syncOnlineState]);

  // Check for saved game on mount
  useEffect(() => {
    checkSavedGame();
  }, [checkSavedGame]);

  const handleStartLocalOrAI = () => {
    if (modeTab === "ai") {
      setGameMode("ai");
    } else {
      setGameMode("local");
    }
    startGame();
  };

  const handleCreateOnlineRoom = async () => {
    setLobbyLoading(true);
    setErrorText(null);
    try {
      const code = await createOnlineRoom(onlineColorChoice);
      setLobbyCode(code);
    } catch (err) {
      setErrorText("Failed to create room. Please try again.");
    } finally {
      setLobbyLoading(false);
    }
  };

  const handleJoinOnlineRoom = async () => {
    if (!joinCodeInput.trim()) return;
    setLobbyLoading(true);
    setErrorText(null);
    const success = await joinOnlineRoom(joinCodeInput.trim());
    setLobbyLoading(false);
    if (success) {
      useGameStore.setState({ showSetup: false }); // launch directly
    } else {
      setErrorText("Lobby not found or already full!");
    }
  };

  const handleCopyCode = () => {
    if (lobbyCode) {
      navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!showSetup) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface-2)]">
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase">
                ♟ ChessMind Lobby
              </h2>
              <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold mt-0.5">
                Configure your game settings
              </p>
            </div>
          </div>

          {/* Resume Saved Game option */}
          {hasSavedGame && (
            <div className="px-6 pt-4">
              <div className="bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-xs font-black text-white block">
                    💾 Saved Game Found!
                  </span>
                  <span className="text-[9px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
                    You have an ongoing match saved in this browser.
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    onClick={() => {
                      if (resumeSavedGame()) {
                        // Success!
                      }
                    }}
                    className="flex-1 sm:flex-initial py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)] text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-[var(--color-accent)]/25"
                  >
                    📂 Resume
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to discard your saved game?")) {
                        deleteSavedGame();
                      }
                    }}
                    className="py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase border border-[var(--color-red)]/35 text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition-all"
                  >
                    🗑️ Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="px-6 pt-4 flex bg-white/5 border-b border-[var(--color-border)] p-1">
            <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] w-full">
              {(["ai", "local", "online"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setModeTab(mode);
                    setErrorText(null);
                    setLobbyCode(null);
                  }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider
                    ${modeTab === mode
                      ? "bg-[var(--color-accent)] text-white shadow-md font-extrabold"
                      : "text-[var(--color-text-muted)] hover:text-white"
                    }
                  `}
                >
                  {mode === "ai" ? "🤖 vs AI" : mode === "local" ? "👥 Local" : "🌐 Online"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Conditional Form Rendering */}
            {modeTab !== "online" ? (
              <>
                {/* Play As (AI Mode only) */}
                {modeTab === "ai" && (
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-2.5">
                      Play As
                    </label>
                    <div className="flex gap-2">
                      {(["w", "b"] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => setPlayerColor(color)}
                          className={`
                            flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider
                            ${playerColor === color
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
                )}

                {/* AI Difficulty (AI Mode only) */}
                {modeTab === "ai" && (
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
                      AI Difficulty — ~{eloEstimate} ELO
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={aiLevel}
                      onChange={(e) => setAiLevel(Number(e.target.value))}
                      className="w-full accent-[var(--color-accent)] h-1 rounded-lg cursor-pointer bg-[var(--color-surface-2)]"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-text-dim)] font-semibold uppercase mt-1">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Master</span>
                    </div>
                  </div>
                )}

                {/* Time Control */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-2.5">
                    Time Control
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_CONTROLS.map((tc) => (
                      <button
                        key={tc.label}
                        onClick={() => setTimeControl(tc)}
                        className={`
                          py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition-all border
                          ${timeControl.label === tc.label
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

                {/* Start Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartLocalOrAI}
                    className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest
                               bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                               text-white shadow-lg shadow-[var(--color-accent)]/25
                               hover:shadow-[var(--color-accent)]/40
                               active:scale-[0.98] transition-all"
                  >
                    Start Game ♟
                  </button>
                </div>
              </>
            ) : (
              /* Online Mode Panel */
              <div className="space-y-5">
                {lobbyCode ? (
                  /* Waiting Lobby view */
                  <div className="text-center py-6 space-y-4 bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold">
                      Your Unique Room Code
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-black tracking-widest text-white select-all">
                        {lobbyCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all uppercase tracking-wider
                          ${copied
                            ? "bg-[var(--color-green)]/15 border-[var(--color-green)]/40 text-[var(--color-green)]"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-white"
                          }
                        `}
                      >
                        {copied ? "✓ Copied" : "📋 Copy"}
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2.5 pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-cyan)] animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-pink)] animate-bounce" />
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-dim)] animate-pulse tracking-widest">
                        Waiting for opponent to connect...
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Create / Join selector */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Room column */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Create Room
                        </h4>
                        <p className="text-[9px] text-[var(--color-text-dim)] leading-relaxed mt-1">
                          Generate a unique lobby code and invite your opponent.
                        </p>
                      </div>

                      {/* Room options */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <span className="block text-[9px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold mb-1">
                            Your Color Choice
                          </span>
                          <div className="flex gap-1">
                            {(["w", "b", "random"] as const).map((c) => (
                              <button
                                key={c}
                                onClick={() => setOnlineColorChoice(c)}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase transition-all border
                                  ${onlineColorChoice === c
                                    ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-light)]"
                                    : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                                  }
                                `}
                              >
                                {c === "w" ? "White" : c === "b" ? "Black" : "Rand"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[9px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold mb-1">
                            Time Control
                          </span>
                          <select
                            value={timeControl.label}
                            onChange={(e) => {
                              const found = TIME_CONTROLS.find(t => t.label === e.target.value);
                              if (found) setTimeControl(found);
                            }}
                            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[var(--color-accent)]/40 uppercase font-bold"
                          >
                            {TIME_CONTROLS.map(t => (
                              <option key={t.label} value={t.label}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateOnlineRoom}
                        disabled={lobbyLoading}
                        className="w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)] text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {lobbyLoading ? "Creating..." : "Create Room ⚡"}
                      </button>
                    </div>

                    {/* Join Room column */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Join Room
                        </h4>
                        <p className="text-[9px] text-[var(--color-text-dim)] leading-relaxed mt-1">
                          Enter a 6-digit room code to connect with your opponent.
                        </p>
                      </div>

                      <div className="pt-2">
                        <label className="block text-[9px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold mb-1.5">
                          Lobby Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 849201"
                          className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-center text-lg font-black tracking-widest text-white outline-none focus:border-[var(--color-accent)]/40"
                        />
                      </div>

                      <button
                        onClick={handleJoinOnlineRoom}
                        disabled={lobbyLoading || joinCodeInput.trim().length !== 6}
                        className="w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 hover:border-white/20 text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        {lobbyLoading ? "Connecting..." : "Join Match 👥"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Text */}
                {errorText && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold text-[var(--color-red)] text-center bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 p-2 rounded-lg"
                  >
                    ⚠️ {errorText}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
