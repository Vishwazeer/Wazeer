"use client";

import { useEffect, useRef } from "react";
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

  // Board replay state
  const isReviewingHistory = useGameStore((s) => s.isReviewingHistory);
  const reviewMoveIndex = useGameStore((s) => s.reviewMoveIndex);
  const enterReviewMode = useGameStore((s) => s.enterReviewMode);
  const exitReviewMode = useGameStore((s) => s.exitReviewMode);
  const reviewGoTo = useGameStore((s) => s.reviewGoTo);
  const reviewForward = useGameStore((s) => s.reviewForward);
  const reviewBackward = useGameStore((s) => s.reviewBackward);
  const reviewMoves = useGameStore((s) => s.reviewMoves);

  // Ref for scrolling active move into view
  const activeRowRef = useRef<HTMLButtonElement | null>(null);

  // Load history on mount
  useEffect(() => {
    loadGameHistory();
  }, [loadGameHistory]);

  // Auto-scroll active move into view during replay
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [reviewMoveIndex]);

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

  // ── Selected game review view ──────────────────────────────────────────────
  if (selectedGame) {
    const moves = selectedGame.moves || [];

    // Group into pairs for display
    const movePairs: Array<{
      number: number;
      whiteIndex: number;
      white: any;
      blackIndex?: number;
      black?: any;
    }> = [];
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push({
        number: Math.floor(i / 2) + 1,
        whiteIndex: i,
        white: moves[i],
        blackIndex: i + 1,
        black: moves[i + 1],
      });
    }

    const reviewedMove =
      isReviewingHistory && reviewMoveIndex !== null && reviewMoveIndex >= 0
        ? reviewMoves[reviewMoveIndex]
        : null;
    const reviewedClassInfo =
      reviewedMove?.classification ? classificationIcons[reviewedMove.classification] : null;

    const atStart = !isReviewingHistory || reviewMoveIndex === null || reviewMoveIndex <= -1;
    const atEnd = !isReviewingHistory || reviewMoveIndex === moves.length - 1;

    return (
      <div className="flex flex-col h-full bg-[var(--color-surface)] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              setSelectedGame(null);
              exitReviewMode();
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

          {/* Replay Controls */}
          <div className="flex items-center gap-2">
            {!isReviewingHistory ? (
              <button
                onClick={() => enterReviewMode(selectedGame)}
                className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider
                           bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30
                           text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/25
                           transition-all flex items-center justify-center gap-1.5"
              >
                📽 Replay on Board
              </button>
            ) : (
              <>
                <button
                  onClick={() => reviewGoTo(-1)}
                  disabled={atStart}
                  title="Go to start"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10
                             text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                >
                  ⏮
                </button>
                <button
                  onClick={reviewBackward}
                  disabled={atStart}
                  title="Previous move"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10
                             text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                >
                  ◀
                </button>
                <span className="flex-1 text-center text-[10px] font-bold text-[var(--color-accent-light)] font-mono">
                  {reviewMoveIndex !== null && reviewMoveIndex >= 0 ? reviewMoveIndex + 1 : 0} / {moves.length}
                </span>
                <button
                  onClick={reviewForward}
                  disabled={atEnd}
                  title="Next move"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10
                             text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                >
                  ▶
                </button>
                <button
                  onClick={() => reviewGoTo(moves.length - 1)}
                  disabled={atEnd}
                  title="Go to end"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10
                             text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
                >
                  ⏭
                </button>
                <button
                  onClick={exitReviewMode}
                  title="Exit replay"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-red)]/10 border border-[var(--color-red)]/20
                             text-[var(--color-red)] hover:bg-[var(--color-red)]/20 transition-all text-xs font-bold"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* Moves List + Coach Insight */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Move List */}
          <div className="space-y-1">
            <h5 className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold mb-2">
              {isReviewingHistory ? "🎬 Click a move to jump to it" : "Moves List (Click ▶ Replay on Board first)"}
            </h5>
            {movePairs.length === 0 ? (
              <div className="text-xs text-[var(--color-text-dim)] italic">No moves recorded.</div>
            ) : (
              <div className="grid grid-cols-1 gap-0.5 font-mono text-sm max-h-[160px] overflow-y-auto p-1.5 bg-black/20 rounded-xl border border-[var(--color-border)]">
                {movePairs.map((pair) => {
                  const isWhiteActive = isReviewingHistory && reviewMoveIndex === pair.whiteIndex;
                  const isBlackActive = isReviewingHistory && reviewMoveIndex === pair.blackIndex;

                  return (
                    <div key={pair.number} className="flex items-center gap-1 py-0.5">
                      <span className="w-7 text-right text-[var(--color-text-dim)] text-[10px] pr-1 shrink-0 font-bold">
                        {pair.number}.
                      </span>

                      {/* White Move */}
                      <button
                        ref={isWhiteActive ? activeRowRef : null}
                        onClick={() => isReviewingHistory && reviewGoTo(pair.whiteIndex)}
                        className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-all text-xs
                          ${isWhiteActive
                            ? "bg-[var(--color-accent)]/25 border border-[var(--color-accent)]/50 text-white font-bold"
                            : isReviewingHistory
                              ? "hover:bg-white/8 text-[var(--color-text)] border border-transparent cursor-pointer"
                              : "text-[var(--color-text-dim)] border border-transparent cursor-default"
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

                      {/* Black Move */}
                      {pair.blackIndex !== undefined && pair.black && (
                        <button
                          ref={isBlackActive ? activeRowRef : null}
                          onClick={() => isReviewingHistory && reviewGoTo(pair.blackIndex!)}
                          className={`px-1.5 py-0.5 rounded text-left flex items-center gap-1 transition-all text-xs
                            ${isBlackActive
                              ? "bg-[var(--color-accent)]/25 border border-[var(--color-accent)]/50 text-white font-bold"
                              : isReviewingHistory
                                ? "hover:bg-white/8 text-[var(--color-text)] border border-transparent cursor-pointer"
                                : "text-[var(--color-text-dim)] border border-transparent cursor-default"
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coach Insight Panel for the active replay move */}
          <AnimatePresence mode="wait">
            {reviewedMove ? (
              <motion.div
                key={reviewMoveIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-white/5 rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                  <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-bold">
                    📊 Coach Insights
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
                  <p className="text-xs text-[var(--color-text)] leading-relaxed mt-1">
                    {reviewedMove.coachExplanation}
                  </p>
                ) : reviewedMove.coachSummary ? (
                  <p className="text-xs text-[var(--color-text)] leading-relaxed italic font-medium mt-1">
                    &ldquo;{reviewedMove.coachSummary}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-text-dim)] italic leading-relaxed mt-1">
                    No coach explanation saved for this move.
                  </p>
                )}
              </motion.div>
            ) : isReviewingHistory ? (
              <div className="text-center py-4 text-xs text-[var(--color-text-dim)] border border-dashed border-white/10 rounded-xl">
                Navigating the game — click a move to see coach insights.
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[var(--color-text-dim)] border border-dashed border-white/10 rounded-xl">
                Press <span className="text-[var(--color-accent-light)] font-bold">📽 Replay on Board</span> to start navigating the game.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── History list view ──────────────────────────────────────────────────────
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
