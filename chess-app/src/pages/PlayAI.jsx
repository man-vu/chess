import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import useStockfish from '../hooks/useStockfish';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

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

  const handleGameEnd = useCallback((g) => {
    let result = 'draw';
    if (g.isCheckmate()) {
      result = g.turn() === playerColor ? 'loss' : 'win';
    }
    if (currentUser) {
      saveGame({
        userId: currentUser.id,
        playerColor,
        opponentName: `Stockfish (${difficulty})`,
        opponentElo: DIFFICULTY_ELO[difficulty],
        result,
        moves: g.history(),
        pgn: g.pgn(),
        mode: 'ai',
        difficulty,
      });
      refreshUser();
    }
    setGameOver(true);
  }, [currentUser, playerColor, difficulty, saveGame, refreshUser]);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      setStatus(`Checkmate! ${winner} wins!`);
      handleGameEnd(g);
    } else if (g.isDraw()) {
      if (g.isStalemate()) setStatus('Draw by stalemate');
      else if (g.isThreefoldRepetition()) setStatus('Draw by repetition');
      else if (g.isInsufficientMaterial()) setStatus('Draw — insufficient material');
      else setStatus('Draw by 50-move rule');
      handleGameEnd(g);
    } else if (g.isCheck()) {
      setStatus(g.turn() === 'w' ? 'White is in check!' : 'Black is in check!');
    } else {
      setStatus('');
    }
  }, [handleGameEnd]);

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
        const next = new Chess(current.fen());
        setGame(next);
        setLastMove({ from, to });
        setMoveHistory(next.history());
        updateStatus(next);
      }
    } finally {
      setThinking(false);
    }
  }, [isReady, getMove, updateStatus]);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver() || thinking) return;
    if (g.turn() !== playerColor) return;

    if (selectedSquare) {
      const piece = g.get(selectedSquare);
      const isPromotion = piece && piece.type === 'p' &&
        ((piece.color === 'w' && sq[1] === '8') || (piece.color === 'b' && sq[1] === '1'));
      if (isPromotion && legalMoves.includes(sq)) {
        setPendingPromotion({ from: selectedSquare, to: sq });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      const move = g.move({ from: selectedSquare, to: sq });
      if (move) {
        const next = new Chess(g.fen());
        setGame(next);
        setLastMove({ from: selectedSquare, to: sq });
        setMoveHistory(next.history());
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(next);
        setTimeout(() => makeStockfishMove(next), 300);
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
  }, [selectedSquare, legalMoves, playerColor, thinking, updateStatus, makeStockfishMove]);

  const handlePromotion = useCallback((promotionPiece) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const move = g.move({ from, to, promotion: promotionPiece });
    if (move) {
      const next = new Chess(g.fen());
      setGame(next);
      setLastMove({ from, to });
      setMoveHistory(next.history());
      updateStatus(next);
      setTimeout(() => makeStockfishMove(next), 300);
    }
    setPendingPromotion(null);
  }, [pendingPromotion, updateStatus, makeStockfishMove]);

  const startGame = useCallback(() => {
    const g = new Chess();
    setGame(g);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setStatus('');
    setThinking(false);
    setPendingPromotion(null);
    setGameStarted(true);
    setGameOver(false);
    if (playerColor === 'b') setTimeout(() => makeStockfishMove(g), 300);
  }, [playerColor, makeStockfishMove]);

  if (!gameStarted) {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <h1 style={{ color: colors.text, marginBottom: spacing.lg }}>Play vs Computer</h1>
        <div style={{ ...commonStyles.card, width: 380, maxWidth: '100%' }}>
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ color: colors.textSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: spacing.sm }}>Play as</label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {['w', 'b'].map((c) => (
                <button key={c} onClick={() => setPlayerColor(c)} style={{ ...commonStyles.button, flex: 1, backgroundColor: playerColor === c ? colors.accent : 'transparent', border: `2px solid ${playerColor === c ? colors.accent : colors.borderLight}`, color: playerColor === c ? colors.white : colors.textSecondary }}>
                  {c === 'w' ? 'White' : 'Black'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ color: colors.textSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: spacing.sm }}>Difficulty</label>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {Object.keys(DIFFICULTY).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} style={{ ...commonStyles.button, flex: 1, backgroundColor: difficulty === d ? colors.accent : 'transparent', border: `2px solid ${difficulty === d ? colors.accent : colors.borderLight}`, color: difficulty === d ? colors.white : colors.textSecondary }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startGame} disabled={!isReady} style={{ ...commonStyles.button, width: '100%', fontSize: 18, padding: '14px 24px', opacity: isReady ? 1 : 0.5 }}>
            {isReady ? 'Start Game' : 'Loading Stockfish...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ color: colors.text, marginBottom: spacing.md }}>vs Stockfish ({difficulty})</h2>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: colors.textSecondary, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>
            {playerColor === 'w' ? `Stockfish (${difficulty})` : 'You'}
            {thinking && game.turn() !== playerColor && <span style={{ color: colors.accent, fontStyle: 'italic' }}> thinking...</span>}
          </div>
          <Board game={game} selectedSquare={selectedSquare} legalMoves={legalMoves} lastMove={lastMove} onSquareClick={handleSquareClick} flipped={playerColor === 'b'} />
          <div style={{ color: colors.textSecondary, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>
            {playerColor === 'w' ? 'You' : `Stockfish (${difficulty})`}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <MoveHistory history={moveHistory} />
          {status && <div style={{ backgroundColor: colors.bgCard, color: colors.warning, padding: '12px 16px', borderRadius: borderRadius.md, fontWeight: 600, textAlign: 'center' }}>{status}</div>}
          {gameOver && <button onClick={startGame} style={commonStyles.button}>New Game</button>}
          <button onClick={() => { stop(); navigate('/play'); }} style={commonStyles.buttonSecondary}>Back</button>
        </div>
      </div>
      {pendingPromotion && <PromotionModal color={playerColor} onSelect={handlePromotion} />}
    </div>
  );
}
