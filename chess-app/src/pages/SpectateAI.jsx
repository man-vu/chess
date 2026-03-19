import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import EvalBar from '../components/EvalBar';
import useStockfishEval from '../hooks/useStockfishEval';
import AnalysisLines from '../components/AnalysisLines';
import useSoundEffects from '../hooks/useSoundEffects';
import useBoardTheme from '../hooks/useBoardTheme';
import { getOpeningName } from '../data/openings';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const DIFFICULTY = { Easy: 3, Medium: 10, Hard: 20 };
const DIFFICULTY_ELO = { Easy: '~800', Medium: '~1500', Hard: '~2200' };
const SPEED_OPTIONS = [
  { label: '0.5s', value: 500 },
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
];

function useStockfishEngine(skillLevel) {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const onMoveRef = useRef(null);

  useEffect(() => {
    const worker = new Worker(`${import.meta.env.BASE_URL}stockfish.js`);
    engineRef.current = worker;

    worker.onmessage = (e) => {
      const line = e.data;
      if (line === 'readyok') setIsReady(true);
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && onMoveRef.current) onMoveRef.current(move);
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
    if (engineRef.current) engineRef.current.postMessage('stop');
  }, []);

  return { isReady, getMove, stop };
}

export default function SpectateAI() {
  const [whiteDifficulty, setWhiteDifficulty] = useState('Medium');
  const [blackDifficulty, setBlackDifficulty] = useState('Hard');
  const [speed, setSpeed] = useState(1000);
  const [gameStarted, setGameStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState(null); // 'white' | 'black' | null
  const [moveCount, setMoveCount] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const navigate = useNavigate();
  const gameRef = useRef(game);
  gameRef.current = game;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const gameOverRef = useRef(false);

  const whiteEngine = useStockfishEngine(DIFFICULTY[whiteDifficulty]);
  const blackEngine = useStockfishEngine(DIFFICULTY[blackDifficulty]);

  const { playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion } = useSoundEffects();
  const { boardTheme } = useBoardTheme();
  const openingName = getOpeningName(moveHistory);

  const [showLines, setShowLines] = useState(false);
  const evalResult = useStockfishEval(gameStarted ? game.fen() : null, { multiPV: showLines ? 3 : 1 });
  const evalFromWhite = evalResult.eval !== null
    ? (game.turn() === 'b' ? -evalResult.eval : evalResult.eval)
    : null;

  const bothReady = whiteEngine.isReady && blackEngine.isReady;

  const playSoundForMove = useCallback((next, move) => {
    if (next.isCheckmate() || next.isDraw()) playGameOver();
    else if (next.isCheck()) playCheck();
    else if (move.flags?.includes('k') || move.flags?.includes('q')) playCastle();
    else if (move.flags?.includes('p')) playPromotion();
    else if (move.captured) playCapture();
    else playMove();
  }, [playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion]);

  const makeEngineMove = useCallback(async (g) => {
    if (g.isGameOver() || gameOverRef.current) return;

    // Wait while paused
    while (pausedRef.current) {
      await new Promise((r) => setTimeout(r, 200));
      if (gameOverRef.current) return;
    }

    const isWhiteTurn = g.turn() === 'w';
    const engine = isWhiteTurn ? whiteEngine : blackEngine;
    setThinking(isWhiteTurn ? 'white' : 'black');

    try {
      const bestMove = await engine.getMove(g.fen());
      const current = gameRef.current;
      // Ensure game state hasn't changed (e.g. reset)
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
        setMoveCount((c) => c + 1);
        playSoundForMove(next, move);

        if (next.isGameOver()) {
          gameOverRef.current = true;
          if (next.isCheckmate()) setStatus(`Checkmate! ${next.turn() === 'w' ? 'Black' : 'White'} wins!`);
          else if (next.isStalemate()) setStatus('Draw by stalemate');
          else if (next.isThreefoldRepetition()) setStatus('Draw by repetition');
          else if (next.isInsufficientMaterial()) setStatus('Draw — insufficient material');
          else setStatus('Draw by 50-move rule');
          setThinking(null);
          return;
        }

        if (next.isCheck()) setStatus(`${next.turn() === 'w' ? 'White' : 'Black'} is in check!`);
        else setStatus('');

        setThinking(null);
        // Delay before next engine move
        setTimeout(() => makeEngineMove(next), speedRef.current);
      }
    } catch {
      setThinking(null);
    }
  }, [whiteEngine, blackEngine, playSoundForMove]);

  const startGame = useCallback(() => {
    const g = new Chess();
    setGame(g);
    setLastMove(null);
    setMoveHistory([]);
    setStatus('');
    setThinking(null);
    setMoveCount(0);
    setPaused(false);
    setGameStarted(true);
    gameOverRef.current = false;
    setTimeout(() => makeEngineMove(g), 500);
  }, [makeEngineMove]);

  const resetGame = useCallback(() => {
    gameOverRef.current = true;
    whiteEngine.stop();
    blackEngine.stop();
    setGameStarted(false);
    setPaused(false);
    setThinking(null);
    setStatus('');
  }, [whiteEngine, blackEngine]);

  // Setup screen
  if (!gameStarted) {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
        <h1 style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: 800, letterSpacing: '-0.02em' }}>
          AI vs AI
        </h1>
        <p style={{ color: colors.textSecondary, marginBottom: spacing.xl }}>
          Watch two Stockfish engines battle it out
        </p>
        <div style={{ ...commonStyles.card, width: 460, maxWidth: '100%', boxShadow: shadows.lg }}>
          {/* White Engine */}
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>
              White Engine
            </label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {Object.keys(DIFFICULTY).map((d) => (
                <button key={d} onClick={() => setWhiteDifficulty(d)} style={{
                  ...commonStyles.button, flex: 1,
                  backgroundColor: whiteDifficulty === d ? colors.accent : 'transparent',
                  border: `2px solid ${whiteDifficulty === d ? colors.accent : colors.borderLight}`,
                  color: whiteDifficulty === d ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`,
                }}>
                  {d}
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{DIFFICULTY_ELO[d]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Black Engine */}
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>
              Black Engine
            </label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {Object.keys(DIFFICULTY).map((d) => (
                <button key={d} onClick={() => setBlackDifficulty(d)} style={{
                  ...commonStyles.button, flex: 1,
                  backgroundColor: blackDifficulty === d ? colors.accent : 'transparent',
                  border: `2px solid ${blackDifficulty === d ? colors.accent : colors.borderLight}`,
                  color: blackDifficulty === d ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`,
                }}>
                  {d}
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{DIFFICULTY_ELO[d]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Move Speed */}
          <div style={{ marginBottom: spacing.xl }}>
            <label style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: spacing.sm }}>
              Move Speed
            </label>
            <div style={{ display: 'flex', gap: spacing.xs }}>
              {SPEED_OPTIONS.map(({ label, value }) => (
                <button key={value} onClick={() => setSpeed(value)} style={{
                  ...commonStyles.button, flex: 1, fontSize: 13, padding: '8px 12px',
                  backgroundColor: speed === value ? colors.accent : 'transparent',
                  border: `2px solid ${speed === value ? colors.accent : colors.borderLight}`,
                  color: speed === value ? colors.white : colors.textSecondary,
                  transition: `all ${transitions.fast}`,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} disabled={!bothReady} style={{
            ...commonStyles.button, width: '100%', fontSize: 18, padding: '16px 24px',
            opacity: bothReady ? 1 : 0.5,
            background: bothReady ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})` : colors.bgHover,
            boxShadow: bothReady ? shadows.md : 'none',
          }}>
            {bothReady ? 'Start Match' : 'Loading Engines...'}
          </button>
        </div>
        <button onClick={() => navigate('/play')} style={{ ...commonStyles.buttonSecondary, marginTop: spacing.md }}>Back</button>
      </div>
    );
  }

  // Game view
  const isGameOver = game.isGameOver() || gameOverRef.current;

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <h2 style={{ color: colors.text, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
          AI vs AI
        </h2>
        <span style={{ color: colors.textMuted, fontSize: 13 }}>
          {whiteDifficulty} vs {blackDifficulty}
        </span>
        {openingName && <span style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>· {openingName}</span>}
      </div>

      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <EvalBar evaluation={evalFromWhite} depth={evalResult.depth} />
        <div>
          {/* Top player label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: colors.textSecondary }}>
              {flipped ? `White — Stockfish (${whiteDifficulty})` : `Black — Stockfish (${blackDifficulty})`}
            </span>
            {thinking === (flipped ? 'white' : 'black') && (
              <span style={{ color: colors.accent, fontStyle: 'italic', fontSize: 13, animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>
            )}
          </div>
          <Board
            game={game}
            selectedSquare={null}
            legalMoves={[]}
            lastMove={lastMove}
            onSquareClick={() => {}}
            flipped={flipped}
            themeColors={boardTheme}
          />
          {/* Bottom player label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>
            <span style={{ color: colors.textSecondary }}>
              {flipped ? `Black — Stockfish (${blackDifficulty})` : `White — Stockfish (${whiteDifficulty})`}
            </span>
            {thinking === (flipped ? 'black' : 'white') && (
              <span style={{ color: colors.accent, fontStyle: 'italic', fontSize: 13, animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, minWidth: 200 }}>
          <MoveHistory history={moveHistory} />

          {/* Move counter */}
          <div style={{
            backgroundColor: colors.bgCard, padding: '8px 12px', borderRadius: borderRadius.sm,
            color: colors.textSecondary, fontSize: 13, textAlign: 'center',
            border: `1px solid ${colors.border}`,
          }}>
            Move {Math.ceil(moveCount / 2)} · {moveCount} half-moves
          </div>

          {/* Status */}
          {status && (
            <div style={{
              backgroundColor: colors.bgCard,
              color: isGameOver ? colors.warning : colors.accent,
              padding: '12px 16px', borderRadius: borderRadius.md,
              fontWeight: 600, textAlign: 'center', fontSize: 14,
              border: `1px solid ${isGameOver ? `${colors.warning}30` : `${colors.accent}30`}`,
            }}>
              {status}
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            {!isGameOver && (
              <button onClick={() => setPaused((p) => !p)} style={{
                ...commonStyles.button, flex: 1,
                backgroundColor: paused ? colors.warning : colors.accent,
              }}>
                {paused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            <button onClick={() => setFlipped((f) => !f)} style={{ ...commonStyles.buttonSecondary, flex: 1 }} aria-label="Flip board">
              ⟳ Flip
            </button>
          </div>

          {/* Speed control during game */}
          {!isGameOver && (
            <div>
              <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Speed</div>
              <div style={{ display: 'flex', gap: 2 }}>
                {SPEED_OPTIONS.map(({ label, value }) => (
                  <button key={value} onClick={() => setSpeed(value)} style={{
                    ...commonStyles.buttonSecondary, flex: 1, padding: '4px 6px', fontSize: 11,
                    backgroundColor: speed === value ? `${colors.accent}20` : 'transparent',
                    color: speed === value ? colors.accent : colors.textDark,
                    borderColor: speed === value ? `${colors.accent}40` : colors.borderLight,
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Lines */}
          <button
            onClick={() => setShowLines((s) => !s)}
            style={{
              ...commonStyles.buttonSecondary,
              fontSize: 12, padding: '6px 12px',
              color: showLines ? colors.accent : colors.textDark,
              borderColor: showLines ? `${colors.accent}40` : colors.borderLight,
            }}
          >
            {showLines ? '▼ Hide Analysis' : '▶ Show Analysis'}
          </button>
          {showLines && evalResult.lines.length > 0 && (
            <div style={{
              backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
              padding: spacing.sm, border: `1px solid ${colors.border}`,
            }}>
              <AnalysisLines lines={evalResult.lines} fen={game.fen()} maxMoves={6} />
            </div>
          )}

          {isGameOver && (
            <button onClick={startGame} style={{
              ...commonStyles.button,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            }}>
              New Match
            </button>
          )}
          <button onClick={resetGame} style={commonStyles.buttonSecondary}>Back to Setup</button>
          <button onClick={() => { resetGame(); navigate('/play'); }} style={commonStyles.buttonSecondary}>Back to Menu</button>
        </div>
      </div>
    </div>
  );
}
