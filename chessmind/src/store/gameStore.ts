import { create } from "zustand";
import { Chess, Square, Move } from "chess.js";

export type MoveClassification =
  | "brilliant"
  | "great"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | null;

export type TimeControl = {
  label: string;
  time: number; // seconds
  increment: number; // seconds
};

export const TIME_CONTROLS: TimeControl[] = [
  { label: "1+0 Bullet", time: 60, increment: 0 },
  { label: "3+0 Blitz", time: 180, increment: 0 },
  { label: "3+2 Blitz", time: 180, increment: 2 },
  { label: "5+3 Blitz", time: 300, increment: 3 },
  { label: "10+0 Rapid", time: 600, increment: 0 },
  { label: "15+10 Rapid", time: 900, increment: 10 },
  { label: "30+0 Classical", time: 1800, increment: 0 },
  { label: "∞ Untimed", time: 0, increment: 0 },
];

export type GameMode = "ai" | "local" | "online";

export interface ClassifiedMove {
  move: Move;
  classification: MoveClassification;
  eval?: number;
}

interface GameState {
  // Core game
  game: Chess;
  fen: string;
  moveHistory: ClassifiedMove[];
  isGameOver: boolean;
  result: string | null;

  // Settings
  gameMode: GameMode;
  playerColor: "w" | "b";
  aiLevel: number; // 1-20 (Stockfish skill level)
  timeControl: TimeControl;
  boardFlipped: boolean;

  // Clocks
  whiteTime: number;
  blackTime: number;
  activeColor: "w" | "b";
  clockRunning: boolean;

  // UI
  selectedSquare: Square | null;
  legalMoves: string[];
  lastMove: { from: Square; to: Square } | null;
  showSetup: boolean;
  isThinking: boolean;
  currentEval: number; // centipawns from white's perspective

  // Actions
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  selectSquare: (square: Square | null) => void;
  setAiLevel: (level: number) => void;
  setTimeControl: (tc: TimeControl) => void;
  setPlayerColor: (color: "w" | "b") => void;
  setGameMode: (mode: GameMode) => void;
  flipBoard: () => void;
  startGame: () => void;
  resetGame: () => void;
  resign: () => void;
  setShowSetup: (show: boolean) => void;
  tickClock: (color: "w" | "b") => void;
  setClockRunning: (running: boolean) => void;
  setIsThinking: (thinking: boolean) => void;
  setCurrentEval: (evalScore: number) => void;
  addClassification: (moveIndex: number, classification: MoveClassification) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  game: new Chess(),
  fen: new Chess().fen(),
  moveHistory: [],
  isGameOver: false,
  result: null,

  gameMode: "ai",
  playerColor: "w",
  aiLevel: 10,
  timeControl: TIME_CONTROLS[3], // 5+3
  boardFlipped: false,

  whiteTime: TIME_CONTROLS[3].time,
  blackTime: TIME_CONTROLS[3].time,
  activeColor: "w",
  clockRunning: false,

  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  showSetup: true,
  isThinking: false,
  currentEval: 0,

  makeMove: (from, to, promotion) => {
    const { game, timeControl, moveHistory } = get();
    try {
      // Only include promotion for pawn moves to the last rank
      const piece = game.get(from);

      const isPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && to[1] === "8") ||
          (piece.color === "b" && to[1] === "1"));

      const moveObj: { from: string; to: string; promotion?: string } = { from, to };
      if (isPromotion) {
        moveObj.promotion = promotion || "q";
      }

      const move = game.move(moveObj);
      if (!move) return false;

      const newFen = game.fen();
      const isOver = game.isGameOver();
      const turn = game.turn();
      let result: string | null = null;
      if (game.isCheckmate()) result = turn === "w" ? "0-1" : "1-0";
      else if (game.isDraw()) result = "½-½";
      else if (game.isStalemate()) result = "½-½ Stalemate";

      // Create a fresh Chess instance so Zustand detects the new reference
      const newGame = new Chess(newFen);

