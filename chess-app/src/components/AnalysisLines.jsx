import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { colors, spacing, transitions, typography } from '../theme';

/**
 * Convert UCI PV string (e.g., "e2e4 e7e5 g1f3") to SAN moves with move numbers.
 * Returns array of { san, moveNumber, isWhite } objects.
 */
function uciToSan(fen, uciPv) {
  if (!uciPv || !fen) return [];
  const moves = uciPv.split(/\s+/).filter(Boolean);
  const result = [];
  try {
    const chess = new Chess(fen);
    for (const uci of moves) {
      if (uci.length < 4) break;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;
      const isWhite = chess.turn() === 'w';
      const fullMoveNumber = chess.moveNumber();
      const move = chess.move({ from, to, promotion });
      if (!move) break;
      result.push({ san: move.san, moveNumber: fullMoveNumber, isWhite });
    }
  } catch {
    // If chess.js fails, return what we have
  }
  return result;
}

/**
 * Format eval score for display.
 */
function formatEval(evalValue, mate, fromSideToMove) {
  // evalValue is from side-to-move perspective
  if (mate !== null && mate !== undefined) {
    const m = fromSideToMove ? mate : -mate;
    return m > 0 ? `M${Math.abs(m)}` : `-M${Math.abs(m)}`;
  }
  if (evalValue === null || evalValue === undefined) return '--';
  const cp = fromSideToMove ? evalValue : -evalValue;
  const pawns = cp / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

/**
 * AnalysisLines — Displays Stockfish analysis lines with eval scores.
 *
 * Props:
 *  - lines: Array of { pv, eval, depth, mate, pvIndex } from useStockfishEval
 *  - fen: Current position FEN (needed for UCI→SAN conversion)
 *  - maxMoves: How many moves deep to show per line (default 8)
 *  - onPlayLine: Optional callback (lineIndex) when user clicks a line to play it
 */
export default function AnalysisLines({ lines, fen, maxMoves = 8, onPlayLine }) {
  const parsedLines = useMemo(() => {
    if (!lines || lines.length === 0 || !fen) return [];
    return lines.map((line, idx) => {
      const sanMoves = uciToSan(fen, line.pv);
      return {
        ...line,
        sanMoves: sanMoves.slice(0, maxMoves),
        evalDisplay: formatEval(line.eval, line.mate, true),
        idx,
      };
    });
  }, [lines, fen, maxMoves]);

  if (parsedLines.length === 0) {
    return (
      <div style={{
        color: colors.textMuted, fontSize: 13, fontStyle: 'italic',
        padding: spacing.sm,
      }}>
        Analyzing position...
      </div>
    );
  }

  return (
    <div className="analysis-lines" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {parsedLines.map((line) => {
        const isPositive = line.eval !== null && line.eval >= 0;
        return (
          <div
            key={line.pvIndex || line.idx}
            onClick={() => onPlayLine?.(line.idx)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.sm,
              padding: '6px 10px',
              borderRadius: 6,
              backgroundColor: line.pvIndex === 1 ? `${colors.accent}08` : 'transparent',
              cursor: onPlayLine ? 'pointer' : 'default',
              transition: `background-color ${transitions.fast}`,
              borderLeft: line.pvIndex === 1 ? `3px solid ${colors.accent}` : '3px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.accent}12`; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = line.pvIndex === 1 ? `${colors.accent}08` : 'transparent'; }}
          >
            {/* Eval badge */}
            <div style={{
              minWidth: 52,
              textAlign: 'center',
              padding: '3px 6px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: typography.monoFamily,
              backgroundColor: isPositive ? `${colors.text}12` : `${colors.textDark}12`,
              color: isPositive ? colors.text : colors.textSecondary,
              flexShrink: 0,
            }}>
              {line.evalDisplay}
            </div>

            {/* Move sequence */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              lineHeight: 1.6,
            }}>
              {line.sanMoves.map((m, mi) => (
                <span key={mi} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {m.isWhite && (
                    <span style={{
                      color: colors.textDark,
                      fontSize: 11,
                      marginRight: 1,
                      fontFamily: typography.monoFamily,
                    }}>
                      {m.moveNumber}.
                    </span>
                  )}
                  {!m.isWhite && mi === 0 && (
                    <span style={{
                      color: colors.textDark,
                      fontSize: 11,
                      marginRight: 1,
                      fontFamily: typography.monoFamily,
                    }}>
                      {m.moveNumber}...
                    </span>
                  )}
                  <span style={{
                    fontSize: 12,
                    fontFamily: typography.monoFamily,
                    color: mi === 0 ? colors.accent : colors.textSecondary,
                    fontWeight: mi === 0 ? 600 : 400,
                    padding: '0 2px',
                  }}>
                    {m.san}
                  </span>
                </span>
              ))}
              {line.depth > 0 && (
                <span style={{
                  color: colors.textDark,
                  fontSize: 10,
                  marginLeft: 4,
                  fontFamily: typography.monoFamily,
                }}>
                  d{line.depth}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
