import { useEffect, useRef, useCallback, useState } from 'react';

const DEBOUNCE_MS = 300;
const ANALYSIS_DEPTH = 16;
const MATE_SCORE = 10000;

export default function useStockfishEval(fen) {
  const workerRef = useRef(null);
  const debounceRef = useRef(null);
  const [evalState, setEvalState] = useState({
    eval: null,
    depth: 0,
    bestLine: '',
    isReady: false,
  });

  useEffect(() => {
    const worker = new Worker(`${import.meta.env.BASE_URL}stockfish.js`);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data;
      if (typeof line !== 'string') return;

      if (line === 'readyok') {
        setEvalState((prev) => ({ ...prev, isReady: true }));
      }

      if (line.startsWith('info') && line.includes('score')) {
        const parsed = parseInfoLine(line);
        if (parsed) {
          setEvalState((prev) => ({
            ...prev,
            eval: parsed.eval,
            depth: parsed.depth,
            bestLine: parsed.bestLine,
          }));
        }
      }
    };

    worker.postMessage('uci');
    worker.postMessage('setoption name MultiPV value 1');
    worker.postMessage('isready');

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      worker.postMessage('quit');
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!fen || !evalState.isReady || !workerRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const worker = workerRef.current;
      if (!worker) return;

      worker.postMessage('stop');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${ANALYSIS_DEPTH}`);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fen, evalState.isReady]);

  const stopEval = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
    }
  }, []);

  return {
    eval: evalState.eval,
    depth: evalState.depth,
    bestLine: evalState.bestLine,
    isReady: evalState.isReady,
    stopEval,
  };
}

function parseInfoLine(line) {
  const depthMatch = line.match(/\bdepth (\d+)/);
  const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

  // Skip very shallow depths to reduce noise
  if (depth < 1) return null;

  let evalValue = null;

  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);

  if (mateMatch) {
    const mateIn = parseInt(mateMatch[1], 10);
    // Positive = engine (side to move) mates, negative = engine gets mated
    // We normalize to White's perspective below via multipv/fen side,
    // but UCI scores are from side-to-move perspective.
    // The caller handles perspective via FEN's active color.
    evalValue = mateIn > 0 ? MATE_SCORE : -MATE_SCORE;
  } else if (cpMatch) {
    evalValue = parseInt(cpMatch[1], 10);
  }

  if (evalValue === null) return null;

  const pvMatch = line.match(/\bpv (.+)$/);
  const bestLine = pvMatch ? pvMatch[1].trim() : '';

  return { eval: evalValue, depth, bestLine };
}
