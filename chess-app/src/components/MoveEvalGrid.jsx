import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { colors, spacing, transitions, typography } from '../theme';

const MATE_SCORE = 10000;

/**
 * Extract the first move (SAN) from a UCI PV string for a given FEN.
 */
function firstMoveFromPV(fen, uciPv) {
  if (!uciPv || !fen) return null;
  const uci = uciPv.split(/\s+/)[0];
  if (!uci || uci.length < 4) return null;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/**
 * Format eval from side-to-move perspective to a display string.
 */
function formatEval(evalValue, mate) {
  if (mate !== null && mate !== undefined) {
    return mate > 0 ? `M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
  }
  if (evalValue === null || evalValue === undefined) return '--';
  const pawns = evalValue / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

/**
 * Get a color for an eval value (from side-to-move perspective).
 */
function evalColor(evalValue) {
  if (evalValue === null || evalValue === undefined) return colors.textDark;
  if (Math.abs(evalValue) >= MATE_SCORE) return evalValue > 0 ? '#22c55e' : '#ef4444';
  const cp = evalValue;
  if (cp >= 200) return '#22c55e';
  if (cp >= 50) return '#86efac';
  if (cp > -50) return colors.textSecondary;
  if (cp > -200) return '#fca5a5';
  return '#ef4444';
}

/**
 * Classify a move eval relative to the best move.
 */
function moveClassification(evalValue, bestEval) {
  if (evalValue === null || bestEval === null) return null;
  const diff = bestEval - evalValue; // diff in centipawns from best
  if (diff <= 10) return { label: 'Best', color: '#22c55e', bg: '#22c55e18' };
  if (diff <= 50) return { label: 'Good', color: '#86efac', bg: '#86efac12' };
  if (diff <= 100) return { label: 'OK', color: '#fbbf24', bg: '#fbbf2410' };
  if (diff <= 200) return { label: 'Inaccuracy', color: '#fb923c', bg: '#fb923c10' };
  if (diff <= 500) return { label: 'Mistake', color: '#f87171', bg: '#f8717110' };
  return { label: 'Blunder', color: '#ef4444', bg: '#ef444410' };
}

/**
 * MoveEvalGrid — Shows evaluation for every legal move in the position.
 *
 * Props:
 *  - lines: Array of { pv, eval, depth, mate, pvIndex } from useStockfishEval (with high MultiPV)
 *  - fen: Current position FEN
 *  - onMoveClick: Optional callback(san) when a move is clicked
 */
export default function MoveEvalGrid({ lines, fen, onMoveClick }) {
  const moves = useMemo(() => {
    if (!lines || lines.length === 0 || !fen) return [];
    const bestEval = lines[0]?.eval ?? null;
    return lines.map((line, idx) => {
      const san = firstMoveFromPV(fen, line.pv);
      if (!san) return null;
      const classification = moveClassification(line.eval, bestEval);
      return {
        san,
        eval: line.eval,
        mate: line.mate,
        depth: line.depth,
        evalDisplay: formatEval(line.eval, line.mate),
        color: evalColor(line.eval),
        classification,
        pvIndex: line.pvIndex || idx + 1,
        rank: idx + 1,
      };
    }).filter(Boolean);
  }, [lines, fen]);

  if (moves.length === 0) {
    return (
      <div style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic', padding: spacing.sm }}>
        Analyzing all moves...
      </div>
    );
  }

  const maxDepth = Math.max(...moves.map((m) => m.depth));

  return (
    <div className="move-eval-grid">
      {/* Header */}
      <div style={{
        display: 'flex', padding: '6px 10px', gap: 8,
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textDark, fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <div style={{ width: 28, textAlign: 'center' }}>#</div>
        <div style={{ width: 60 }}>Move</div>
        <div style={{ width: 56, textAlign: 'right' }}>Eval</div>
        <div style={{ width: 32, textAlign: 'right' }}>d</div>
        <div style={{ flex: 1, textAlign: 'right' }}>Class</div>
      </div>

      {/* Move rows */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {moves.map((move) => (
          <div
            key={move.san}
            onClick={() => onMoveClick?.(move.san)}
            style={{
              display: 'flex', alignItems: 'center', padding: '5px 10px', gap: 8,
              borderBottom: `1px solid ${colors.border}08`,
              backgroundColor: move.classification?.bg || 'transparent',
              cursor: onMoveClick ? 'pointer' : 'default',
              transition: `background-color ${transitions.fast}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}10`; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = move.classification?.bg || 'transparent'; }}
          >
            {/* Rank */}
            <div style={{
              width: 28, textAlign: 'center',
              color: move.rank <= 3 ? colors.accent : colors.textDark,
              fontSize: 11, fontWeight: move.rank <= 3 ? 700 : 400,
              fontFamily: typography.monoFamily,
            }}>
              {move.rank}
            </div>

            {/* Move SAN */}
            <div style={{
              width: 60, fontWeight: 600, fontSize: 13,
              fontFamily: typography.monoFamily,
              color: move.rank === 1 ? colors.accent : colors.text,
            }}>
              {move.san}
            </div>

            {/* Eval */}
            <div style={{
              width: 56, textAlign: 'right',
              fontWeight: 700, fontSize: 12,
              fontFamily: typography.monoFamily,
              color: move.color,
            }}>
              {move.evalDisplay}
            </div>

            {/* Depth */}
            <div style={{
              width: 32, textAlign: 'right',
              fontSize: 10, fontFamily: typography.monoFamily,
              color: move.depth >= maxDepth ? colors.textSecondary : colors.textDark,
            }}>
              {move.depth}
            </div>

            {/* Classification */}
            <div style={{ flex: 1, textAlign: 'right' }}>
              {move.classification && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: move.classification.color,
                  padding: '1px 6px',
                  borderRadius: 3,
                  backgroundColor: `${move.classification.color}15`,
                }}>
                  {move.classification.label}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with depth info */}
      <div style={{
        padding: '6px 10px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between',
        color: colors.textDark, fontSize: 10,
        fontFamily: typography.monoFamily,
      }}>
        <span>{moves.length} legal moves</span>
        <span>depth {maxDepth}</span>
      </div>
    </div>
  );
}
