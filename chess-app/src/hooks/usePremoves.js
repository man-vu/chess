import { useState, useCallback, useRef } from 'react';

/**
 * Multiple premove queue system (chess.com style).
 *
 * How it works:
 *  1. When it's NOT the player's turn, clicks/drags are intercepted and
 *     stored as premoves instead of being rejected.
 *  2. Each premove is { from, to, promotion? }.  The queue is ordered.
 *  3. Premoved squares get special highlighting on the board so the player
 *     can see what they queued.
 *  4. Right-click or pressing Escape clears the entire premove queue.
 *  5. When the opponent's move arrives and it becomes the player's turn,
 *     the caller invokes `executeNext(game)`.  The hook pops the first
 *     premove, validates it against the *current* position (it may now be
 *     illegal), and returns the move to execute.  If invalid the queue is
 *     flushed — chess.com also cancels all premoves when the first one
 *     is illegal.
 *  6. After execution the caller can call `executeNext` again in a loop
 *     until it returns null (no more premoves or it's opponent's turn
 *     again — the caller decides).
 *
 * Visual data exported:
 *  - `premoves`          — the queue array (for arrow drawing)
 *  - `premoveSquares`    — Set<string> of all squares involved
 *  - `premoveSelection`  — the "from" square currently being built
 */

export default function usePremoves() {
  const [queue, setQueue] = useState([]);
  const [selection, setSelection] = useState(null); // square selected for next premove
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // ── Add a premove ──────────────────────────────────────────────────
  const addPremove = useCallback((from, to, promotion) => {
    setQueue(prev => {
      const next = [...prev, { from, to, promotion: promotion || undefined }];
      return next;
    });
    setSelection(null);
  }, []);

  // ── Set the "from" selection for the next premove ─────────────────
  const setPremoveSelection = useCallback((sq) => {
    setSelection(sq);
  }, []);

  // ── Clear everything ──────────────────────────────────────────────
  const clearPremoves = useCallback(() => {
    setQueue([]);
    setSelection(null);
  }, []);

  // ── Pop and validate the next premove against current game ────────
  //    Returns { from, to, promotion } if valid, null otherwise.
  //    On invalid → flushes entire queue (chess.com behaviour).
  const executeNext = useCallback((game) => {
    const q = queueRef.current;
    if (q.length === 0) return null;

    const premove = q[0];
    // Remove the first premove regardless of validity
    setQueue(prev => prev.slice(1));

    // Validate: is this move legal in the current position?
    const moves = game.moves({ verbose: true });
    const match = moves.find(m =>
      m.from === premove.from &&
      m.to === premove.to &&
      (!premove.promotion || m.promotion === premove.promotion)
    );

    if (match) {
      return {
        from: premove.from,
        to: premove.to,
        promotion: match.promotion || premove.promotion,
      };
    }

    // Invalid premove → flush remaining queue
    setQueue([]);
    setSelection(null);
    return null;
  }, []);

  // ── Derived visual state ──────────────────────────────────────────
  const premoveSquares = new Set();
  for (const pm of queue) {
    premoveSquares.add(pm.from);
    premoveSquares.add(pm.to);
  }
  if (selection) premoveSquares.add(selection);

  return {
    premoves: queue,
    premoveSquares,
    premoveSelection: selection,
    addPremove,
    setPremoveSelection,
    clearPremoves,
    executeNext,
    hasPremoves: queue.length > 0,
  };
}