      const newMoveHistory = [
        ...moveHistory,
        { move, classification: null as MoveClassification, eval: undefined },
      ];

      set({
        game: newGame,
        fen: newFen,
        moveHistory: newMoveHistory,
        lastMove: { from: from as Square, to: to as Square },
        selectedSquare: null,
        legalMoves: [],
        activeColor: turn,
        isGameOver: isOver,
        result,
        clockRunning: !isOver && timeControl.time > 0,
      });

      // Add increment to the player who just moved
      if (timeControl.increment > 0 && !isOver) {
        const movedColor = turn === "w" ? "b" : "w";
        if (movedColor === "w") {
          set((s) => ({ whiteTime: s.whiteTime + timeControl.increment }));
        } else {
          set((s) => ({ blackTime: s.blackTime + timeControl.increment }));
        }
      }

      return true;
    } catch {
      return false;
    }
  },

  selectSquare: (square) => {
    const { game, selectedSquare, makeMove } = get();

    if (!square) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    // If there's already a selected square, try to make a move
    if (selectedSquare) {
      const success = makeMove(selectedSquare, square);
      if (success) return;
    }

    // Select the new square if it has a piece of the current player
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      const moves = game.moves({ square, verbose: true });
      set({
        selectedSquare: square,
        legalMoves: moves.map((m) => m.to),
      });
    } else {
      set({ selectedSquare: null, legalMoves: [] });
    }
  },

  setAiLevel: (level) => set({ aiLevel: level }),
  setTimeControl: (tc) =>
    set({ timeControl: tc, whiteTime: tc.time, blackTime: tc.time }),
  setPlayerColor: (color) => set({ playerColor: color, boardFlipped: color === "b" }),
  setGameMode: (mode) => set({ gameMode: mode }),
  flipBoard: () => set((s) => ({ boardFlipped: !s.boardFlipped })),

  startGame: () => {
    const { timeControl, playerColor } = get();
    const game = new Chess();
    set({
      game,
      fen: game.fen(),
      moveHistory: [],
      isGameOver: false,
      result: null,
      whiteTime: timeControl.time,
      blackTime: timeControl.time,
      activeColor: "w",
      clockRunning: false,
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      showSetup: false,
      isThinking: false,
      currentEval: 0,
      boardFlipped: playerColor === "b",
    });
  },

  resetGame: () => {
    const game = new Chess();
    set({
      game,
      fen: game.fen(),
      moveHistory: [],
      isGameOver: false,
      result: null,
      showSetup: true,
      clockRunning: false,
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      isThinking: false,
      currentEval: 0,
    });
  },

  resign: () => {
    const { game } = get();
    const winner = game.turn() === "w" ? "0-1" : "1-0";
    set({ isGameOver: true, result: winner, clockRunning: false });
  },

  setShowSetup: (show) => set({ showSetup: show }),

  tickClock: (color) => {
    if (color === "w") {
      set((s) => {
        const newTime = Math.max(0, s.whiteTime - 1);
        if (newTime === 0)
          return {
            whiteTime: 0,
            isGameOver: true,
            result: "0-1",
            clockRunning: false,
          };
        return { whiteTime: newTime };
      });
    } else {
      set((s) => {
        const newTime = Math.max(0, s.blackTime - 1);
        if (newTime === 0)
          return {
            blackTime: 0,
            isGameOver: true,
            result: "1-0",
            clockRunning: false,
          };
        return { blackTime: newTime };
      });
    }
  },

  setClockRunning: (running) => set({ clockRunning: running }),
  setIsThinking: (thinking) => set({ isThinking: thinking }),
  setCurrentEval: (evalScore) => set({ currentEval: evalScore }),

  addClassification: (moveIndex, classification) => {
    set((s) => {
      const newHistory = [...s.moveHistory];
      if (newHistory[moveIndex]) {
        newHistory[moveIndex] = { ...newHistory[moveIndex], classification };
      }
      return { moveHistory: newHistory };
    });
  },
}));
