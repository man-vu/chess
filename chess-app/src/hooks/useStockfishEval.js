import { useEffect, useRef, useCallback, useState } from 'react';

const DEBOUNCE_MS = 300;
const MATE_SCORE = 10000;
const DEFAULT_MULTI_PV = 3;

const MAX_MULTI_PV = 20; // WASM Stockfish crashes above this

export default function useStockfishEval(fen, { multiPV = DEFAULT_MULTI_PV, depth: targetDepth } = {}) {
  // Cap MultiPV to prevent WASM crashes
  const safeMultiPV = Math.min(multiPV, MAX_MULTI_PV);
  // Use lower depth for high MultiPV to keep analysis responsive
  const analysisDepth = targetDepth || (safeMultiPV > 10 ? 10 : safeMultiPV > 5 ? 14 : 18);
  const workerRef = useRef(null);
  const debounceRef = useRef(null);
  const multiPVRef = useRef(multiPV);
  const [evalState, setEvalState] = useState({
    eval: null,
    depth: 0,
    bestLine: '',
    lines: [], // Array of { pv, eval, depth, mate, pvIndex }
    isReady: false,
  });

  // Track lines being built during analysis
  const linesRef = useRef(new Map());

  useEffect(() => {
    multiPVRef.current = safeMultiPV;
  }, [safeMultiPV]);

  useEffect(() => {
    const worker = new Worker(`${import.meta.env.BASE_URL}stockfish.js`);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data;
      if (typeof line !== 'string') return;

      if (line === 'readyok') {
        setEvalState((prev) => ({ ...prev, isReady: true }));
      }

      if (line.startsWith('info') && line.includes('score') && line.includes(' pv ')) {
        const parsed = parseInfoLine(line);
        if (parsed && parsed.depth >= 1) {
          const pvIdx = parsed.pvIndex || 1;
          linesRef.current.set(pvIdx, parsed);

          // Update state with all collected lines
          const allLines = Array.from(linesRef.current.entries())
            .sort(([a], [b]) => a - b)
            .map(([, v]) => v);

          setEvalState((prev) => ({
            ...prev,
            eval: allLines[0]?.eval ?? prev.eval,
            depth: allLines[0]?.depth ?? prev.depth,
            bestLine: allLines[0]?.pv ?? prev.bestLine,
            lines: allLines,
          }));
        }
      }
    };

    // Handle WASM crashes gracefully
    worker.onerror = () => {};

    worker.postMessage('uci');
    worker.postMessage(`setoption name MultiPV value ${safeMultiPV}`);
    worker.postMessage('isready');

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try { worker.postMessage('quit'); } catch {}
      worker.terminate();
      workerRef.current = null;
    };
  }, [safeMultiPV]);

  useEffect(() => {
    if (!fen || !evalState.isReady || !workerRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const worker = workerRef.current;
      if (!worker) return;

      // Clear previous lines when position changes
      linesRef.current.clear();

      worker.postMessage('stop');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${analysisDepth}`);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fen, evalState.isReady, analysisDepth]);

  const stopEval = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
    }
  }, []);

  return {
    eval: evalState.eval,
    depth: evalState.depth,
    bestLine: evalState.bestLine,
    lines: evalState.lines,
    isReady: evalState.isReady,
    stopEval,
  };
}

function parseInfoLine(line) {
  const depthMatch = line.match(/\bdepth (\d+)/);
  const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

  if (depth < 1) return null;

  let evalValue = null;
  let mate = null;

  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);

  if (mateMatch) {
    mate = parseInt(mateMatch[1], 10);
    evalValue = mate > 0 ? MATE_SCORE : -MATE_SCORE;
  } else if (cpMatch) {
    evalValue = parseInt(cpMatch[1], 10);
  }

  if (evalValue === null) return null;

  const pvMatch = line.match(/\bpv (.+)$/);
  const pv = pvMatch ? pvMatch[1].trim() : '';

  const multipvMatch = line.match(/\bmultipv (\d+)/);
  const pvIndex = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

  return { eval: evalValue, depth, pv, mate, pvIndex };
}
