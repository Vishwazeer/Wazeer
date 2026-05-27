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
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      let initialized = false;

      const setupWorker = (workerInstance: Worker) => {
        this.worker = workerInstance;
        
        this.worker.onmessage = (e) => {
          const data = typeof e.data === "string" ? e.data : String(e.data);
          this.messageHandlers.forEach((handler) => handler(data));

          if (data === "readyok") {
            this.ready = true;
            initialized = true;
            resolve();
          }
        };

        this.worker.onerror = (err) => {
          console.error("Stockfish worker error details:", {
            message: err.message,
            filename: err.filename,
            lineno: err.lineno,
            colno: err.colno,
            error: err.error
          });
          if (!initialized) {
            tryFallback();
          }
        };

        this.sendCommand("uci");
        this.sendCommand("isready");
      };

      const tryPrimary = () => {
        try {
          console.log("[Engine] Attempting primary Stockfish WASM Web Worker...");
          
          // Use window.Worker dynamically to prevent Next.js static analysis bundler interception
          const WorkerConstructor = typeof window !== "undefined" ? window.Worker : null;
          if (!WorkerConstructor) throw new Error("Window.Worker is not available");
          
          const worker = new WorkerConstructor("/stockfish/stockfish-18-lite-single.js");
          setupWorker(worker);
        } catch (err) {
          console.warn("[Engine] Primary WASM Web Worker initialization failed, trying fallback...", err);
          tryFallback();
        }
      };

      const tryFallback = () => {
        try {
          console.log("[Engine] Attempting ASM.js Web Worker fallback...");
          
          if (this.worker) {
            try {
              this.worker.terminate();
            } catch (e) {
              console.warn("Failed to terminate primary worker on fallback:", e);
            }
            this.worker = null;
          }
          
          const WorkerConstructor = typeof window !== "undefined" ? window.Worker : null;
          if (!WorkerConstructor) throw new Error("Window.Worker is not available");
          
          const worker = new WorkerConstructor("/stockfish/worker.js");
          setupWorker(worker);
        } catch (asmErr) {
          console.error("[Engine] All Stockfish initialization strategies failed!", asmErr);
          this.initPromise = null;
          reject(asmErr);
        }
      };

      // Start flow
      tryPrimary();

      // Final fallback safety timeout
      setTimeout(() => {
        if (!this.ready) {
          console.warn("[Engine] Stockfish engine initialization timed out, resolving to allow interface interactions.");
          resolve();
        }
      }, 15000);
    });

    return this.initPromise;
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

  clearHandlers(): void {
    this.messageHandlers = [];
  }

  /**
   * Set engine skill level (0-20).
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
    this.restartWorker();

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
            if (pvIndex === 0) {
              result.eval = parsedInfo.score;
              result.depth = parsedInfo.depth;
              result.mate = parsedInfo.mate;
            }
          }
        }

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

    this.stop();
    this.clearHandlers();

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
    this.initPromise = null;
  }

  restartWorker(): void {
    try {
      this.worker?.terminate();
    } catch (e) {
      console.warn("Error terminating worker:", e);
    }
    this.worker = null;
    this.ready = false;
    this.initPromise = null;
    this.messageHandlers = [];
  }
}

// ─── Types ───

export interface EvalResult {
  eval: number;
  bestMove: string;
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

// Singleton instances
let analysisEngineInstance: StockfishEngine | null = null;
let playEngineInstance: StockfishEngine | null = null;

export function getAnalysisEngine(): StockfishEngine {
  if (!analysisEngineInstance) {
    analysisEngineInstance = new StockfishEngine();
  }
  return analysisEngineInstance;
}

export function getPlayEngine(): StockfishEngine {
  if (!playEngineInstance) {
    playEngineInstance = new StockfishEngine();
  }
  return playEngineInstance;
}
