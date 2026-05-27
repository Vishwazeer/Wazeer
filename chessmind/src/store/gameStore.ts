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
  fen: string;
  coachExplanation?: string | null;
  coachSummary?: string | null;
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

  // AI Coach state
  geminiApiKey: string | null;
  coachExplanation: string | null;
  coachLoading: boolean;
  activeExplanationMoveIndex: number | null;

  // Online Multiplayer State
  onlineRoomCode: string | null;
  onlinePlayerColor: "w" | "b" | null;
  onlineOpponentJoined: boolean;

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
  addClassification: (moveIndex: number, classification: MoveClassification, evalScore?: number) => void;

  // AI Coach Actions
  setGeminiApiKey: (key: string | null) => void;
  setCoachExplanation: (explanation: string | null) => void;
  setCoachLoading: (loading: boolean) => void;
  setActiveExplanationMoveIndex: (index: number | null) => void;
  generateCoachExplanation: (
    fen: string,
    moveSan: string,
    classification: MoveClassification,
    evalScore: number
  ) => Promise<void>;
  generateCoachExplanationForIndex: (index: number) => Promise<void>;

  // Online Multiplayer Actions
  createOnlineRoom: (color: "w" | "b" | "random") => Promise<string>;
  joinOnlineRoom: (code: string) => Promise<boolean>;
  syncOnlineState: (serverState: any) => void;
  playOnlineMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;

  // Game History State & Actions
  gameHistory: any[];
  selectedHistoryGame: any | null;
  loadGameHistory: () => void;
  saveGameToHistory: () => void;
  setSelectedHistoryGame: (game: any | null) => void;
  clearGameHistory: () => void;

  // Save/Resume Game State
  hasSavedGame: boolean;
  saveCurrentGame: () => void;
  resumeSavedGame: () => boolean;
  deleteSavedGame: () => void;
  checkSavedGame: () => void;
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

  // AI Coach state
  geminiApiKey: null,
  coachExplanation: null,
  coachLoading: false,
  activeExplanationMoveIndex: null,

  // Online Multiplayer State
  onlineRoomCode: null,
  onlinePlayerColor: null,
  onlineOpponentJoined: false,

  // Game History state
  gameHistory: [],
  selectedHistoryGame: null,
  hasSavedGame: false,

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
        { move, classification: null as MoveClassification, eval: undefined, fen: newFen },
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
        activeExplanationMoveIndex: null, // Reset active explanation index on new move
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

      if (isOver) {
        get().saveGameToHistory();
      }

      return true;
    } catch {
      return false;
    }
  },

  selectSquare: (square) => {
    const { game, selectedSquare, makeMove, gameMode, playOnlineMove } = get();

    if (!square) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    // If there's already a selected square, try to make a move
    if (selectedSquare) {
      if (gameMode === "online") {
        playOnlineMove(selectedSquare, square);
        return;
      } else {
        const success = makeMove(selectedSquare, square);
        if (success) return;
      }
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
    get().saveGameToHistory();
  },

  setShowSetup: (show) => set({ showSetup: show }),

  tickClock: (color) => {
    if (color === "w") {
      set((s) => {
        const newTime = Math.max(0, s.whiteTime - 1);
        if (newTime === 0) {
          setTimeout(() => get().saveGameToHistory(), 0);
          return {
            whiteTime: 0,
            isGameOver: true,
            result: "0-1",
            clockRunning: false,
          };
        }
        return { whiteTime: newTime };
      });
    } else {
      set((s) => {
        const newTime = Math.max(0, s.blackTime - 1);
        if (newTime === 0) {
          setTimeout(() => get().saveGameToHistory(), 0);
          return {
            blackTime: 0,
            isGameOver: true,
            result: "1-0",
            clockRunning: false,
          };
        }
        return { blackTime: newTime };
      });
    }
  },

  setClockRunning: (running) => set({ clockRunning: running }),
  setIsThinking: (thinking) => set({ isThinking: thinking }),
  setCurrentEval: (evalScore) => set({ currentEval: evalScore }),

  addClassification: (moveIndex, classification, evalScore) => {
    set((s) => {
      const newHistory = [...s.moveHistory];
      if (newHistory[moveIndex]) {
        newHistory[moveIndex] = {
          ...newHistory[moveIndex],
          classification,
          eval: evalScore !== undefined ? evalScore : newHistory[moveIndex].eval,
        };
      }
      return { moveHistory: newHistory };
    });
  },

  setGeminiApiKey: (key) => {
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem("chessmind_gemini_key", key);
      } else {
        localStorage.removeItem("chessmind_gemini_key");
      }
    }
    set({ geminiApiKey: key });
  },

  setCoachExplanation: (explanation) => set({ coachExplanation: explanation }),
  setCoachLoading: (loading) => set({ coachLoading: loading }),
  setActiveExplanationMoveIndex: (index) => set({ activeExplanationMoveIndex: index }),

  generateCoachExplanation: async (fen, moveSan, classification, evalScore) => {
    const { moveHistory } = get();
    if (moveHistory.length > 0) {
      await get().generateCoachExplanationForIndex(moveHistory.length - 1);
    }
  },

  generateCoachExplanationForIndex: async (index) => {
    const { moveHistory, geminiApiKey } = get();
    const item = moveHistory[index];
    if (!item) return;

    // If it's already generated, just load it to the active coach explanation state
    if (item.coachExplanation) {
      set({ 
        coachExplanation: item.coachExplanation, 
        coachLoading: false,
        activeExplanationMoveIndex: index
      });
      return;
    }

    set({ coachLoading: true, coachExplanation: null, activeExplanationMoveIndex: index });

    // Use the item's FEN, SAN, classification, and eval
    const fen = item.fen;
    const moveSan = item.move.san;
    const classification = item.classification;
    const evalScore = item.eval ?? 0;

    let explanationText = "";

    if (geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a warm and friendly chess schoolteacher explaining chess moves to a child. Analyze this position and move.
                      Board FEN: ${fen}
                      Move played: ${moveSan}
                      Move classification: ${classification || "Normal move"}
                      Position evaluation (centipawns from white's perspective): ${evalScore}
                      
                      Provide a single warm, encouraging, and highly educational paragraph (exactly 2 to 3 sentences) explaining the strategic purpose and fun lesson behind this move in plain English. Speak like a teacher talking to a young student.
                      
                      After the paragraph, add a separator line "===" and then write a single, extremely brief and simple summary sentence (max 12 words) for beginners.
                      
                      E.g.
                      Wow, you just tucked your King away into a safe little castle, and activated your Rook to join the game! Keeping your King safe early on is one of the best secrets to winning chess.
                      ===
                      Protects your king and gets your rook ready to play.
                      
                      Use extremely simple, easy-to-understand words. Absolutely AVOID advanced chess jargon (e.g. 'tempo', 'tension', 'counterplay', 'structural concession', 'coordination', 'positional advantages', 'refutations'). Do not write list items or bullet points. Just the paragraph, the separator, and the simple summary.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            explanationText = text.trim();
          }
        }
      } catch (err) {
        console.error("[Coach] Error calling Gemini API:", err);
      }
    }

    let bullets = explanationText;
    let summary = "";

    if (explanationText.includes("===")) {
      const parts = explanationText.split("===");
      bullets = parts[0].trim();
      summary = parts[1].trim();
    }

    if (!explanationText) {
      // Local procedural fallback
      const { getFallbackExplanation, getFallbackSummary } = await import("@/lib/coachFallback");
      bullets = getFallbackExplanation(moveSan, classification, evalScore);
      summary = getFallbackSummary(moveSan, classification);
    } else if (!summary) {
      // Fallback summary if Gemini skipped it
      const { getFallbackSummary } = await import("@/lib/coachFallback");
      summary = getFallbackSummary(moveSan, classification);
    }

    // Save explanation in move history
    set((s) => {
      const newHistory = [...s.moveHistory];
      if (newHistory[index]) {
        newHistory[index] = {
          ...newHistory[index],
          coachExplanation: bullets,
          coachSummary: summary,
        };
      }
      return {
        moveHistory: newHistory,
        coachExplanation: bullets,
        coachLoading: false,
      };
    });
  },

  createOnlineRoom: async (color) => {
    const { timeControl } = get();
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerColor: color,
          timeControlLabel: timeControl.label,
          timeControlSeconds: timeControl.time,
        }),
      });
      if (!response.ok) throw new Error("Failed to create room");
      const data = await response.json();
      
      const game = new Chess();
      set({
        game,
        fen: game.fen(),
        moveHistory: [],
        isGameOver: false,
        result: null,
        gameMode: "online",
        playerColor: data.playerColor,
        boardFlipped: data.playerColor === "b",
        onlineRoomCode: data.code,
        onlinePlayerColor: data.playerColor,
        onlineOpponentJoined: false,
        showSetup: true,
        clockRunning: false,
        whiteTime: timeControl.time,
        blackTime: timeControl.time,
      });

      return data.code;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  joinOnlineRoom: async (code) => {
    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) return false;
      const data = await response.json();

      const game = new Chess();
      set({
        game,
        fen: game.fen(),
        moveHistory: [],
        isGameOver: false,
        result: null,
        gameMode: "online",
        playerColor: data.playerColor,
        boardFlipped: data.playerColor === "b",
        onlineRoomCode: data.code,
        onlinePlayerColor: data.playerColor,
        onlineOpponentJoined: true,
        showSetup: false,
        clockRunning: data.whiteTime > 0,
        whiteTime: data.whiteTime,
        blackTime: data.blackTime,
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  syncOnlineState: (serverState) => {
    const { fen, moves, whiteJoined, blackJoined, isGameOver, result, whiteTime, blackTime, lastMove } = serverState;
    const { moveHistory } = get();

    // Reconstruct game move history from server moves list
    if (moves.length !== moveHistory.length) {
      const freshGame = new Chess();
      const newHistory: ClassifiedMove[] = [];
      
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const resultMove = freshGame.move({ from: m.from, to: m.to, promotion: m.promotion || "q" });
        if (resultMove) {
          newHistory.push({
            move: resultMove,
            classification: null,
            eval: undefined,
            fen: freshGame.fen(),
            coachExplanation: null,
            coachSummary: null,
          });
        }
      }

      set({
        game: freshGame,
        fen: freshGame.fen(),
        moveHistory: newHistory,
        lastMove: lastMove ? { from: lastMove.from as Square, to: lastMove.to as Square } : null,
        activeColor: freshGame.turn(),
      });
    }

    set({
      onlineOpponentJoined: whiteJoined && blackJoined,
      isGameOver,
      result,
      whiteTime,
      blackTime,
      clockRunning: whiteJoined && blackJoined && !isGameOver && get().timeControl.time > 0,
    });
  },

  playOnlineMove: async (from: Square, to: Square, promotion) => {
    const { onlineRoomCode, whiteTime, blackTime } = get();
    if (!onlineRoomCode) return false;

    // Make move locally
    const success = get().makeMove(from, to, promotion);
    if (!success) return false;

    try {
      // Post the move to the server
      const response = await fetch(`/api/rooms/${onlineRoomCode}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          promotion,
          whiteTime,
          blackTime,
        }),
      });
      return response.ok;
    } catch (err) {
      console.error("Failed to post online move:", err);
      return false;
    }
  },

  loadGameHistory: () => {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("chessmind_game_history");
      const history = existing ? JSON.parse(existing) : [];
      set({ gameHistory: history });
    }
  },

  saveGameToHistory: () => {
    const { moveHistory, result, timeControl, playerColor, gameMode } = get();
    if (moveHistory.length === 0) return;

    // Calculate accuracies dynamically to preserve in history
    const calculateAccuracy = (player: "w" | "b") => {
      const playerMoves = moveHistory.filter((_, idx) => (player === "w" ? idx % 2 === 0 : idx % 2 === 1));
      if (playerMoves.length === 0) return 100;
      let totalCpl = 0;
      let count = 0;
      for (let i = 0; i < moveHistory.length; i++) {
        const isPlayer = player === "w" ? i % 2 === 0 : i % 2 === 1;
        if (!isPlayer) continue;
        const prevEval = i === 0 ? 0 : (moveHistory[i - 1].eval ?? 0);
        const currentEval = moveHistory[i].eval ?? 0;
        let cpl = player === "w" ? prevEval - currentEval : currentEval - prevEval;
        cpl = Math.max(0, cpl);
        totalCpl += cpl;
        count++;
      }
      if (count === 0) return 100;
      return Math.round(100 * Math.exp(-0.004 * (totalCpl / count)));
    };

    const wAcc = calculateAccuracy("w");
    const bAcc = calculateAccuracy("b");

    const newGameRecord = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      result: result || "½-½ Draw",
      timeControl: timeControl.label,
      playerColor,
      gameMode, // Added gameMode
      whiteAccuracy: wAcc,
      blackAccuracy: bAcc,
      moves: moveHistory.map(m => ({
        san: m.move.san,
        classification: m.classification,
        eval: m.eval,
        fen: m.fen,
        coachExplanation: m.coachExplanation || null,
        coachSummary: m.coachSummary || null,
      })),
    };

    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("chessmind_game_history");
      const history = existing ? JSON.parse(existing) : [];
      const updated = [newGameRecord, ...history].slice(0, 10);
      localStorage.setItem("chessmind_game_history", JSON.stringify(updated));
      set({ gameHistory: updated });
    }
  },

  setSelectedHistoryGame: (game) => set({ selectedHistoryGame: game }),

  clearGameHistory: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("chessmind_game_history");
    }
    set({ gameHistory: [], selectedHistoryGame: null });
  },

  saveCurrentGame: () => {
    const {
      fen,
      moveHistory,
      gameMode,
      playerColor,
      aiLevel,
      timeControl,
      whiteTime,
      blackTime,
      activeColor,
      boardFlipped,
      lastMove,
      isGameOver,
      result,
    } = get();

    if (typeof window !== "undefined") {
      const saveData = {
        fen,
        moveHistory: moveHistory.map(m => ({
          move: m.move,
          classification: m.classification,
          eval: m.eval,
          fen: m.fen,
          coachExplanation: m.coachExplanation || null,
          coachSummary: m.coachSummary || null,
        })),
        gameMode,
        playerColor,
        aiLevel,
        timeControl,
        whiteTime,
        blackTime,
        activeColor,
        clockRunning: false, // Don't run clock immediately on resume until unpaused
        boardFlipped,
        lastMove,
        isGameOver,
        result,
      };
      localStorage.setItem("chessmind_saved_game", JSON.stringify(saveData));
      set({ hasSavedGame: true });
    }
  },

  resumeSavedGame: () => {
    if (typeof window !== "undefined") {
      const savedStr = localStorage.getItem("chessmind_saved_game");
      if (!savedStr) return false;
      try {
        const saved = JSON.parse(savedStr);
        const game = new Chess(saved.fen);
        set({
          game,
          fen: saved.fen,
          moveHistory: saved.moveHistory,
          isGameOver: saved.isGameOver,
          result: saved.result,
          gameMode: saved.gameMode,
          playerColor: saved.playerColor,
          aiLevel: saved.aiLevel,
          timeControl: saved.timeControl,
          whiteTime: saved.whiteTime,
          blackTime: saved.blackTime,
          activeColor: saved.activeColor,
          clockRunning: saved.clockRunning,
          boardFlipped: saved.boardFlipped,
          lastMove: saved.lastMove,
          showSetup: false,
          isThinking: false,
          selectedSquare: null,
          legalMoves: [],
          activeExplanationMoveIndex: null,
          coachExplanation: null,
        });
        return true;
      } catch (err) {
        console.error("Failed to parse saved game:", err);
        return false;
      }
    }
    return false;
  },

  deleteSavedGame: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("chessmind_saved_game");
      set({ hasSavedGame: false });
    }
  },

  checkSavedGame: () => {
    if (typeof window !== "undefined") {
      const exists = !!localStorage.getItem("chessmind_saved_game");
      set({ hasSavedGame: exists });
    }
  },
}));
