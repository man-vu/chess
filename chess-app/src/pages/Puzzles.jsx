import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import Board from '../components/Board';
import Badge from '../components/common/Badge';
import { getDailyPuzzle, puzzles } from '../data/puzzles';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const OPPONENT_DELAY_MS = 500;

const STORAGE_KEYS = {
  solved: 'chess_puzzles_solved',
  attempted: 'chess_puzzles_attempted',
};

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uciToMove(uci) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

export default function Puzzles() {
  const [currentPuzzle, setCurrentPuzzle] = useState(() => getDailyPuzzle());
  const [game, setGame] = useState(() => new Chess(currentPuzzle.fen));
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hintSquare, setHintSquare] = useState(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Your turn');
  const [solvedIds, setSolvedIds] = useState(() => loadFromStorage(STORAGE_KEYS.solved));
  const [attemptedIds, setAttemptedIds] = useState(() => loadFromStorage(STORAGE_KEYS.attempted));
  const [successAnim, setSuccessAnim] = useState(false);
  const [puzzleListIndex, setPuzzleListIndex] = useState(() => {
    const daily = getDailyPuzzle();
    return puzzles.findIndex((p) => p.id === daily.id);
  });

  const gameRef = useRef(game);
  gameRef.current = game;
  const puzzleIndexRef = useRef(puzzleIndex);
  puzzleIndexRef.current = puzzleIndex;
  const solvedRef = useRef(solved);
  solvedRef.current = solved;
  const showingSolutionRef = useRef(showingSolution);
  showingSolutionRef.current = showingSolution;
  const currentPuzzleRef = useRef(currentPuzzle);
  currentPuzzleRef.current = currentPuzzle;
  const opponentTimeoutRef = useRef(null);

  // Track attempt on puzzle load
  useEffect(() => {
    setAttemptedIds((prev) => {
      if (prev.includes(currentPuzzle.id)) return prev;
      const next = [...prev, currentPuzzle.id];
      saveToStorage(STORAGE_KEYS.attempted, next);
      return next;
    });
  }, [currentPuzzle.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    };
  }, []);

  const playerMoveCount = Math.ceil(currentPuzzle.moves.length / 2);
  const currentPlayerMove = Math.floor(puzzleIndex / 2) + 1;

  const isPlayerTurn = useCallback(() => {
    return puzzleIndexRef.current % 2 === 0;
  }, []);

  const playOpponentMove = useCallback(() => {
    const puzzle = currentPuzzleRef.current;
    const idx = puzzleIndexRef.current;
    if (idx >= puzzle.moves.length) return;

    opponentTimeoutRef.current = setTimeout(() => {
      const g = gameRef.current;
      const moveUci = puzzle.moves[idx];
      const moveObj = uciToMove(moveUci);
      const result = g.move(moveObj);
      if (result) {
        const next = new Chess(g.fen());
        setGame(next);
        setLastMove({ from: moveObj.from, to: moveObj.to });
        const newIdx = idx + 1;
        setPuzzleIndex(newIdx);
        puzzleIndexRef.current = newIdx;

        if (newIdx >= puzzle.moves.length) {
          setSolved(true);
          solvedRef.current = true;
          setSuccessAnim(true);
          setStatusMessage('Correct!');
          setSolvedIds((prev) => {
            if (prev.includes(puzzle.id)) return prev;
            const updated = [...prev, puzzle.id];
            saveToStorage(STORAGE_KEYS.solved, updated);
            return updated;
          });
        } else {
          setStatusMessage('Your turn');
        }
      }
    }, OPPONENT_DELAY_MS);
  }, []);

  const showSolutionSequence = useCallback(() => {
    const puzzle = currentPuzzleRef.current;
    setShowingSolution(true);
    showingSolutionRef.current = true;
    setStatusMessage('Showing solution...');
    setSelectedSquare(null);
    setLegalMoves([]);
    setHintSquare(null);

    // Reset the board to initial position
    const g = new Chess(puzzle.fen);
    setGame(g);
    setPuzzleIndex(0);
    puzzleIndexRef.current = 0;

    let step = 0;
    const playNext = () => {
      if (step >= puzzle.moves.length) {
        setStatusMessage('Solution complete');
        return;
      }
      const moveUci = puzzle.moves[step];
      const moveObj = uciToMove(moveUci);
      const currentGame = new Chess(g.fen());
      const result = currentGame.move(moveObj);
      if (result) {
        g.move(moveObj);
        const nextGame = new Chess(g.fen());
        setGame(nextGame);
        setLastMove({ from: moveObj.from, to: moveObj.to });
        step++;
        setPuzzleIndex(step);
        puzzleIndexRef.current = step;
        if (step < puzzle.moves.length) {
          opponentTimeoutRef.current = setTimeout(playNext, 700);
        } else {
          setStatusMessage('Solution complete');
        }
      }
    };
    opponentTimeoutRef.current = setTimeout(playNext, 500);
  }, []);

  const loadPuzzle = useCallback((puzzle) => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    setCurrentPuzzle(puzzle);
    currentPuzzleRef.current = puzzle;
    setGame(new Chess(puzzle.fen));
    setPuzzleIndex(0);
    puzzleIndexRef.current = 0;
    setSolved(false);
    solvedRef.current = false;
    setFailed(false);
    setHintSquare(null);
    setShowingSolution(false);
    showingSolutionRef.current = false;
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setStatusMessage('Your turn');
    setSuccessAnim(false);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    const nextIdx = (puzzleListIndex + 1) % puzzles.length;
    setPuzzleListIndex(nextIdx);
    loadPuzzle(puzzles[nextIdx]);
  }, [puzzleListIndex, loadPuzzle]);

  const handleHint = useCallback(() => {
    const puzzle = currentPuzzleRef.current;
    const idx = puzzleIndexRef.current;
    if (idx >= puzzle.moves.length || solvedRef.current || showingSolutionRef.current) return;
    const moveUci = puzzle.moves[idx];
    setHintSquare(moveUci.slice(0, 2));
  }, []);

  const tryPlayerMove = useCallback((from, to) => {
    const g = gameRef.current;
    const puzzle = currentPuzzleRef.current;
    const idx = puzzleIndexRef.current;

    if (solvedRef.current || showingSolutionRef.current || g.isGameOver()) return;
    if (!isPlayerTurn()) return;
    if (idx >= puzzle.moves.length) return;

    const expectedUci = puzzle.moves[idx];
    const expected = uciToMove(expectedUci);

    // Check if the move matches the expected solution
    if (from === expected.from && to === expected.to) {
      const moveResult = g.move({ from, to, promotion: expected.promotion });
      if (moveResult) {
        const next = new Chess(g.fen());
        setGame(next);
        setLastMove({ from, to });
        setSelectedSquare(null);
        setLegalMoves([]);
        setHintSquare(null);
        setFailed(false);

        const newIdx = idx + 1;
        setPuzzleIndex(newIdx);
        puzzleIndexRef.current = newIdx;

        if (newIdx >= puzzle.moves.length) {
          // Puzzle complete
          setSolved(true);
          solvedRef.current = true;
          setSuccessAnim(true);
          setStatusMessage('Correct!');
          setSolvedIds((prev) => {
            if (prev.includes(puzzle.id)) return prev;
            const updated = [...prev, puzzle.id];
            saveToStorage(STORAGE_KEYS.solved, updated);
            return updated;
          });
        } else {
          // Opponent's turn
          setStatusMessage('Correct! Opponent playing...');
          playOpponentMove();
        }
      }
    } else {
      // Wrong move - attempt it to check if it is at least legal
      const testGame = new Chess(g.fen());
      const legalAttempt = testGame.move({ from, to });
      if (legalAttempt) {
        // It was legal but wrong - show briefly then undo
        setFailed(true);
        setStatusMessage('Incorrect! Try again');
        setSelectedSquare(null);
        setLegalMoves([]);
      } else {
        // Illegal move, just deselect
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  }, [isPlayerTurn, playOpponentMove]);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (solvedRef.current || showingSolutionRef.current || g.isGameOver()) return;
    if (!isPlayerTurn()) return;

    if (selectedSquare) {
      if (sq === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      if (legalMoves.includes(sq)) {
        tryPlayerMove(selectedSquare, sq);
        return;
      }
    }

    const piece = g.get(sq);
    const turn = g.turn();
    if (piece && piece.color === turn) {
      setSelectedSquare(sq);
      setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, isPlayerTurn, tryPlayerMove]);

  const handleDragMove = useCallback((from, to) => {
    const g = gameRef.current;
    if (solvedRef.current || showingSolutionRef.current || g.isGameOver()) return;
    if (!isPlayerTurn()) return;

    const piece = g.get(from);
    if (!piece || piece.color !== g.turn()) return;
    tryPlayerMove(from, to);
  }, [isPlayerTurn, tryPlayerMove]);

  // Build a modified game for the board that highlights the hint square
  // We use selectedSquare state for hint highlight
  const effectiveSelectedSquare = hintSquare || selectedSquare;

  const statusColor = solved
    ? colors.success
    : failed
      ? colors.error
      : showingSolution
        ? colors.info
        : colors.accent;

  return (
    <div style={{
      ...commonStyles.page,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <h2 style={{
          color: colors.text,
          margin: 0,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: '-0.01em',
        }}>
          Daily Puzzle
        </h2>
        <Badge text={`${currentPuzzle.rating}`} color={colors.warning} />
        {currentPuzzle.themes.map((theme) => (
          <Badge key={theme} text={theme} color={colors.info} />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        gap: spacing.lg,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {/* Board */}
        <div style={{ position: 'relative' }}>
          <Board
            game={game}
            selectedSquare={effectiveSelectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onDragMove={handleDragMove}
            flipped={false}
          />
          {/* Success animation overlay */}
          {successAnim && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(124, 179, 66, 0.15)',
                borderRadius: 4,
                pointerEvents: 'none',
                animation: 'puzzleSuccessFade 2s ease-out forwards',
              }}
            >
              <div style={{
                fontSize: 48,
                fontWeight: 800,
                color: colors.success,
                textShadow: '0 2px 12px rgba(124, 179, 66, 0.5)',
                animation: 'puzzleSuccessScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                Correct!
              </div>
            </div>
          )}
          <style>{`
            @keyframes puzzleSuccessFade {
              0% { opacity: 1; }
              70% { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes puzzleSuccessScale {
              0% { transform: scale(0.5); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: 260,
          minWidth: 220,
        }}>
          {/* Puzzle info card */}
          <div style={{
            ...commonStyles.card,
            padding: spacing.md,
          }}>
            <div style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: spacing.xs,
            }}>
              Puzzle Info
            </div>
            <div style={{
              color: colors.text,
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: spacing.sm,
            }}>
              {currentPuzzle.description}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              flexWrap: 'wrap',
            }}>
              <Badge text={`Rating: ${currentPuzzle.rating}`} color={colors.warning} />
            </div>
          </div>

          {/* Status message */}
          <div style={{
            ...commonStyles.card,
            padding: '12px 16px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 14,
            color: statusColor,
            borderColor: `${statusColor}30`,
            transition: `all ${transitions.fast}`,
          }}>
            {statusMessage}
          </div>

          {/* Progress indicator */}
          {!showingSolution && (
            <div style={{
              ...commonStyles.card,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                color: colors.textSecondary,
                fontSize: 13,
              }}>
                Progress
              </span>
              <span style={{
                color: colors.text,
                fontSize: 13,
                fontWeight: 600,
              }}>
                {solved
                  ? `${playerMoveCount} of ${playerMoveCount}`
                  : `Move ${currentPlayerMove} of ${playerMoveCount}`}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {!showingSolution && (
            <div style={{
              width: '100%',
              height: 6,
              backgroundColor: colors.bgDeep,
              borderRadius: borderRadius.full,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${solved ? 100 : ((puzzleIndex) / currentPuzzle.moves.length) * 100}%`,
                backgroundColor: solved ? colors.success : colors.accent,
                borderRadius: borderRadius.full,
                transition: `width ${transitions.base}`,
              }} />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {solved && (
              <button
                onClick={handleNextPuzzle}
                style={{
                  ...commonStyles.button,
                  width: '100%',
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
                }}
              >
                Next Puzzle
              </button>
            )}

            {!solved && !showingSolution && (
              <>
                <button
                  onClick={handleHint}
                  style={{
                    ...commonStyles.buttonSecondary,
                    width: '100%',
                    color: colors.warning,
                    borderColor: `${colors.warning}40`,
                  }}
                >
                  Hint
                </button>
                <button
                  onClick={showSolutionSequence}
                  style={{
                    ...commonStyles.buttonSecondary,
                    width: '100%',
                    color: colors.info,
                    borderColor: `${colors.info}40`,
                  }}
                >
                  Show Solution
                </button>
              </>
            )}

            {showingSolution && !solved && (
              <button
                onClick={handleNextPuzzle}
                style={{
                  ...commonStyles.buttonSecondary,
                  width: '100%',
                }}
              >
                Next Puzzle
              </button>
            )}

            <button
              onClick={() => loadPuzzle(currentPuzzle)}
              disabled={solved || showingSolution}
              style={{
                ...commonStyles.buttonSecondary,
                width: '100%',
                opacity: solved || showingSolution ? 0.4 : 1,
                cursor: solved || showingSolution ? 'not-allowed' : 'pointer',
              }}
            >
              Reset Puzzle
            </button>
          </div>

          {/* Stats card */}
          <div style={{
            ...commonStyles.card,
            padding: spacing.md,
            marginTop: spacing.xs,
          }}>
            <div style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: spacing.sm,
            }}>
              Your Stats
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  color: colors.success,
                  fontSize: 22,
                  fontWeight: 700,
                }}>
                  {solvedIds.length}
                </div>
                <div style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  Solved
                </div>
              </div>
              <div style={{
                width: 1,
                height: 32,
                backgroundColor: colors.border,
              }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: 700,
                }}>
                  {attemptedIds.length}
                </div>
                <div style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  Attempted
                </div>
              </div>
              <div style={{
                width: 1,
                height: 32,
                backgroundColor: colors.border,
              }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  color: colors.warning,
                  fontSize: 22,
                  fontWeight: 700,
                }}>
                  {attemptedIds.length > 0
                    ? `${Math.round((solvedIds.length / attemptedIds.length) * 100)}%`
                    : '0%'}
                </div>
                <div style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
