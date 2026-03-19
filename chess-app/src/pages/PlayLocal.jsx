import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import useSoundEffects from '../hooks/useSoundEffects';
import useBoardTheme from '../hooks/useBoardTheme';
import { getOpeningName } from '../data/openings';
import { colors, commonStyles, spacing, borderRadius, transitions } from '../theme';

export default function PlayLocal() {
  const [game, setGame] = useState(() => {
    const customFen = localStorage.getItem('chess_custom_fen');
    if (customFen) {
      localStorage.removeItem('chess_custom_fen');
      try { return new Chess(customFen); } catch { /* invalid fen */ }
    }
    return new Chess();
  });
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState("White's turn");
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();
  const { playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion } = useSoundEffects();
  const { boardTheme } = useBoardTheme();
  const openingName = getOpeningName(moveHistory);
  const gameRef = useRef(game);
  gameRef.current = game;

  const playSoundForMove = useCallback((next, move) => {
    if (next.isCheckmate() || next.isDraw()) playGameOver();
    else if (next.isCheck()) playCheck();
    else if (move.flags?.includes('k') || move.flags?.includes('q')) playCastle();
    else if (move.flags?.includes('p')) playPromotion();
    else if (move.captured) playCapture();
    else playMove();
  }, [playMove, playCapture, playCheck, playGameOver, playCastle, playPromotion]);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`);
    else if (g.isDraw()) setStatus(g.isStalemate() ? 'Draw by stalemate' : 'Draw');
    else if (g.isCheck()) setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    else setStatus(g.turn() === 'w' ? "White's turn" : "Black's turn");
  }, []);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const turn = g.turn();
    if (selectedSquare && selectedSquare !== sq) {
      const selectedPiece = g.get(selectedSquare);
      const targetPiece = g.get(sq);
      // Switch selection if clicking another friendly piece
      if (selectedPiece && targetPiece && targetPiece.color === turn) {
        setSelectedSquare(sq); setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to)); return;
      }
      const isPromotion = selectedPiece && selectedPiece.type === 'p' && ((selectedPiece.color === 'w' && sq[1] === '8') || (selectedPiece.color === 'b' && sq[1] === '1'));
      if (isPromotion && legalMoves.includes(sq)) { setPendingPromotion({ from: selectedSquare, to: sq }); setSelectedSquare(null); setLegalMoves([]); return; }
      const move = g.move({ from: selectedSquare, to: sq });
      if (move) {
        const history = g.history();
        const next = new Chess(g.fen());
        setGame(next); setLastMove({ from: selectedSquare, to: sq }); setMoveHistory(history);
        setSelectedSquare(null); setLegalMoves([]); updateStatus(next); playSoundForMove(next, move); return;
      }
      setSelectedSquare(null); setLegalMoves([]); return;
    }
    const piece = g.get(sq);
    if (piece && piece.color === turn) { setSelectedSquare(sq); setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to)); }
    else { setSelectedSquare(null); setLegalMoves([]); }
  }, [selectedSquare, legalMoves, updateStatus]);

  const handleDragMove = useCallback((from, to) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const piece = g.get(from);
    if (!piece || piece.color !== g.turn()) return;
    const isPromotion = piece.type === 'p' && ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));
    if (isPromotion) { setPendingPromotion({ from, to }); setSelectedSquare(null); setLegalMoves([]); return; }
    const move = g.move({ from, to });
    if (move) {
      const history = g.history();
      const next = new Chess(g.fen());
      setGame(next); setLastMove({ from, to }); setMoveHistory(history);
      setSelectedSquare(null); setLegalMoves([]); updateStatus(next);
    } else { setSelectedSquare(null); setLegalMoves([]); }
  }, [updateStatus]);

  const handlePromotion = useCallback((promotionPiece) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const move = g.move({ from, to, promotion: promotionPiece });
    if (move) {
      const history = g.history();
      const next = new Chess(g.fen());
      setGame(next); setLastMove({ from, to }); setMoveHistory(history); updateStatus(next);
    }
    setPendingPromotion(null);
  }, [pendingPromotion, updateStatus]);

  const resetGame = () => {
    setGame(new Chess()); setSelectedSquare(null); setLegalMoves([]); setLastMove(null);
    setMoveHistory([]); setStatus("White's turn"); setPendingPromotion(null);
    setFlipped(false);
  };

  // Compute captured pieces by comparing current board material vs starting set
  const getCapturedPieces = useCallback(() => {
    const starting = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
    const current = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } };
    const board = game.board();
    for (const row of board) {
      for (const sq of row) {
        if (sq) current[sq.color][sq.type]++;
      }
    }
    const captured = { w: [], b: [] };
    for (const type of ['q', 'r', 'b', 'n', 'p']) {
      const missingWhite = starting[type] - current.w[type];
      const missingBlack = starting[type] - current.b[type];
      for (let i = 0; i < missingWhite; i++) captured.w.push(type);
      for (let i = 0; i < missingBlack; i++) captured.b.push(type);
    }
    return captured;
  }, [game]);

  const capturedPieces = getCapturedPieces();

  const pieceSymbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

  const CapturedRow = ({ pieces, color }) => (
    <div style={{ display: 'flex', gap: 2, minHeight: 22, flexWrap: 'wrap', alignItems: 'center' }}>
      {pieces.length === 0 ? null : pieces
        .sort((a, b) => 'qrbnp'.indexOf(a) - 'qrbnp'.indexOf(b))
        .map((p, i) => (
          <span key={i} style={{ fontSize: 18, opacity: 0.85, color: color === 'w' ? '#e8e8e8' : '#555' }}>
            {pieceSymbols[p]}
          </span>
        ))}
    </div>
  );

  const topColor = flipped ? 'White' : 'Black';
  const bottomColor = flipped ? 'Black' : 'White';
  const topCaptured = flipped ? capturedPieces.w : capturedPieces.b;
  const bottomCaptured = flipped ? capturedPieces.b : capturedPieces.w;

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <h2 style={{ color: colors.text, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Local Game</h2>
        {openingName && <span style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>{openingName}</span>}
      </div>
      <div className="game-layout" style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
            <span style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500 }}>{topColor}</span>
            <CapturedRow pieces={topCaptured} color={flipped ? 'w' : 'b'} />
          </div>
          <Board game={game} selectedSquare={selectedSquare} legalMoves={legalMoves} lastMove={lastMove} onSquareClick={handleSquareClick} onDragMove={handleDragMove} flipped={flipped} themeColors={boardTheme} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
            <span style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500 }}>{bottomColor}</span>
            <CapturedRow pieces={bottomCaptured} color={flipped ? 'b' : 'w'} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
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
            }}>
              {status}
            </div>
          )}
          <button onClick={() => setFlipped(f => !f)} style={commonStyles.buttonSecondary} aria-label="Flip board">
            ⟳ Flip Board
          </button>
          {moveHistory.length > 0 && (
            <button onClick={() => {
              const g = gameRef.current;
              g.undo();
              const history = g.history();
              const next = new Chess(g.fen());
              setGame(next); setMoveHistory(history); setLastMove(null);
              setSelectedSquare(null); setLegalMoves([]); updateStatus(next);
            }} style={commonStyles.buttonSecondary}>Undo Move</button>
          )}
          <button onClick={resetGame} style={{
            ...commonStyles.button,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
          }}>New Game</button>
          <button onClick={() => navigate('/play')} style={commonStyles.buttonSecondary}>Back</button>
        </div>
      </div>
      {/* Game Over Modal */}
      {game.isGameOver() && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: colors.bgCard, borderRadius: borderRadius.xl, padding: spacing.xl,
            textAlign: 'center', minWidth: 300, border: `1px solid ${colors.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>
              {game.isCheckmate() ? '♚' : '½'}
            </div>
            <h3 style={{ color: colors.text, margin: `0 0 ${spacing.sm}px`, fontSize: 22, fontWeight: 700 }}>
              {game.isCheckmate() ? 'Checkmate!' : 'Game Drawn'}
            </h3>
            <p style={{ color: colors.textSecondary, margin: `0 0 ${spacing.lg}px`, fontSize: 15 }}>
              {game.isCheckmate()
                ? `${game.turn() === 'w' ? 'Black' : 'White'} wins!`
                : game.isStalemate() ? 'Stalemate' : game.isThreefoldRepetition() ? 'Threefold repetition' : game.isInsufficientMaterial() ? 'Insufficient material' : 'Draw'}
            </p>
            <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
              <button onClick={resetGame} style={{
                ...commonStyles.button,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
              }}>Play Again</button>
              <button onClick={() => navigate('/play')} style={commonStyles.buttonSecondary}>Back to Menu</button>
            </div>
          </div>
        </div>
      )}
      {pendingPromotion && <PromotionModal color={game.turn()} onSelect={handlePromotion} />}
    </div>
  );
}
