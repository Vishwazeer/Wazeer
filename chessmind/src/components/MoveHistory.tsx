"use client";

import { useGameStore, ClassifiedMove } from "@/store/gameStore";
import { useRef, useEffect } from "react";

const classificationIcons: Record<string, { icon: string; color: string }> = {
  brilliant: { icon: "✦", color: "var(--color-cyan)" },
  great: { icon: "!", color: "var(--color-green)" },
  good: { icon: "✓", color: "var(--color-blue)" },
  inaccuracy: { icon: "?!", color: "var(--color-amber)" },
  mistake: { icon: "?", color: "#f97316" },
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

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer transition-colors"
      title={classification ?? undefined}
    >
      <span className="text-[var(--color-text)]">{move.san}</span>
      {classInfo && (
        <span
          className="text-xs font-bold"
          style={{ color: classInfo.color }}
        >
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
    white: ClassifiedMove;
    black?: ClassifiedMove;
  }> = [];

  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Moves
        </h3>
        <span className="text-xs text-[var(--color-text-dim)]">
          {moveHistory.length} moves
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5"
      >
        {movePairs.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-dim)] text-sm">
            Make a move to begin
          </div>
        )}

        {movePairs.map((pair) => (
          <div
            key={pair.number}
            className="flex items-center gap-1 py-0.5 text-sm font-mono"
          >
            <span className="w-8 text-right text-[var(--color-text-dim)] text-xs shrink-0">
              {pair.number}.
            </span>
            <MoveEntry moveData={pair.white} index={(pair.number - 1) * 2} />
            {pair.black && (
              <MoveEntry
                moveData={pair.black}
                index={(pair.number - 1) * 2 + 1}
              />
            )}
          </div>
        ))}

        {result && (
          <div className="text-center py-3 mt-2 border-t border-[var(--color-border)]">
            <span className="text-lg font-bold text-[var(--color-accent-light)]">
              {result}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
