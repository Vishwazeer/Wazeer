"use client";

import { useEffect, useRef } from "react";
import { Square } from "chess.js";
import { useGameStore } from "@/store/gameStore";
import { getPlayEngine, getAnalysisEngine, classifyMove } from "@/lib/engine";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

// Unicode chess pieces
const PIECE_SYMBOLS: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

export default function Board() {
  const fen = useGameStore((s) => s.fen);
  const boardFlipped = useGameStore((s) => s.boardFlipped);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalMoves = useGameStore((s) => s.legalMoves);
  const lastMove = useGameStore((s) => s.lastMove);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isThinking = useGameStore((s) => s.isThinking);
  const gameMode = useGameStore((s) => s.gameMode);
  const playerColor = useGameStore((s) => s.playerColor);
  const aiLevel = useGameStore((s) => s.aiLevel);
  const onlineRoomCode = useGameStore((s) => s.onlineRoomCode);
  const onlinePlayerColor = useGameStore((s) => s.onlinePlayerColor);

  const playEngineRef = useRef<ReturnType<typeof getPlayEngine> | null>(null);
  const analysisEngineRef = useRef<ReturnType<typeof getAnalysisEngine> | null>(null);
  const prevEvalRef = useRef<number>(0);

  // Initialize engines
  useEffect(() => {
    const playEngine = getPlayEngine();
    const analysisEngine = getAnalysisEngine();
    playEngineRef.current = playEngine;
    analysisEngineRef.current = analysisEngine;
    
    playEngine.init().catch(console.error);
    analysisEngine.init().catch(console.error);
    
    return () => {
      playEngine.stop();
      analysisEngine.stop();
    };
  }, []);

  // AI move logic
  useEffect(() => {
    if (gameMode !== "ai" || isGameOver) return;

    const state = useGameStore.getState();
    if (state.game.turn() === playerColor || state.isThinking) return;

    const engine = playEngineRef.current;
    if (!engine) return;

    state.setIsThinking(true);
    const thinkTime = Math.max(300, Math.min(2000, aiLevel * 100));

    engine
      .getBestMove(state.fen, aiLevel, thinkTime)
      .then((bestMove) => {
        if (bestMove && bestMove.length >= 4) {
          const from = bestMove.substring(0, 2) as Square;
          const to = bestMove.substring(2, 4) as Square;
          const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
          useGameStore.getState().makeMove(from, to, promotion);
        }
      })
      .catch(console.error)
      .finally(() => {
        useGameStore.getState().setIsThinking(false);
      });
  }, [fen, gameMode, playerColor, isGameOver, aiLevel]);

  // Evaluate position and classify last move
  useEffect(() => {
    const engine = analysisEngineRef.current;
    if (!engine) return;

    const state = useGameStore.getState();
    const currentHistoryLength = state.moveHistory.length;

    engine
      .evaluate(state.fen, 16)
      .then((result) => {
        const turn = state.game.turn();
        const evalFromWhite = turn === "w" ? result.eval : -result.eval;

        // Update current evaluation
        useGameStore.getState().setCurrentEval(evalFromWhite);

        if (currentHistoryLength > 0) {
          const prevEval = prevEvalRef.current;
          const newEval = evalFromWhite;

          // The player who just moved is the opposite of the current turn
          const justMoved = turn === "w" ? "b" : "w";

          // Calculate centipawn loss (positive is worse for the player who just moved)
          let cpl = 0;
          if (justMoved === "w") {
            cpl = prevEval - newEval;
          } else {
            cpl = newEval - prevEval;
          }

          // Classify the move
          const classification = classifyMove(cpl);

          // Add it to the store
          useGameStore.getState().addClassification(currentHistoryLength - 1, classification, evalFromWhite);

          // Trigger AI Coach explanation (all sides in local mode, or only human player in other modes)
          const isCoachAllowed = state.gameMode === "local" || justMoved === state.playerColor;
          if (isCoachAllowed) {
            if (classification === "mistake" || classification === "blunder") {
              const moveSan = state.moveHistory[currentHistoryLength - 1]?.move?.san || "";
              useGameStore.getState().generateCoachExplanation(state.fen, moveSan, classification, evalFromWhite).catch(console.error);
            } else {
              // Reset explanation for standard moves to keep them on-demand
              useGameStore.getState().setCoachExplanation(null);
            }
          }
        }

        // Save current eval for next move comparison
        prevEvalRef.current = evalFromWhite;
      })
      .catch(console.error);
  }, [fen]);

  // Start clock after first move
  useEffect(() => {
    const { moveHistory, timeControl, gameMode } = useGameStore.getState();
    if (gameMode !== "online" && moveHistory.length === 1 && timeControl.time > 0) {
      useGameStore.getState().setClockRunning(true);
    }
  }, [fen]);

  // Online Multiplayer Polling Loop
  useEffect(() => {
    if (gameMode !== "online" || !onlineRoomCode || isGameOver) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${onlineRoomCode}`);
        if (res.ok) {
          const serverState = await res.json();
          // Synchronize locally with server board state
          useGameStore.getState().syncOnlineState(serverState);
        }
      } catch (err) {
        console.error("Board online poll error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fen, gameMode, onlineRoomCode, isGameOver]);

  // Parse FEN to get board state
  const board = parseFen(fen);

  // Determine display order based on flip
  const displayRanks = boardFlipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = boardFlipped ? [...FILES].reverse() : FILES;

  function handleSquareClick(square: Square) {
    const state = useGameStore.getState();
    if (state.isGameOver) return;
    if (state.gameMode === "ai" && state.game.turn() !== state.playerColor) return;
    if (state.gameMode === "online" && state.game.turn() !== state.onlinePlayerColor) return;

    state.selectSquare(square);
  }

  function getSquareClass(file: string, rank: string, fileIdx: number, rankIdx: number) {
    const square = `${file}${rank}` as Square;
    const isLight = (fileIdx + rankIdx) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isLegal = legalMoves.includes(square);
    const isLastMoveFrom = lastMove?.from === square;
    const isLastMoveTo = lastMove?.to === square;

    const state = useGameStore.getState();
    const piece = state.game.get(square);
    const isLegalCapture = isLegal && piece;

    let classes = `board-square ${isLight ? "light" : "dark"}`;
    if (isSelected) classes += " selected";
    if (isLastMoveFrom || isLastMoveTo) classes += " last-move";
    if (isLegal && !isLegalCapture) classes += " legal-move";
    if (isLegalCapture) classes += " legal-capture";

    return classes;
  }

  return (
    <div className="chess-board-wrapper relative">
      <div
        className="board-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          aspectRatio: "1",
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(124, 92, 252, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = `${file}${rank}` as Square;
            const pieceData = board[square];

            return (
              <div
                key={square}
                className={getSquareClass(file, rank, fileIdx, rankIdx)}
                onClick={() => handleSquareClick(square)}
                style={{ position: "relative", cursor: "pointer" }}
              >
                {/* Rank label (left column) */}
                {fileIdx === 0 && (
                  <span className="coord-label rank-label">{rank}</span>
                )}
                {/* File label (bottom row) */}
                {rankIdx === 7 && (
                  <span className="coord-label file-label">{file}</span>
                )}

                {/* Legal move dot */}
                {legalMoves.includes(square) && !pieceData && (
                  <div className="legal-dot" />
                )}

                {/* Legal capture ring */}
                {legalMoves.includes(square) && pieceData && (
                  <div className="capture-ring" />
                )}

                {/* Piece */}
                {pieceData && (
                  <span
                    className={`chess-piece ${pieceData.color === "w" ? "white-piece" : "black-piece"}`}
                    style={{ fontSize: "clamp(28px, 7vw, 52px)" }}
                  >
                    {PIECE_SYMBOLS[`${pieceData.color}${pieceData.type}`]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 100,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: "var(--color-accent)",
              borderRadius: "50%",
              animation: "glow-pulse 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>
            Thinking...
          </span>
        </div>
      )}

      <style jsx>{`
        .board-square {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 0.15s;
        }
        .board-square.light { background: #eeeed2; }
        .board-square.dark { background: #769656; }
        .board-square.selected { background: rgba(186, 201, 74, 0.6) !important; }
        .board-square.last-move { background: rgba(247, 247, 133, 0.4) !important; }
        .board-square:hover { filter: brightness(1.1); }

        .legal-dot {
          position: absolute;
          width: 26%;
          height: 26%;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.15);
          pointer-events: none;
        }

        .capture-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 5px solid rgba(0, 0, 0, 0.12);
          pointer-events: none;
        }

        .chess-piece {
          user-select: none;
          pointer-events: none;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.15s;
        }
        .white-piece { color: #f0f0f0; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
        .black-piece { color: #1a1a2e; text-shadow: 0 1px 2px rgba(255,255,255,0.1); }

        .coord-label {
          position: absolute;
          font-size: 10px;
          font-weight: 600;
          pointer-events: none;
          opacity: 0.6;
        }
        .rank-label { top: 2px; left: 4px; }
        .file-label { bottom: 2px; right: 4px; }
        .light .coord-label { color: #769656; }
        .dark .coord-label { color: #eeeed2; }
      `}</style>
    </div>
  );
}

// Parse FEN string to get piece positions
function parseFen(fen: string): Record<string, { type: string; color: string }> {
  const pieces: Record<string, { type: string; color: string }> = {};
  const ranks = fen.split(" ")[0].split("/");

  ranks.forEach((rank, rankIdx) => {
    let fileIdx = 0;
    for (const char of rank) {
      if (/\d/.test(char)) {
        fileIdx += parseInt(char);
      } else {
        const square = `${FILES[fileIdx]}${8 - rankIdx}`;
        pieces[square] = {
          type: char.toLowerCase(),
          color: char === char.toUpperCase() ? "w" : "b",
        };
        fileIdx++;
      }
    }
  });

  return pieces;
}
