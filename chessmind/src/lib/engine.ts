/**
 * Stockfish Engine Communication Interface
 * Manages a Web Worker running Stockfish WASM and provides
 * a clean API for position evaluation and best-move calculation.
 */

type MessageHandler = (data: string) => void;

export class StockfishEngine {
  private worker: Worker | null = null;
  private messageHandlers: MessageHandler[] = [];
  private ready = false;
  private readyResolve: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.worker) return;

    return new Promise((resolve, reject) => {
      try {
        // Use the stockfish.js WASM worker
        this.worker = new Worker("/stockfish/stockfish-18-lite-single.js");

        this.worker.onmessage = (e) => {
          const data = typeof e.data === "string" ? e.data : String(e.data);
          this.messageHandlers.forEach((handler) => handler(data));

          if (data === "readyok") {
            this.ready = true;
            if (this.readyResolve) {
              this.readyResolve();
              this.readyResolve = null;
            }
          }
        };

        this.worker.onerror = (err) => {
          console.error("Stockfish worker error:", err);
          reject(err);
        };

        this.sendCommand("uci");
        this.readyResolve = resolve;
        this.sendCommand("isready");
      } catch (err) {
        reject(err);
      }
    });
  }

  private sendCommand(command: string): void {
    this.worker?.postMessage(command);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Set engine skill level (0-20).
   * Maps roughly to ELO 800-3200.
   */
  setSkillLevel(level: number): void {
    const clamped = Math.max(0, Math.min(20, level));
    this.sendCommand(`setoption name Skill Level value ${clamped}`);
  }

  /**
   * Evaluate a position and return evaluation info.
   */
  async evaluate(
    fen: string,
    depth: number = 18,
    multiPV: number = 1
  ): Promise<EvalResult> {
    if (!this.ready) await this.init();

    return new Promise((resolve) => {
      const result: EvalResult = {
        eval: 0,
        bestMove: "",
        depth: 0,
        lines: [],
        mate: null,
      };

      this.sendCommand(`setoption name MultiPV value ${multiPV}`);
      this.sendCommand(`position fen ${fen}`);

      const cleanup = this.onMessage((data) => {
        // Parse "info" lines for evaluation data
        if (data.startsWith("info depth")) {
          const parsedInfo = parseInfoLine(data);
          if (parsedInfo) {
            const pvIndex = (parsedInfo.multipv || 1) - 1;
            while (result.lines.length <= pvIndex) {
              result.lines.push({ eval: 0, moves: [], depth: 0, mate: null });
            }
            result.lines[pvIndex] = {
              eval: parsedInfo.score,
              moves: parsedInfo.pv,
              depth: parsedInfo.depth,
              mate: parsedInfo.mate,
            };
            // Primary line
            if (pvIndex === 0) {
              result.eval = parsedInfo.score;
              result.depth = parsedInfo.depth;
              result.mate = parsedInfo.mate;
            }
          }
        }

        // Parse "bestmove" line — analysis complete
        if (data.startsWith("bestmove")) {
          const parts = data.split(" ");
          result.bestMove = parts[1] || "";
          cleanup();
          resolve(result);
        }
      });

      this.sendCommand(`go depth ${depth}`);
    });
  }

  /**
   * Get best move for the AI opponent to play.
   */
  async getBestMove(
    fen: string,
    skillLevel: number,
    timeMs: number = 1000
  ): Promise<string> {
    if (!this.ready) await this.init();

    this.setSkillLevel(skillLevel);

    return new Promise((resolve) => {
      this.sendCommand(`position fen ${fen}`);

      const cleanup = this.onMessage((data) => {
        if (data.startsWith("bestmove")) {
          const parts = data.split(" ");
          cleanup();
          resolve(parts[1] || "");
        }
      });

      this.sendCommand(`go movetime ${timeMs}`);
    });
  }

  /**
   * Stop any ongoing analysis.
   */
  stop(): void {
    this.sendCommand("stop");
  }

  /**
   * Destroy the worker.
   */
  destroy(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
  }
}

// ─── Types ───

export interface EvalResult {
  eval: number; // centipawns from side-to-move perspective
  bestMove: string; // UCI format e.g. "e2e4"
  depth: number;
  mate: number | null;
  lines: EvalLine[];
}

export interface EvalLine {
  eval: number;
  moves: string[];
  depth: number;
  mate: number | null;
}

// ─── Helpers ───

interface ParsedInfo {
  depth: number;
  score: number;
  mate: number | null;
  pv: string[];
  multipv: number;
}

function parseInfoLine(line: string): ParsedInfo | null {
  const depthMatch = line.match(/depth (\d+)/);
  const scoreMatch = line.match(/score cp (-?\d+)/);
  const mateMatch = line.match(/score mate (-?\d+)/);
  const pvMatch = line.match(/ pv (.+)/);
  const multipvMatch = line.match(/multipv (\d+)/);

  if (!depthMatch) return null;
  // Skip low seldepth info lines
  const seldepthMatch = line.match(/seldepth (\d+)/);
  if (seldepthMatch && parseInt(seldepthMatch[1]) < 3) return null;

  return {
    depth: parseInt(depthMatch[1]),
    score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    mate: mateMatch ? parseInt(mateMatch[1]) : null,
    pv: pvMatch ? pvMatch[1].split(" ") : [],
    multipv: multipvMatch ? parseInt(multipvMatch[1]) : 1,
  };
}

/**
 * Classify a move based on centipawn loss.
 */
export function classifyMove(
  cpl: number,
  _isSacrifice: boolean = false,
  _createsUnavoidableThreat: boolean = false
): "brilliant" | "great" | "good" | "inaccuracy" | "mistake" | "blunder" {
  if (cpl <= -50 && _isSacrifice && _createsUnavoidableThreat) return "brilliant";
  if (cpl <= 0) return "great";
  if (cpl <= 30) return "good";
  if (cpl <= 100) return "inaccuracy";
  if (cpl <= 250) return "mistake";
  return "blunder";
}

// Singleton instance
let engineInstance: StockfishEngine | null = null;

export function getEngine(): StockfishEngine {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}
