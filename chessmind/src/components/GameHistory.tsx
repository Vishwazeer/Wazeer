"use client";

import { useEffect, useState } from "react";
import { useGameStore, MoveClassification } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

const classificationIcons: Record<string, { icon: string; color: string; label: string }> = {
  brilliant: { icon: "✦", color: "var(--color-cyan)", label: "Brilliant" },
  great: { icon: "!", color: "var(--color-green)", label: "Great" },
  good: { icon: "✓", color: "var(--color-blue)", label: "Good" },
  inaccuracy: { icon: "?!", color: "var(--color-amber)", label: "Inaccuracy" },
  mistake: { icon: "?", color: "#fb923c", label: "Mistake" },
  blunder: { icon: "??", color: "var(--color-red)", label: "Blunder" },
};

export default function GameHistory() {
  const gameHistory = useGameStore((s) => s.gameHistory);
  const loadGameHistory = useGameStore((s) => s.loadGameHistory);
  const clearGameHistory = useGameStore((s) => s.clearGameHistory);
  const selectedGame = useGameStore((s) => s.selectedHistoryGame);
  const setSelectedGame = useGameStore((s) => s.setSelectedHistoryGame);

  const [activeReviewMoveIdx, setActiveReviewMoveIdx] = useState<number | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadGameHistory();
  }, [loadGameHistory]);

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your game history?")) {
      clearGameHistory();
    }
  };

  const getResultBadgeColor = (result: string) => {
    if (result.startsWith("1-0")) return "var(--color-accent-light)";
    if (result.startsWith("0-1")) return "var(--color-cyan)";
    return "var(--color-text-muted)";
  };

  // If in review mode, show the selected game review dashboard!
  if (selectedGame) {
    // Group moves into pairs
    const movePairs: Array<{
      number: number;
      whiteIndex: number;
      white: any;
      blackIndex?: number;
      black?: any;
    }> = [];

    const moves = selectedGame.moves || [];
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push({
        number: Math.floor(i / 2) + 1,
        whiteIndex: i,
        white: moves[i],
        blackIndex: i + 1,
        black: moves[i + 1],
      });
    }

    const reviewedMove = activeReviewMoveIdx !== null ? moves[activeReviewMoveIdx] : null;
    const reviewedClassInfo = reviewedMove?.classification ? classificationIcons[reviewedMove.classification] : null;

    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedGame(null);
              setActiveReviewMoveIdx(null);
            }}
            className="text-xs font-bold text-[var(--color-text-muted)] hover:text-white flex items-center gap-1 transition-all"
          >
            ← Back to List
          </button>
          <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold">
            Reviewing Match
          </span>
        </div>

        {/* Game Info Summary */}
        <div className="p-4 border-b border-[var(--color-border)] space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-extrabold text-white leading-tight">
                {selectedGame.timeControl}
              </div>
              <div className="text-[10px] text-[var(--color-text-dim)] font-mono mt-0.5">
                {selectedGame.date}
              </div>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10"
              style={{ color: getResultBadgeColor(selectedGame.result) }}
            >
              {selectedGame.result === "1-0" ? "♔ White Won" : selectedGame.result === "0-1" ? "♚ Black Won" : "½-½ Draw"}
            </span>
          </div>

          {/* Accuracies */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-[var(--color-text-dim)] font-semibold uppercase tracking-wider block">White Acc</span>
              <span className="text-base font-black text-white">{selectedGame.whiteAccuracy}%</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              <span className="text-[9px] text-[var(--color-text-dim)] font-semibold uppercase tracking-wider block">Black Acc</span>
              <span className="text-base font-black text-white">{selectedGame.blackAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Moves & Review list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <h5 className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold mb-2">
              Moves List (Click to review coaching)
            </h5>
            {movePairs.length === 0 ? (
              <div className="text-xs text-[var(--color-text-dim)] italic">No moves recorded.</div>
            ) : (
              <div className="grid grid-cols-1 gap-1 font-mono text-sm max-h-[160px] overflow-y-auto p-1.5 bg-black/20 rounded-xl border border-[var(--color-border)]">
                {movePairs.map((pair) => {
                  const isWhiteHuman = selectedGame.playerColor === "w" || selectedGame.gameMode === "local";
                  const isBlackHuman = selectedGame.playerColor === "b" || selectedGame.gameMode === "local";

                  return (
                    <div key={pair.number} className="flex items-center gap-2 py-0.5">
                      <span className="w-8 text-right text-[var(--color-text-dim)] text-xs pr-1 shrink-0 font-bold">
                        {pair.number}.
                      </span>

                      {/* White Move */}
                      {isWhiteHuman ? (
                        <button
                          onClick={() => setActiveReviewMoveIdx(pair.whiteIndex)}
                          className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-all
                            ${activeReviewMoveIdx === pair.whiteIndex 
                              ? "bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-white font-bold" 
                              : "hover:bg-white/5 text-[var(--color-text)] border border-transparent"
                            }
                          `}
                        >
                          <span>{pair.white.san}</span>
                          {pair.white.classification && classificationIcons[pair.white.classification] && (
                            <span className="text-[10px] font-bold" style={{ color: classificationIcons[pair.white.classification].color }}>
                              {classificationIcons[pair.white.classification].icon}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-[var(--color-text-dim)]/60" title={pair.white.classification ?? undefined}>
                          <span>{pair.white.san}</span>
                          {pair.white.classification && classificationIcons[pair.white.classification] && (
                            <span className="text-[10px] font-bold" style={{ color: classificationIcons[pair.white.classification].color }}>
                              {classificationIcons[pair.white.classification].icon}
                            </span>
                          )}
                        </span>
                      )}

                      {/* Black Move */}
                      {pair.blackIndex !== undefined && pair.black && (
                        isBlackHuman ? (
                          <button
                            onClick={() => setActiveReviewMoveIdx(pair.blackIndex!)}
                            className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-all
                              ${activeReviewMoveIdx === pair.blackIndex 
                                ? "bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-white font-bold" 
                                : "hover:bg-white/5 text-[var(--color-text)] border border-transparent"
                              }
                            `}
                          >
                            <span>{pair.black.san}</span>
                            {pair.black.classification && classificationIcons[pair.black.classification] && (
                              <span className="text-[10px] font-bold" style={{ color: classificationIcons[pair.black.classification].color }}>
                                {classificationIcons[pair.black.classification].icon}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-[var(--color-text-dim)]/60" title={pair.black.classification ?? undefined}>
                            <span>{pair.black.san}</span>
                            {pair.black.classification && classificationIcons[pair.black.classification] && (
                              <span className="text-[10px] font-bold" style={{ color: classificationIcons[pair.black.classification].color }}>
                                {classificationIcons[pair.black.classification].icon}
                              </span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coach Insight Panel inside reviewer */}
          <AnimatePresence mode="wait">
            {reviewedMove ? (
              <motion.div
                key={activeReviewMoveIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-white/5 rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                  <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold">
                    {showBrief ? "⚡ Quick Summary" : "📊 Coach Insights"}
                  </span>
                  {reviewedClassInfo && (
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold rounded-md font-mono uppercase tracking-wider bg-white/5"
                      style={{ color: reviewedClassInfo.color }}
                    >
                      {reviewedClassInfo.label} {reviewedClassInfo.icon}
                    </span>
                  )}
                </div>

                {reviewedMove.coachExplanation ? (
                  showBrief ? (
                    <p className="text-xs text-[var(--color-text)] leading-relaxed italic font-medium mt-1">
                      &ldquo;{reviewedMove.coachSummary || "Makes a solid developmental play."}&rdquo;
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {reviewedMove.coachExplanation.split("\n").map((line: string, i: number) => {
                        const cleanLine = line.trim().replace(/^[•\-\*\s]+/, "");
                        if (!cleanLine) return null;
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                            <span
                              className="text-xs shrink-0 select-none leading-none mt-0.5"
                              style={{ color: reviewedClassInfo?.color || "var(--color-accent)" }}
                            >
                              •
                            </span>
                            <span className="leading-tight font-medium">{cleanLine}</span>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="text-xs text-[var(--color-text-dim)] italic leading-relaxed mt-1">
                    No coach explanation was saved for this move. (Insights are saved when revealed during live play to save credits).
                  </p>
                )}

                {reviewedMove.coachExplanation && (
                  <div className="mt-3 pt-1.5 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => setShowBrief(!showBrief)}
                      className="text-[9px] font-bold text-[var(--color-accent-light)] hover:text-[var(--color-accent)] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      {showBrief ? "📊 Show Details" : "⚡ Make it brief"}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-dim)] border border-dashed border-white/10 rounded-xl">
                Click any move above to read the coach's evaluation.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // List view (when no game is currently selected for review)
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Game History
        </h3>
        {gameHistory.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[10px] font-bold text-[var(--color-red)] hover:underline uppercase tracking-wider"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {gameHistory.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-text-dim)] text-xs">
            No games played yet. Complete a match to see it here!
          </div>
        ) : (
          gameHistory.map((game: any) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col gap-2 relative group"
            >
              {/* Top Row: TC and Result */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-white leading-tight">
                    {game.timeControl}
                  </span>
                  <span className="text-[9px] text-[var(--color-text-dim)] block mt-0.5 font-medium uppercase tracking-wider">
                    {game.playerColor === "w" ? "Played as White" : "Played as Black"}
                  </span>
                </div>
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5"
                  style={{ color: getResultBadgeColor(game.result) }}
                >
                  {game.result}
                </span>
              </div>

              {/* Accuracies Row */}
              <div className="flex gap-4 items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                <div className="flex gap-1.5 items-center">
                  <span className="text-[var(--color-text-muted)]">White Acc:</span>
                  <span className="font-bold text-white pr-2 border-r border-white/10">{game.whiteAccuracy}%</span>
                  <span className="text-[var(--color-text-muted)] pl-0.5">Black Acc:</span>
                  <span className="font-bold text-white">{game.blackAccuracy}%</span>
                </div>
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono shrink-0">
                  {game.moves?.length || 0} moves
                </span>
              </div>

              {/* Reveal Hover Hint */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-dim)] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all font-bold">
                →
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
