import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

export default function PlayLocal() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const navigate = useNavigate();
  const gameRef = useRef(game);
  gameRef.current = game;

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (g.isDraw()) {
      setStatus(g.isStalemate() ? 'Draw by stalemate' : 'Draw');
    } else if (g.isCheck()) {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setStatus(g.turn() === 'w' ? "White's turn" : "Black's turn");
    }
  }, []);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const turn = g.turn();

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
        return;
      }
    }
    const piece = g.get(sq);
    if (piece && piece.color === turn) {
      setSelectedSquare(sq);
      setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, updateStatus]);

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
    }
    setPendingPromotion(null);
  }, [pendingPromotion, updateStatus]);

  const resetGame = () => {
    const g = new Chess();
    setGame(g);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setStatus("White's turn");
    setPendingPromotion(null);
  };

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ color: colors.text, marginBottom: spacing.md }}>Local Game</h2>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: colors.textSecondary, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>Black</div>
          <Board game={game} selectedSquare={selectedSquare} legalMoves={legalMoves} lastMove={lastMove} onSquareClick={handleSquareClick} flipped={false} />
          <div style={{ color: colors.textSecondary, padding: '8px 4px', fontSize: 14, fontWeight: 500 }}>White</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <MoveHistory history={moveHistory} />
          {status && <div style={{ backgroundColor: colors.bgCard, color: game.isGameOver() ? colors.warning : colors.accent, padding: '12px 16px', borderRadius: borderRadius.md, fontWeight: 600, textAlign: 'center' }}>{status}</div>}
          <button onClick={resetGame} style={commonStyles.button}>New Game</button>
          <button onClick={() => navigate('/play')} style={commonStyles.buttonSecondary}>Back</button>
        </div>
      </div>
      {pendingPromotion && <PromotionModal color={game.turn()} onSelect={handlePromotion} />}
    </div>
  );
}
