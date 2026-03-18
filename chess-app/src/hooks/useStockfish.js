import { useEffect, useRef, useCallback, useState } from 'react';

export default function useStockfish(skillLevel = 10) {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const onMoveRef = useRef(null);

  useEffect(() => {
    const worker = new Worker(`${import.meta.env.BASE_URL}stockfish.js`);
    engineRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data;
      if (line === 'readyok') {
        setIsReady(true);
      }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && onMoveRef.current) {
          onMoveRef.current(move);
        }
      }
    };

    worker.postMessage('uci');
    worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
    worker.postMessage('isready');

    return () => {
      worker.postMessage('quit');
      worker.terminate();
    };
  }, [skillLevel]);

  const getMove = useCallback((fen) => {
    return new Promise((resolve) => {
      onMoveRef.current = resolve;
      engineRef.current.postMessage(`position fen ${fen}`);
      engineRef.current.postMessage('go depth 12');
    });
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.postMessage('stop');
    }
  }, []);

  return { isReady, getMove, stop };
}
