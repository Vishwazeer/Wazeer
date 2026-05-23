"use client";

import { useState, useEffect } from "react";
import { useGameStore, MoveClassification } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

// Helper to resolve coach expressions and styles based on move classification
const getCoachExpression = (classification: MoveClassification): { emoji: string; title: string; color: string; bg: string } => {
  switch (classification) {
    case "brilliant":
      return { emoji: "💎", title: "Brilliant ✦", color: "#22d3ee", bg: "rgba(34, 211, 238, 0.15)" };
    case "great":
      return { emoji: "🧐", title: "Great Move !", color: "#4ade80", bg: "rgba(74, 222, 128, 0.15)" };
    case "good":
      return { emoji: "👨‍🏫", title: "Good Move ✓", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" };
    case "inaccuracy":
      return { emoji: "🤨", title: "Inaccuracy ?!", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)" };
    case "mistake":
      return { emoji: "🫣", title: "Mistake ?", color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)" };
    case "blunder":
      return { emoji: "🤦‍♂️", title: "Blunder ??", color: "#f87171", bg: "rgba(248, 113, 113, 0.15)" };
    default:
      return { emoji: "♟️", title: "Normal Move", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" };
  }
};

export default function AICoach() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const activeIndex = useGameStore((s) => s.activeExplanationMoveIndex);
  const geminiApiKey = useGameStore((s) => s.geminiApiKey);
  const setGeminiApiKey = useGameStore((s) => s.setGeminiApiKey);
  const coachLoading = useGameStore((s) => s.coachLoading);
  const generateCoachExplanationForIndex = useGameStore((s) => s.generateCoachExplanationForIndex);
  const playerColor = useGameStore((s) => s.playerColor);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  // Safely fetch key in useEffect to avoid hydration mismatches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("chessmind_gemini_key");
      if (storedKey) {
        setGeminiApiKey(storedKey);
        setApiKeyInput(storedKey);
      }
    }
  }, [setGeminiApiKey]);

  // Find the latest move played by the human player
  const getLatestHumanMoveIndex = () => {
    for (let i = moveHistory.length - 1; i >= 0; i--) {
      const isWhite = i % 2 === 0;
      const moveColor = isWhite ? "w" : "b";
      if (moveColor === playerColor) {
        return i;
      }
    }
    return -1;
  };

  const latestHumanIndex = getLatestHumanMoveIndex();

  // Determine which move we are currently showing in the coach panel
  const targetIndex = activeIndex !== null ? activeIndex : latestHumanIndex;
  const targetMove = moveHistory[targetIndex];
  const classification = targetMove ? targetMove.classification : null;
  const explanation = targetMove ? targetMove.coachExplanation : null;

  const coach = getCoachExpression(classification);

  // Auto-expand/collapse dropdown based on blunder/mistake classification changes
  useEffect(() => {
    if (classification === "mistake" || classification === "blunder") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [targetIndex, classification]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim() || null);
    setShowSettings(false);
  };

  const handleClearKey = () => {
    setApiKeyInput("");
    setGeminiApiKey(null);
  };

  const triggerReveal = async () => {
    if (targetIndex >= 0) {
      await generateCoachExplanationForIndex(targetIndex);
      setIsExpanded(true);
    }
  };

  // Build the move label (e.g. Move 12. Nf3)
  const getMoveLabel = () => {
    if (!targetMove) return "Chess Coach";
    const moveNumber = Math.floor(targetIndex / 2) + 1;
    const isWhite = targetIndex % 2 === 0;
    const prefix = isWhite ? `${moveNumber}.` : `${moveNumber}...`;
    return `Move ${prefix} ${targetMove.move.san}`;
  };

  // Format explanation text into list bullets
  const bullets = explanation
    ? explanation
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
        .map((b) => b.replace(/^[•\-\*\s]+/, "")) // Clean up any pre-existing bullets
    : [];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Dynamic Glow Effect */}
      {targetMove && (
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full filter blur-[40px] opacity-10 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: coach.color }}
        />
      )}

      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            key={coach.emoji}
            initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
          >
            {coach.emoji}
          </motion.div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight leading-tight">
              {getMoveLabel()}
            </h4>
            <p className="text-[9px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold mt-0.5">
              {geminiApiKey ? "Gemini Coach" : "Local Coach"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 px-2.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider
            ${showSettings
              ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-light)]"
              : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)]"
            }
          `}
        >
          ⚙️ Key
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showSettings ? (
          <motion.form
            key="settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSaveKey}
            className="space-y-3 overflow-hidden text-xs pb-1"
          >
            <div>
              <label className="block text-[var(--color-text-muted)] font-medium mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]/60 text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-lg font-bold text-xs bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)] text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Save
              </button>
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-red)]/35 text-[var(--color-red)] font-medium hover:bg-[var(--color-red)]/10 text-xs transition-all"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[10px] text-[var(--color-text-dim)] leading-relaxed">
              Saved locally in your browser. API calls only trigger during Mistakes/Blunders or when revealed.
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="coach-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {!targetMove ? (
              <div className="text-[var(--color-text-dim)] text-xs text-center py-6">
                Play a move to receive your first AI Coach insight
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Classification Badge / Controls */}
                <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 font-mono uppercase tracking-wider"
                      style={{ color: coach.color, backgroundColor: coach.bg }}
                    >
                      {coach.title}
                    </span>
                  </div>

                  {/* On-Demand Controls */}
                  {coachLoading ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pink)] animate-bounce" />
                    </div>
                  ) : explanation ? (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[10px] font-bold text-[var(--color-text-muted)] hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      {isExpanded ? "▲ Hide" : "▼ Review"}
                    </button>
                  ) : (
                    <button
                      onClick={triggerReveal}
                      className="text-[10px] font-black text-[var(--color-accent-light)] hover:text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      💡 Reveal Coach
                    </button>
                  )}
                </div>

                {/* Dropdown content */}
                <AnimatePresence initial={false}>
                  {isExpanded && explanation && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 pr-2.5">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                          <h5 className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold">
                            {showBrief ? "⚡ Quick Summary" : "📊 Coach Insights"}
                          </h5>
                        </div>

                        {showBrief ? (
                          <p className="text-xs text-[var(--color-text)] leading-relaxed italic font-medium">
                            &ldquo;{targetMove.coachSummary || "Makes a solid developmental play."}&rdquo;
                          </p>
                        ) : (
                          bullets.length > 0 ? (
                            <ul className="space-y-1.5">
                              {bullets.map((bullet, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                                  <span className="text-xs shrink-0 select-none leading-none mt-0.5" style={{ color: coach.color }}>
                                    •
                                  </span>
                                  <span className="leading-tight font-medium">
                                    {bullet}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-[var(--color-text)] leading-relaxed italic">
                              &ldquo;{explanation}&rdquo;
                            </p>
                          )
                        )}

                        {/* Toggle Wording Button */}
                        <div className="mt-3 pt-1.5 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => setShowBrief(!showBrief)}
                            className="text-[9px] font-bold text-[var(--color-accent-light)] hover:text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            {showBrief ? "📊 Show Details" : "⚡ Make it brief"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
