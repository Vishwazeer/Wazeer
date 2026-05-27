"use client";

import { useGameStore, ClassifiedMove } from "@/store/gameStore";
import { useRef, useEffect } from "react";

const classificationIcons: Record<string, { icon: string; color: string }> = {
  brilliant: { icon: "✦", color: "var(--color-cyan)" },
  great: { icon: "!", color: "var(--color-green)" },
  good: { icon: "✓", color: "var(--color-blue)" },
  inaccuracy: { icon: "?!", color: "var(--color-amber)" },
  mistake: { icon: "?", color: "#fb923c" },
  blunder: { icon: "??", color: "var(--color-red)" },
};

function MoveEntry({
  moveData,
  index,
}: {
  moveData: ClassifiedMove;
  index: number;
}) {
  const { move, classification } = moveData;
  const classInfo = classification ? classificationIcons[classification] : null;
  const activeIndex = useGameStore((s) => s.activeExplanationMoveIndex);
  const setActiveExplanationMoveIndex = useGameStore((s) => s.setActiveExplanationMoveIndex);
  const moveHistoryLength = useGameStore((s) => s.moveHistory.length);
  const playerColor = useGameStore((s) => s.playerColor);
  const gameMode = useGameStore((s) => s.gameMode);

  const isWhite = index % 2 === 0;
  const moveColor = isWhite ? "w" : "b";
  const isInteractive = gameMode === "local" || moveColor === playerColor;

  if (!isInteractive) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-[var(--color-text-dim)]/60" title={classification ?? undefined}>
        <span>{move.san}</span>
        {classInfo && (
          <span className="text-[10px] font-bold" style={{ color: classInfo.color }}>
            {classInfo.icon}
          </span>
        )}
      </span>
    );
  }

  // Find the latest move played by the human player to check if activeExplanationMoveIndex is defaulting to it
  const getLatestHumanMoveIndex = () => {
    const { moveHistory, gameMode } = useGameStore.getState();
    if (gameMode === "local") {
      return moveHistory.length - 1;
    }
    for (let i = moveHistory.length - 1; i >= 0; i--) {
      const isW = i % 2 === 0;
      const mCol = isW ? "w" : "b";
      if (mCol === playerColor) {
        return i;
      }
    }
    return -1;
  };

  const latestHumanIndex = getLatestHumanMoveIndex();
  const isCurrentExplained =
    activeIndex === index || (activeIndex === null && index === latestHumanIndex);

  return (
    <span
      onClick={() => setActiveExplanationMoveIndex(index)}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-all border text-xs font-semibold
        ${isCurrentExplained
          ? "bg-[var(--color-accent)]/20 border-[var(--color-accent)]/30 text-white font-bold"
          : "hover:bg-white/5 border-transparent text-[var(--color-text)]"
        }
      `}
      title={classification ?? undefined}
    >
      <span>{move.san}</span>
      {classInfo && (
        <span className="text-[10px] font-bold" style={{ color: classInfo.color }}>
          {classInfo.icon}
        </span>
      )}
    </span>
  );
}

export default function MoveHistory() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const result = useGameStore((s) => s.result);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  // Group moves into pairs (white + black)
  const movePairs: Array<{
    number: number;
    whiteIndex: number;
    white: ClassifiedMove;
    blackIndex?: number;
    black?: ClassifiedMove;
  }> = [];

  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      whiteIndex: i,
      white: moveHistory[i],
      blackIndex: i + 1,
      black: moveHistory[i + 1],
    });
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Moves
        </h3>
        <span className="text-xs text-[var(--color-text-dim)] font-mono">
          {moveHistory.length} moves
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5"
      >
        {movePairs.length === 0 && (
          <div className="text-center py-10 text-[var(--color-text-dim)] text-xs">
            Make a move to begin
          </div>
        )}

        {movePairs.map((pair) => (
          <div
            key={pair.number}
            className="flex items-center gap-1.5 py-0.5 text-sm font-mono"
          >
            <span className="w-8 text-right text-[var(--color-text-dim)] text-xs shrink-0 font-bold pr-0.5">
              {pair.number}.
            </span>
            <MoveEntry moveData={pair.white} index={pair.whiteIndex} />
            {pair.blackIndex !== undefined && pair.black && (
              <MoveEntry moveData={pair.black} index={pair.blackIndex} />
            )}
          </div>
        ))}

        {result && (
          <div className="text-center py-3 mt-2 border-t border-[var(--color-border)]">
            <span className="text-sm font-black text-[var(--color-accent-light)] uppercase tracking-wider">
              {result}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
