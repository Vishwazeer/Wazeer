// Stockfish worker wrapper using ASM.js fallback
// This avoids WASM initialization issues
var Module = {
  listener: function(line) {
    postMessage(line);
  }
};

importScripts('/stockfish/stockfish-asm.js');
