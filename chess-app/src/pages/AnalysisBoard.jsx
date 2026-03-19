import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import Board from '../components/Board';
import EvalBar from '../components/EvalBar';
import useStockfishEval from '../hooks/useStockfishEval';
import AnalysisLines from '../components/AnalysisLines';
import MoveEvalGrid from '../components/MoveEvalGrid';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions, typography } from '../theme';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function AnalysisBoard() {
  // Core state
  const [mainLine, setMainLine] = useState([]); // Array of { fen, san, from, to }
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = start position, 1 = after first move, etc.
  const [variations, setVariations] = useState({}); // keyed by move index: { [parentIndex]: [{ fen, san, from, to, children: [] }] }
  const [startFen, setStartFen] = useState(START_FEN);

  // Board interaction state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [flipped, setFlipped] = useState(false);

  // PGN import/export
  const [pgnText, setPgnText] = useState('');
  const [importError, setImportError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Current FEN for evaluation
  const currentFen = useMemo(() => {
    if (currentIndex === 0) return startFen;
    return mainLine[currentIndex - 1]?.fen || startFen;
  }, [currentIndex, mainLine, startFen]);

  // Chess instance for current position
  const currentChess = useMemo(() => new Chess(currentFen), [currentFen]);

  // Stockfish evaluation with multiple lines
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [numLines, setNumLines] = useState(3);
  const [showMoveEvals, setShowMoveEvals] = useState(false);

  // Count legal moves for MultiPV when evaluating all moves
  const legalMoveCount = useMemo(() => currentChess.moves().length, [currentChess]);

  // Use high MultiPV when move eval mode is on, otherwise use user-selected line count
  const effectiveMultiPV = showMoveEvals ? Math.max(legalMoveCount, 1) : numLines;
  const { eval: rawEval, depth, bestLine, lines, isReady } = useStockfishEval(currentFen, { multiPV: effectiveMultiPV });

  // Normalize eval to White's perspective
  const evalFromWhite = useMemo(() => {
    if (rawEval === null) return null;
    return currentChess.turn() === 'b' ? -rawEval : rawEval;
  }, [rawEval, currentChess]);

  // Build a map of target square → eval for displaying on legal move squares
  // Keyed by "from:to" so we can filter by selected piece
  const moveEvalsRaw = useMemo(() => {
    if (!showMoveEvals || !lines || lines.length === 0 || !currentFen) return null;
    const map = new Map();
    for (const line of lines) {
      if (!line.pv) continue;
      const uci = line.pv.split(/\s+/)[0];
      if (!uci || uci.length < 4) continue;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const key = `${from}:${to}`;
      if (map.has(key)) continue;
      const cp = line.eval;
      const mate = line.mate;
      let display, color;
      if (mate !== null && mate !== undefined) {
        display = mate > 0 ? `M${Math.abs(mate)}` : `-M${Math.abs(mate)}`;
        color = mate > 0 ? '#22c55e' : '#ef4444';
      } else if (cp !== null && cp !== undefined) {
        const pawns = cp / 100;
        display = (pawns > 0 ? '+' : '') + pawns.toFixed(1);
        if (cp >= 50) color = '#22c55e';
        else if (cp >= -20) color = '#a3e635';
        else if (cp >= -100) color = '#fbbf24';
        else color = '#ef4444';
      } else continue;
      map.set(key, { display, color, from, to });
    }
    return map;
  }, [showMoveEvals, lines, currentFen]);

  // Filter moveEvalsRaw to only the selected piece's moves, keyed by target square
  const moveEvalsMap = useMemo(() => {
    if (!moveEvalsRaw || !selectedSquare) return null;
    const map = new Map();
    for (const [, entry] of moveEvalsRaw) {
      if (entry.from === selectedSquare) {
        map.set(entry.to, { display: entry.display, color: entry.color });
      }
    }
    return map.size > 0 ? map : null;
  }, [moveEvalsRaw, selectedSquare]);

  // Format eval for display
  const evalDisplay = useMemo(() => {
    if (evalFromWhite === null) return '--';
    if (Math.abs(evalFromWhite) >= 9000) return evalFromWhite > 0 ? 'M' : '-M';
    const pawns = evalFromWhite / 100;
    const sign = pawns > 0 ? '+' : '';
    return `${sign}${pawns.toFixed(1)}`;
  }, [evalFromWhite]);

  // Format best move from UCI to SAN
  const bestMoveDisplay = useMemo(() => {
    if (!bestLine) return '--';
    const uciMove = bestLine.split(' ')[0];
    if (!uciMove || uciMove.length < 4) return '--';
    try {
      const tempChess = new Chess(currentFen);
      const from = uciMove.slice(0, 2);
      const to = uciMove.slice(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
      const move = tempChess.move({ from, to, promotion });
      return move ? move.san : uciMove;
    } catch {
      return uciMove;
    }
  }, [bestLine, currentFen]);

  // Compute last move highlight from current position
  useEffect(() => {
    if (currentIndex > 0 && mainLine[currentIndex - 1]) {
      const m = mainLine[currentIndex - 1];
      setLastMove({ from: m.from, to: m.to });
    } else {
      setLastMove(null);
    }
  }, [currentIndex, mainLine]);

  // Load game from localStorage on mount
  useEffect(() => {
    const storedPgn = localStorage.getItem('chess_analysis_pgn');
    if (storedPgn) {
      importPgn(storedPgn);
      localStorage.removeItem('chess_analysis_pgn');
    }
  }, []);

  // Generate PGN from main line
  const currentPgn = useMemo(() => {
    if (mainLine.length === 0) return '';
    try {
      const chess = new Chess(startFen);
      for (const move of mainLine) {
        chess.move(move.san);
      }
      return chess.pgn();
    } catch {
      return mainLine.map((m, i) => {
        const prefix = i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : '';
        return prefix + m.san;
      }).join(' ');
    }
  }, [mainLine, startFen]);

  // Import PGN
  const importPgn = useCallback((pgn) => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const history = chess.history({ verbose: true });
      const newMainLine = [];
      const replay = new Chess();
      for (const move of history) {
        replay.move(move.san);
        newMainLine.push({
          fen: replay.fen(),
          san: move.san,
          from: move.from,
          to: move.to,
        });
      }
      setMainLine(newMainLine);
      setCurrentIndex(newMainLine.length);
      setVariations({});
      setStartFen(START_FEN);
      setImportError('');
      setPgnText(pgn);
    } catch (err) {
      setImportError('Invalid PGN. Please check and try again.');
    }
  }, []);

  // Make a move on the board (free play, both colors)
  const makeMove = useCallback((from, to, promotion) => {
    const chess = new Chess(currentFen);
    const move = chess.move({ from, to, promotion: promotion || undefined });
    if (!move) return false;

    const moveEntry = {
      fen: chess.fen(),
      san: move.san,
      from: move.from,
      to: move.to,
    };

    if (currentIndex < mainLine.length) {
      // We are not at the end of the main line
      if (mainLine[currentIndex]?.san === move.san) {
        // Same move as main line, just advance
        setCurrentIndex(currentIndex + 1);
      } else {
        // Different move, create a variation
        setVariations((prev) => {
          const existing = prev[currentIndex] || [];
          // Check if this variation already exists
          const existingVar = existing.find((v) => v.san === move.san);
          if (existingVar) return prev;
          return {
            ...prev,
            [currentIndex]: [...existing, moveEntry],
          };
        });
        // Stay at current position but show the variation was added
        // Jump into the variation move
        setMainLine((prev) => prev);
        setCurrentIndex(currentIndex);
      }
    } else {
      // At the end of the main line, extend it
      setMainLine((prev) => [...prev.slice(0, currentIndex), moveEntry]);
      setCurrentIndex(currentIndex + 1);
    }

    setSelectedSquare(null);
    setLegalMoves([]);
    return true;
  }, [currentFen, currentIndex, mainLine]);

  // Handle square click (free play, both colors)
  const handleSquareClick = useCallback((sq) => {
    const chess = new Chess(currentFen);

    if (selectedSquare && selectedSquare !== sq) {
      // If clicking a piece of the same color as the selected piece, switch selection
      const selectedPiece = chess.get(selectedSquare);
      const targetPiece = chess.get(sq);
      if (selectedPiece && targetPiece && selectedPiece.color === targetPiece.color) {
        setSelectedSquare(sq);
        setLegalMoves(chess.moves({ square: sq, verbose: true }).map((m) => m.to));
        return;
      }

      // Try to make the move
      if (selectedPiece) {
        const isPromotion = selectedPiece.type === 'p' &&
          ((selectedPiece.color === 'w' && sq[1] === '8') || (selectedPiece.color === 'b' && sq[1] === '1'));
        if (isPromotion && legalMoves.includes(sq)) {
          makeMove(selectedSquare, sq, 'q');
          return;
        }
      }
      if (makeMove(selectedSquare, sq)) return;
      // Move failed — deselect
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Select a piece (any color in analysis mode)
    const piece = chess.get(sq);
    if (piece) {
      setSelectedSquare(sq);
      setLegalMoves(chess.moves({ square: sq, verbose: true }).map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [currentFen, selectedSquare, legalMoves, makeMove]);

  // Handle drag move
  const handleDragMove = useCallback((from, to) => {
    const chess = new Chess(currentFen);
    const piece = chess.get(from);
    if (!piece) return;

    const isPromotion = piece.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));
    makeMove(from, to, isPromotion ? 'q' : undefined);
  }, [currentFen, makeMove]);

  // Navigation
  const goToStart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < mainLine.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [currentIndex, mainLine.length]);

  const goToEnd = useCallback(() => {
    setCurrentIndex(mainLine.length);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [mainLine.length]);

  const goToMove = useCallback((index) => {
    setCurrentIndex(index);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // Reset board
  const handleReset = useCallback(() => {
    setMainLine([]);
    setCurrentIndex(0);
    setVariations({});
    setStartFen(START_FEN);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setPgnText('');
    setImportError('');
  }, []);

  // Copy FEN
  const copyFen = useCallback(() => {
    navigator.clipboard.writeText(currentFen).then(() => {
      setCopyFeedback('FEN copied');
      setTimeout(() => setCopyFeedback(''), 1500);
    });
  }, [currentFen]);

  // Copy PGN
  const copyPgn = useCallback(() => {
    navigator.clipboard.writeText(currentPgn).then(() => {
      setCopyFeedback('PGN copied');
      setTimeout(() => setCopyFeedback(''), 1500);
    });
  }, [currentPgn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          goToStart();
          break;
        case 'End':
          e.preventDefault();
          goToEnd();
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setFlipped((f) => !f);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPrev, goToNext, goToStart, goToEnd]);

  // -- Styles --

  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    width: 280,
    flexShrink: 0,
  };

  const sectionStyle = {
    ...commonStyles.card,
    padding: spacing.md,
  };

  const sectionTitleStyle = {
    color: colors.textDark,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: spacing.xs,
  };

  const navBtnStyle = (disabled) => ({
    ...commonStyles.buttonSecondary,
    padding: '6px 14px',
    opacity: disabled ? 0.3 : 1,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    transition: `all ${transitions.fast}`,
    minWidth: 40,
    textAlign: 'center',
  });

  const smallBtnStyle = {
    ...commonStyles.buttonSecondary,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
  };

  return (
    <div style={{ ...commonStyles.page, maxWidth: 1400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{
        color: colors.text,
        marginBottom: spacing.md,
        fontWeight: 600,
        letterSpacing: '-0.01em',
      }}>
        Analysis Board
      </h2>

      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        {/* Eval Bar */}
        <EvalBar evaluation={evalFromWhite} depth={depth} />

        {/* Board + Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Board
            game={currentChess}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onDragMove={handleDragMove}
            onRightClick={() => { setSelectedSquare(null); setLegalMoves([]); }}
            flipped={flipped}
            premoves={[]}
            premoveSquares={new Set()}
            premoveSelection={null}
            moveEvals={moveEvalsMap}
          />

          {/* Navigation controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.xs,
            marginTop: spacing.md,
          }}>
            <button
              onClick={goToStart}
              disabled={currentIndex === 0}
              style={navBtnStyle(currentIndex === 0)}
              onMouseEnter={(e) => { if (currentIndex > 0) e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Go to start"
            >
              |&lt;
            </button>
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              style={navBtnStyle(currentIndex === 0)}
              onMouseEnter={(e) => { if (currentIndex > 0) e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Previous move"
            >
              &lt;
            </button>
            <span style={{
              color: colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
              padding: '0 10px',
              fontWeight: 500,
              fontFamily: typography.monoFamily,
            }}>
              {currentIndex} / {mainLine.length}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex >= mainLine.length}
              style={navBtnStyle(currentIndex >= mainLine.length)}
              onMouseEnter={(e) => { if (currentIndex < mainLine.length) e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Next move"
            >
              &gt;
            </button>
            <button
              onClick={goToEnd}
              disabled={currentIndex >= mainLine.length}
              style={navBtnStyle(currentIndex >= mainLine.length)}
              onMouseEnter={(e) => { if (currentIndex < mainLine.length) e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Go to end"
            >
              &gt;|
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={sidebarStyle}>
          {/* Move tree */}
          <div style={{ ...sectionStyle, maxHeight: 240, overflowY: 'auto' }}>
            <div style={sectionTitleStyle}>Moves</div>
            {mainLine.length === 0 ? (
              <div style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                Play a move to begin analysis
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {mainLine.map((move, i) => {
                  const moveNum = Math.floor(i / 2) + 1;
                  const isWhiteMove = i % 2 === 0;
                  const isActive = currentIndex === i + 1;
                  const hasVariation = variations[i + 1] && variations[i + 1].length > 0;
                  return (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {isWhiteMove && (
                        <span style={{
                          color: colors.textDark,
                          fontSize: 12,
                          marginRight: 2,
                          fontFamily: typography.monoFamily,
                        }}>
                          {moveNum}.
                        </span>
                      )}
                      <span
                        onClick={() => goToMove(i + 1)}
                        style={{
                          display: 'inline-block',
                          padding: '2px 5px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontFamily: typography.monoFamily,
                          backgroundColor: isActive ? colors.accent : 'transparent',
                          color: isActive ? colors.white : colors.textSecondary,
                          fontWeight: isActive ? 600 : 400,
                          transition: `all ${transitions.fast}`,
                          borderBottom: hasVariation ? `2px solid ${colors.info}` : 'none',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {move.san}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Variations at current position */}
            {variations[currentIndex] && variations[currentIndex].length > 0 && (
              <div style={{ marginTop: spacing.xs, paddingTop: spacing.xs, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ color: colors.info, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  Variations from here:
                </div>
                {variations[currentIndex].map((v, vi) => (
                  <span
                    key={vi}
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      marginRight: 4,
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: typography.monoFamily,
                      backgroundColor: colors.bgHover,
                      color: colors.info,
                      cursor: 'default',
                    }}
                  >
                    {v.san}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Eval display */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Evaluation</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm }}>
              <span style={{
                color: evalFromWhite !== null && evalFromWhite > 0 ? colors.text : evalFromWhite !== null && evalFromWhite < 0 ? colors.textSecondary : colors.textMuted,
                fontSize: 22,
                fontWeight: 700,
                fontFamily: typography.monoFamily,
              }}>
                {evalDisplay}
              </span>
              {depth > 0 && (
                <span style={{
                  color: colors.textDark,
                  fontSize: 12,
                  fontFamily: typography.monoFamily,
                }}>
                  depth {depth}
                </span>
              )}
            </div>
          </div>

          {/* Engine Lines */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <div style={sectionTitleStyle}>Engine Lines</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setShowAnalysis((s) => !s)}
                  style={{
                    ...smallBtnStyle, padding: '2px 8px', fontSize: 10,
                    color: showAnalysis ? colors.accent : colors.textDark,
                    borderColor: showAnalysis ? `${colors.accent}40` : colors.borderLight,
                  }}
                >
                  {showAnalysis ? 'ON' : 'OFF'}
                </button>
                {showAnalysis && (
                  <select
                    value={numLines}
                    onChange={(e) => setNumLines(parseInt(e.target.value, 10))}
                    style={{
                      backgroundColor: colors.bgInput,
                      color: colors.textSecondary,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: 4,
                      padding: '2px 4px',
                      fontSize: 11,
                      fontFamily: typography.monoFamily,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={1}>1 line</option>
                    <option value={2}>2 lines</option>
                    <option value={3}>3 lines</option>
                    <option value={5}>5 lines</option>
                  </select>
                )}
              </div>
            </div>
            {showAnalysis ? (
              <AnalysisLines lines={lines} fen={currentFen} maxMoves={10} />
            ) : (
              <div style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>Analysis paused</div>
            )}
          </div>

          {/* Move Evaluations — evaluate every legal move */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <div style={sectionTitleStyle}>Move Evaluations</div>
              <button
                onClick={() => setShowMoveEvals((s) => !s)}
                style={{
                  ...smallBtnStyle, padding: '2px 8px', fontSize: 10,
                  color: showMoveEvals ? colors.accent : colors.textDark,
                  borderColor: showMoveEvals ? `${colors.accent}40` : colors.borderLight,
                }}
              >
                {showMoveEvals ? 'ON' : 'OFF'}
              </button>
            </div>
            {showMoveEvals ? (
              <MoveEvalGrid
                lines={lines}
                fen={currentFen}
              />
            ) : (
              <div style={{ color: colors.textMuted, fontSize: 12 }}>
                Enable to see evaluation for all {legalMoveCount} legal moves
              </div>
            )}
          </div>

          {/* FEN */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={sectionTitleStyle}>FEN</div>
              <button
                onClick={copyFen}
                style={{
                  ...smallBtnStyle,
                  padding: '3px 8px',
                  fontSize: 11,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Copy
              </button>
            </div>
            <div style={{
              color: colors.textSecondary,
              fontSize: 11,
              fontFamily: typography.monoFamily,
              wordBreak: 'break-all',
              lineHeight: 1.5,
              marginTop: 4,
              userSelect: 'all',
            }}>
              {currentFen}
            </div>
          </div>

          {/* PGN import/export */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <div style={sectionTitleStyle}>PGN</div>
              <button
                onClick={copyPgn}
                disabled={mainLine.length === 0}
                style={{
                  ...smallBtnStyle,
                  padding: '3px 8px',
                  fontSize: 11,
                  opacity: mainLine.length === 0 ? 0.3 : 1,
                }}
                onMouseEnter={(e) => { if (mainLine.length > 0) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Copy PGN
              </button>
            </div>
            <textarea
              value={pgnText}
              onChange={(e) => { setPgnText(e.target.value); setImportError(''); }}
              placeholder="Paste PGN here to import..."
              rows={4}
              style={{
                ...commonStyles.input,
                resize: 'vertical',
                fontSize: 12,
                fontFamily: typography.monoFamily,
                minHeight: 60,
              }}
              aria-label="PGN input"
            />
            {importError && (
              <div style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{importError}</div>
            )}
            <button
              onClick={() => importPgn(pgnText)}
              disabled={!pgnText.trim()}
              style={{
                ...commonStyles.button,
                width: '100%',
                marginTop: spacing.xs,
                padding: '8px 16px',
                fontSize: 13,
                opacity: pgnText.trim() ? 1 : 0.4,
              }}
            >
              Import PGN
            </button>
          </div>

          {/* Control buttons */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <button
              onClick={() => setFlipped((f) => !f)}
              style={{ ...commonStyles.buttonSecondary, flex: 1, padding: '8px 12px', fontSize: 13 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Flip Board
            </button>
            <button
              onClick={handleReset}
              style={{ ...commonStyles.buttonSecondary, flex: 1, padding: '8px 12px', fontSize: 13, color: colors.error, borderColor: `${colors.error}40` }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${colors.error}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Reset
            </button>
          </div>

          {/* Copy feedback toast */}
          {copyFeedback && (
            <div style={{
              backgroundColor: colors.accent,
              color: colors.white,
              padding: '6px 12px',
              borderRadius: borderRadius.md,
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              animation: 'fadeIn 200ms ease',
            }}>
              {copyFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
