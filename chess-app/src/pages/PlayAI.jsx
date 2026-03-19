import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import EvalBar from '../components/EvalBar';
import useStockfish from '../hooks/useStockfish';
import useStockfishEval from '../hooks/useStockfishEval';
import AnalysisLines from '../components/AnalysisLines';
import usePremoves from '../hooks/usePremoves';
import useSoundEffects from '../hooks/useSoundEffects';
import useChessClock from '../hooks/useChessClock';
import useBoardTheme from '../hooks/useBoardTheme';
import ChessClock from '../components/ChessClock';
import { getOpeningName } from '../data/openings';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const DIFFICULTY = { Easy: 3, Medium: 10, Hard: 20 };
const DIFFICULTY_ELO = { Easy: 800, Medium: 1500, Hard: 2200 };

export default function PlayAI() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState('w');
  const [difficulty, setDifficulty] = useState('Medium');
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const skillLevel = DIFFICULTY[difficulty];
  const { isReady, getMove, stop } = useStockfish(skillLevel);
  const { currentUser, refreshUser } = useAuth();
  const { saveGame } = useGameContext();
  const navigate = useNavigate();
  const gameRef = useRef(game);
  gameRef.current = game;

  const {
    premoves, premoveSquares, premoveSelection,
    addPremove, setPremoveSelection, clearPremoves,
    executeNext, hasPremoves,
  } = usePremoves();

  const { playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion, playPremove } = useSoundEffects();
  const { boardTheme } = useBoardTheme();

  const [timeControl, setTimeControl] = useState('none'); // 'none' | 'bullet' | 'blitz' | 'rapid'
  const TIME_CONTROLS = { none: null, bullet: { time: 60000, inc: 0 }, blitz: { time: 300000, inc: 3000 }, rapid: { time: 600000, inc: 5000 } };
  const tc = TIME_CONTROLS[timeControl];
  const clock = useChessClock({ initialTime: tc?.time || 300000, increment: tc?.inc || 0, enabled: true });

  const openingName = getOpeningName(moveHistory);

  // Eval bar + analysis lines
  const [showLines, setShowLines] = useState(false);
  const evalResult = useStockfishEval(gameStarted ? game.fen() : null, { multiPV: showLines ? 3 : 1 });
  const evalFromWhite = evalResult.eval !== null
    ? (game.turn() === 'b' ? -evalResult.eval : evalResult.eval)
    : null;

  const handleGameEnd = useCallback((g) => {
    let result = 'draw';
    if (g.isCheckmate()) result = g.turn() === playerColor ? 'loss' : 'win';
    if (currentUser) {
      saveGame({ userId: currentUser.id, playerColor, opponentName: `Stockfish (${difficulty})`, opponentElo: DIFFICULTY_ELO[difficulty], result, moves: g.history(), pgn: g.pgn(), mode: 'ai', difficulty });
      refreshUser();
    }
    setGameOver(true);
    clearPremoves();
    clock.pauseClock();
  }, [currentUser, playerColor, difficulty, saveGame, refreshUser, clearPremoves, clock]);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) { setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`); handleGameEnd(g); }
    else if (g.isDraw()) {
      if (g.isStalemate()) setStatus('Draw by stalemate');
      else if (g.isThreefoldRepetition()) setStatus('Draw by repetition');
      else if (g.isInsufficientMaterial()) setStatus('Draw — insufficient material');
      else setStatus('Draw by 50-move rule');
      handleGameEnd(g);
    } else if (g.isCheck()) setStatus(g.turn() === 'w' ? 'White is in check!' : 'Black is in check!');
    else setStatus('');
  }, [handleGameEnd]);

  // ── Execute a player move and trigger Stockfish ───────────────────
  const executePlayerMove = useCallback((g, from, to, promotion) => {
    const move = g.move({ from, to, promotion });
    if (!move) return null;
    const history = g.history();
    const next = new Chess(g.fen());
    setGame(next);
    setLastMove({ from, to });
    setMoveHistory(history);
    setSelectedSquare(null);
    setLegalMoves([]);
    updateStatus(next);
    // Sound
    if (next.isCheckmate() || next.isDraw()) playGameOver();
    else if (next.isCheck()) playCheck();
    else if (move.flags.includes('k') || move.flags.includes('q')) playCastle();
    else if (move.flags.includes('p')) playPromotion();
    else if (move.captured) playCapture();
    else playMove();
    // Clock
    if (tc) clock.switchClock();
    return next;
  }, [updateStatus, playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion, tc, clock]);

  // ── Stockfish move + premove execution after AI responds ──────────
  const makeStockfishMove = useCallback(async (g) => {
    if (g.isGameOver() || !isReady) return;
    setThinking(true);
    try {
      const bestMove = await getMove(g.fen());
      const current = gameRef.current;
      if (current.fen() !== g.fen()) return;
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
      const move = current.move({ from, to, promotion });
      if (move) {
        const history = current.history();
        const next = new Chess(current.fen());
        setGame(next);
        setLastMove({ from, to });
        setMoveHistory(history);
        updateStatus(next);
        // Sound for AI move
        if (next.isCheckmate() || next.isDraw()) playGameOver();
        else if (next.isCheck()) playCheck();
        else if (move.captured) playCapture();
        else playMove();
        if (tc) clock.switchClock();

        // ── Auto-execute queued premoves ──
        if (!next.isGameOver()) {
          // Small delay so the AI move renders before premove fires
          setTimeout(() => {
            const pm = executeNext(next);
            if (pm) {
              const afterPremove = executePlayerMove(next, pm.from, pm.to, pm.promotion);
              if (afterPremove && !afterPremove.isGameOver()) {
                setTimeout(() => makeStockfishMove(afterPremove), 200);
              }
            }
          }, 80);
          return; // thinking will be cleared after premove chain
        }
      }
    } finally {
      setThinking(false);
    }
  }, [isReady, getMove, updateStatus, executeNext, executePlayerMove]);

  // ── Handle click: normal move OR premove ──────────────────────────
  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;

    const isMyTurn = g.turn() === playerColor && !thinking;

    // ── PREMOVE MODE: not my turn → queue premoves ──
    if (!isMyTurn) {
      if (premoveSelection) {
        // Second click → complete the premove
        if (premoveSelection !== sq) {
          addPremove(premoveSelection, sq);
        } else {
          setPremoveSelection(null); // deselect
        }
        return;
      }
      // First click → select piece for premove (any of player's pieces)
      const piece = g.get(sq);
      if (piece && piece.color === playerColor) {
        setPremoveSelection(sq);
      }
      return;
    }

    // ── NORMAL MODE: my turn ──
    if (selectedSquare) {
      const piece = g.get(selectedSquare);
      const isPromotion = piece && piece.type === 'p' && ((piece.color === 'w' && sq[1] === '8') || (piece.color === 'b' && sq[1] === '1'));
      if (isPromotion && legalMoves.includes(sq)) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      const next = executePlayerMove(g, selectedSquare, sq);
      if (next) {
        if (!next.isGameOver()) setTimeout(() => makeStockfishMove(next), 300);
        return;
      }
    }
    const piece = g.get(sq);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(sq);
      setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, playerColor, thinking, executePlayerMove, makeStockfishMove, premoveSelection, addPremove, setPremoveSelection]);

  // ── Handle drag: normal move OR premove ───────────────────────────
  const handleDragMove = useCallback((from, to) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const piece = g.get(from);
    if (!piece || piece.color !== playerColor) return;

    const isMyTurn = g.turn() === playerColor && !thinking;

    if (!isMyTurn) {
      // Queue as premove
      addPremove(from, to);
      return;
    }

    const isPromotion = piece.type === 'p' && ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));
    if (isPromotion) {
      setPendingPromotion({ from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    const next = executePlayerMove(g, from, to);
    if (next) {
      if (!next.isGameOver()) setTimeout(() => makeStockfishMove(next), 300);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [playerColor, thinking, executePlayerMove, makeStockfishMove, addPremove]);

  // ── Right-click clears premoves ───────────────────────────────────
  const handleRightClick = useCallback(() => {
    clearPremoves();
  }, [clearPremoves]);

  // ── Escape key clears premoves ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') clearPremoves();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearPremoves]);

  const handlePromotion = useCallback((promotionPiece) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const next = executePlayerMove(g, from, to, promotionPiece);
    if (next && !next.isGameOver()) {
      setTimeout(() => makeStockfishMove(next), 300);
    }
    setPendingPromotion(null);
  }, [pendingPromotion, executePlayerMove, makeStockfishMove]);

  const startGame = useCallback(() => {
    const g = new Chess();
    setGame(g); setSelectedSquare(null); setLegalMoves([]); setLastMove(null);
    setMoveHistory([]); setStatus(''); setThinking(false); setPendingPromotion(null);
    setGameStarted(true); setGameOver(false);
    clearPremoves();
    if (playerColor === 'b') setTimeout(() => makeStockfishMove(g), 300);
  }, [playerColor, makeStockfishMove, clearPremoves]);

  if (!gameStarted) {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <h1 style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: 800, letterSpacing: '-0.02em', animation: 'fadeIn 400ms ease' }}>
          Play vs Computer
        </h1>
        <p style={{ color: colors.textSecondary, marginBottom: spacing.xl, animation: 'fadeIn 400ms ease 100ms both' }}>
          Choose your side and difficulty
        </p>
        <div style={{ ...commonStyles.card, width: 400, maxWidth: '100%', boxShadow: shadows.lg, animation: 'fadeInScale 400ms ease 200ms both' }}>
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>Play as</label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {['w', 'b'].map((c) => (
                <button key={c} onClick={() => setPlayerColor(c)} style={{
                  ...commonStyles.button, flex: 1,
                  backgroundColor: playerColor === c ? colors.accent : 'transparent',
                  border: `2px solid ${playerColor === c ? colors.accent : colors.borderLight}`,
                  color: playerColor === c ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`,
                }}>
                  {c === 'w' ? 'White' : 'Black'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>Difficulty</label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {Object.keys(DIFFICULTY).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  ...commonStyles.button, flex: 1,
                  backgroundColor: difficulty === d ? colors.accent : 'transparent',
                  border: `2px solid ${difficulty === d ? colors.accent : colors.borderLight}`,
                  color: difficulty === d ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`,
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: spacing.xl }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>Time Control</label>
            <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
              {[['none', 'No Clock'], ['bullet', '1+0'], ['blitz', '5+3'], ['rapid', '10+5']].map(([key, label]) => (
                <button key={key} onClick={() => setTimeControl(key)} style={{
                  ...commonStyles.button, flex: 1,
                  backgroundColor: timeControl === key ? colors.accent : 'transparent',
                  border: `2px solid ${timeControl === key ? colors.accent : colors.borderLight}`,
                  color: timeControl === key ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`, fontSize: 13, padding: '8px 12px',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { if (tc) clock.resetClock(); startGame(); if (tc) { setTimeout(() => clock.startClock('w'), 100); } }} disabled={!isReady} style={{
            ...commonStyles.button, width: '100%', fontSize: 18, padding: '16px 24px',
            opacity: isReady ? 1 : 0.5,
            background: isReady ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})` : colors.bgHover,
            boxShadow: isReady ? shadows.md : 'none',
          }}>
            {isReady ? 'Start Game' : 'Loading Stockfish...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <h2 style={{ color: colors.text, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
          vs Stockfish ({difficulty})
        </h2>
        {openingName && (
          <span style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>{openingName}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <EvalBar evaluation={evalFromWhite} depth={evalResult.depth} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '8px 4px', fontSize: 14, fontWeight: 500, color: colors.textSecondary }}>
            {playerColor === 'w' ? `Stockfish (${difficulty})` : 'You'}
            {thinking && game.turn() !== playerColor && (
              <span style={{ color: colors.accent, fontStyle: 'italic', fontSize: 13, animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>
            )}
          </div>
          <Board
            game={game}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onDragMove={handleDragMove}
            onRightClick={handleRightClick}
            flipped={playerColor === 'b'}
            premoves={premoves}
            premoveSquares={premoveSquares}
            premoveSelection={premoveSelection}
            themeColors={boardTheme}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
            <span style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500 }}>
              {playerColor === 'w' ? 'You' : `Stockfish (${difficulty})`}
            </span>
            {hasPremoves && (
              <span style={{ color: '#a855f7', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {premoves.length} premove{premoves.length !== 1 ? 's' : ''} queued
                <button
                  onClick={clearPremoves}
                  style={{
                    background: 'none', border: 'none', color: '#a855f7',
                    cursor: 'pointer', fontSize: 14, padding: '0 4px', fontWeight: 700,
                  }}
                  title="Clear premoves (right-click or Esc)"
                >
                  x
                </button>
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {tc && (
            <ChessClock
              whiteTime={clock.whiteTime}
              blackTime={clock.blackTime}
              activeColor={clock.activeColor}
              isWhiteTimeout={clock.isWhiteTimeout}
              isBlackTimeout={clock.isBlackTimeout}
            />
          )}
          <MoveHistory history={moveHistory} />
          {status && (
            <div style={{
              backgroundColor: colors.bgCard,
              color: game.isGameOver() ? colors.warning : colors.accent,
              padding: '12px 16px',
              borderRadius: borderRadius.md,
              fontWeight: 600,
              textAlign: 'center',
              fontSize: 14,
              border: `1px solid ${game.isGameOver() ? `${colors.warning}30` : `${colors.accent}30`}`,
              animation: 'fadeIn 200ms ease',
            }}>
              {status}
            </div>
          )}
          {/* Analysis Lines Toggle */}
          <button
            onClick={() => setShowLines((s) => !s)}
            style={{
              ...commonStyles.buttonSecondary,
              fontSize: 12,
              padding: '6px 12px',
              color: showLines ? colors.accent : colors.textDark,
              borderColor: showLines ? `${colors.accent}40` : colors.borderLight,
            }}
          >
            {showLines ? '▼ Hide Analysis' : '▶ Show Analysis'}
          </button>
          {showLines && evalResult.lines.length > 0 && (
            <div style={{
              backgroundColor: colors.bgCard,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              border: `1px solid ${colors.border}`,
            }}>
              <AnalysisLines lines={evalResult.lines} fen={game.fen()} maxMoves={6} />
            </div>
          )}
          {gameOver && (
            <button onClick={startGame} style={{
              ...commonStyles.button,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            }}>
              New Game
            </button>
          )}
          {!gameOver && !thinking && game.turn() === playerColor && moveHistory.length > 0 && (
            <button onClick={() => {
              const g = gameRef.current;
              g.undo(); // undo AI move
              g.undo(); // undo player move
              const history = g.history();
              const next = new Chess(g.fen());
              setGame(next); setMoveHistory(history); setLastMove(null);
              setSelectedSquare(null); setLegalMoves([]); setStatus(''); clearPremoves();
            }} style={commonStyles.buttonSecondary}>Undo Move</button>
          )}
          <button onClick={() => { stop(); navigate('/play'); }} style={commonStyles.buttonSecondary}>Back</button>
        </div>
      </div>
      {pendingPromotion && <PromotionModal color={playerColor} onSelect={handlePromotion} />}
    </div>
  );
}
