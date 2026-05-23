"use client";

import { useGameStore, ClassifiedMove, MoveClassification } from "@/store/gameStore";

const classificationColors: Record<string, string> = {
  brilliant: "var(--color-cyan)",
  great: "var(--color-green)",
  good: "var(--color-blue)",
  inaccuracy: "var(--color-amber)",
  mistake: "#f97316",
  blunder: "var(--color-red)",
};

const classificationLabels: Record<string, string> = {
  brilliant: "Brilliant ✦",
  great: "Great !",
  good: "Good ✓",
  inaccuracy: "Inaccuracy ?!",
  mistake: "Mistake ?",
  blunder: "Blunder ??",
};

// Calculate accuracy score based on average centipawn loss
const calculateAccuracy = (player: "w" | "b", moveHistory: ClassifiedMove[]): number => {
  const playerMoves = moveHistory.filter((_, idx) => (player === "w" ? idx % 2 === 0 : idx % 2 === 1));
  if (playerMoves.length === 0) return 100;

  let totalCpl = 0;
  let count = 0;

  for (let i = 0; i < moveHistory.length; i++) {
    const isPlayer = player === "w" ? i % 2 === 0 : i % 2 === 1;
    if (!isPlayer) continue;

    const prevEval = i === 0 ? 0 : (moveHistory[i - 1].eval ?? 0);
    const currentEval = moveHistory[i].eval ?? 0;

    let cpl = 0;
    if (player === "w") {
      cpl = prevEval - currentEval;
    } else {
      cpl = currentEval - prevEval;
    }

    // Centipawn loss is non-negative
    cpl = Math.max(0, cpl);
    totalCpl += cpl;
    count++;
  }

  if (count === 0) return 100;
  const avgCpl = totalCpl / count;

  // standard accuracy scaling formula
  const accuracy = 100 * Math.exp(-0.004 * avgCpl);
  return Math.round(accuracy);
};

export default function PostGameReport() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const result = useGameStore((s) => s.result);
  const resetGame = useGameStore((s) => s.resetGame);

  const whiteAccuracy = calculateAccuracy("w", moveHistory);
  const blackAccuracy = calculateAccuracy("b", moveHistory);

  // Group move classifications
  const counts = {
    w: { brilliant: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    b: { brilliant: 0, great: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  };

  moveHistory.forEach((item, index) => {
    const player = index % 2 === 0 ? "w" : "b";
    const cls = item.classification;
    if (cls && cls in counts[player]) {
      counts[player][cls as keyof typeof counts["w"]]++;
    }
  });

  // Prepare evaluation coordinates for the SVG graph
  // We want to map move index (x) to evaluation score (y)
  const evals = moveHistory.map((m) => {
    const rawEval = m.eval ?? 0;
    // Clamp evaluation to [-800, 800] centipawns for graph aesthetic range
    return Math.max(-800, Math.min(800, rawEval));
  });

  // Always pad starting point with 0
  const graphPoints = [0, ...evals];

  // SVG Graph parameters
  const width = 500;
  const height = 110;
  const padding = 12;

  // Generate SVG Path
  const getSvgPath = (): string => {
    if (graphPoints.length === 0) return "";
    const xStep = (width - padding * 2) / Math.max(1, graphPoints.length - 1);
    
    return graphPoints
      .map((val, idx) => {
        const x = padding + idx * xStep;
        // Y mapping: middle is height/2. Positive eval goes UP (negative y in SVG), negative goes DOWN.
        // val = 800 -> y = padding (top)
        // val = -800 -> y = height - padding (bottom)
        const relativeVal = val / 800; // range [-1, 1]
        const y = height / 2 - relativeVal * (height / 2 - padding);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const getAccuracyDescription = (score: number) => {
    if (score >= 95) return "Brilliant Accuracy (Grandmaster Level)";
    if (score >= 88) return "Excellent Accuracy (Master Level)";
    if (score >= 78) return "Good accuracy (Club Player Level)";
    if (score >= 60) return "Average accuracy (Casual Player)";
    return "Struggled with tactical vision";
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl">
      {/* Title */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[var(--color-text)]">
            Game Analysis Report
          </h3>
          <p className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
            Post-Game Breakdown
          </p>
        </div>
        <button
          onClick={resetGame}
          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/25 transition-all font-semibold"
        >
          Play Again
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Result Header */}
        <div className="text-center bg-white/5 border border-white/5 rounded-xl p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-bold">
            Result
          </div>
          <div className="text-xl font-extrabold text-[var(--color-accent-light)] tracking-tight mt-0.5">
            {result === "1-0"
              ? "♔ White Wins"
              : result === "0-1"
              ? "♚ Black Wins"
              : "½-½ Draw Agreement"}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
            {moveHistory.length} moves played
          </div>
        </div>

        {/* Accuracies */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-bold mb-1">
              White Accuracy
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {whiteAccuracy}%
            </div>
            <div className="text-[9px] text-[var(--color-text-muted)] leading-snug mt-1 max-w-[130px] mx-auto">
              {getAccuracyDescription(whiteAccuracy)}
            </div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-3.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-bold mb-1">
              Black Accuracy
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {blackAccuracy}%
            </div>
            <div className="text-[9px] text-[var(--color-text-muted)] leading-snug mt-1 max-w-[130px] mx-auto">
              {getAccuracyDescription(blackAccuracy)}
            </div>
          </div>
        </div>

        {/* Evaluation Chart */}
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-bold mb-2">
            Evaluation Chart (White Advantage)
          </div>
          
          <div className="relative w-full h-[110px] bg-black/25 rounded-lg border border-[var(--color-border)] overflow-hidden">
            {/* Center equilibrium line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute top-1/4 left-0 right-0 h-px bg-white/5 border-dashed" />
            <div className="absolute top-3/4 left-0 right-0 h-px bg-white/5 border-dashed" />
            
            {/* Render evaluation line */}
            {graphPoints.length > 1 ? (
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <path
                  d={getSvgPath()}
                  fill="none"
                  stroke="var(--color-accent-light)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_2px_4px_rgba(124,92,252,0.3)]"
                />
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-text-dim)] font-mono">
                No evaluation data available
              </div>
            )}
          </div>
          <div className="flex justify-between text-[9px] text-[var(--color-text-dim)] font-semibold uppercase tracking-wider mt-1 px-0.5">
            <span>Start</span>
            <span>Middlegame</span>
            <span>End</span>
          </div>
        </div>

        {/* Move Breakdown Table */}
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden text-xs">
          <div className="px-4 py-2 bg-white/5 border-b border-[var(--color-border)] text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-bold">
            Move Classification Analysis
          </div>

          <div className="divide-y divide-[var(--color-border)] px-4 py-1">
            {(["brilliant", "great", "good", "inaccuracy", "mistake", "blunder"] as MoveClassification[]).map((cls) => {
              if (!cls) return null;
              const color = classificationColors[cls];
              const label = classificationLabels[cls];
              return (
                <div key={cls} className="flex items-center justify-between py-2">
                  <span className="font-bold flex items-center gap-1.5" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <div className="flex items-center gap-6 font-mono font-bold text-white pr-1">
                    <span title="White">{counts.w[cls as keyof typeof counts.w]}</span>
                    <span className="text-[var(--color-text-dim)] font-normal text-[10px]">vs</span>
                    <span title="Black">{counts.b[cls as keyof typeof counts.w]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
