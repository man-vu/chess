import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import Avatar from '../components/common/Avatar';
import useStockfish from '../hooks/useStockfish';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import { getItem } from '../utils/storage';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

export default function PlayOnline() {
  const [phase, setPhase] = useState('matchmaking');
  const [opponent, setOpponent] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const playerColor = 'w';
  const { currentUser, refreshUser } = useAuth();
  const { saveGame } = useGameContext();
  const navigate = useNavigate();
  const gameRef = useRef(game);
  gameRef.current = game;

  const opponentElo = opponent?.elo || 1500;
  const skill = opponentElo < 1200 ? 3 : opponentElo < 1600 ? 8 : opponentElo < 2000 ? 14 : 20;
  const { isReady, getMove, stop } = useStockfish(skill);

  useEffect(() => {
    if (phase !== 'matchmaking') return;
    const timer = setTimeout(() => {
      const players = getItem('chess_players', []);
      const userElo = currentUser?.elo || 1200;
      const nearby = players.filter((p) => Math.abs(p.elo - userElo) < 400);
      const opp = nearby[Math.floor(Math.random() * nearby.length)] || players[0];
      setOpponent(opp);
      setChatMessages([{ id: 'sys-1', content: 'Game started! Good luck!', author: { username: 'System' }, date: new Date().toISOString() }]);
      setPhase('playing');
    }, 2000 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [phase, currentUser]);

  const handleGameEnd = useCallback((g) => {
    let result = 'draw';
    if (g.isCheckmate()) result = g.turn() === playerColor ? 'loss' : 'win';
    if (currentUser && opponent) {
      saveGame({ userId: currentUser.id, playerColor, opponentName: opponent.username, opponentElo: opponent.elo, result, moves: g.history(), pgn: g.pgn(), mode: 'online' });
      refreshUser();
    }
    setGameOver(true);
  }, [currentUser, opponent, playerColor, saveGame, refreshUser]);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) { setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`); handleGameEnd(g); }
    else if (g.isDraw()) { setStatus('Draw'); handleGameEnd(g); }
    else if (g.isCheck()) setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    else setStatus('');
  }, [handleGameEnd]);

  const makeOpponentMove = useCallback(async (g) => {
    if (g.isGameOver() || !isReady) return;
    setThinking(true);
    const delay = 500 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));
    try {
      const bestMove = await getMove(g.fen());
      const current = gameRef.current;
      if (current.fen() !== g.fen()) return;
      const move = current.move({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: bestMove.length > 4 ? bestMove[4] : undefined });
      if (move) {
        const next = new Chess(current.fen());
        setGame(next);
        setLastMove({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) });
        setMoveHistory(next.history());
        updateStatus(next);
      }
    } finally { setThinking(false); }
  }, [isReady, getMove, updateStatus]);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver() || thinking || g.turn() !== playerColor) return;
    if (selectedSquare) {
      const piece = g.get(selectedSquare);
      const isPromotion = piece && piece.type === 'p' && sq[1] === '8';
      if (isPromotion && legalMoves.includes(sq)) { setPendingPromotion({ from: selectedSquare, to: sq }); setSelectedSquare(null); setLegalMoves([]); return; }
      const move = g.move({ from: selectedSquare, to: sq });
      if (move) {
        const next = new Chess(g.fen());
        setGame(next);
        setLastMove({ from: selectedSquare, to: sq });
        setMoveHistory(next.history());
        setSelectedSquare(null);
        setLegalMoves([]);
        updateStatus(next);
        setTimeout(() => makeOpponentMove(next), 300);
        return;
      }
    }
    const piece = g.get(sq);
    if (piece && piece.color === playerColor) { setSelectedSquare(sq); setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to)); }
    else { setSelectedSquare(null); setLegalMoves([]); }
  }, [selectedSquare, legalMoves, playerColor, thinking, updateStatus, makeOpponentMove]);

  const handlePromotion = useCallback((p) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const move = g.move({ from, to, promotion: p });
    if (move) { const next = new Chess(g.fen()); setGame(next); setLastMove({ from, to }); setMoveHistory(next.history()); updateStatus(next); setTimeout(() => makeOpponentMove(next), 300); }
    setPendingPromotion(null);
  }, [pendingPromotion, updateStatus, makeOpponentMove]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), content: chatInput, author: { username: currentUser?.username || 'You' }, date: new Date().toISOString() }]);
    setChatInput('');
    if (opponent && Math.random() > 0.5) {
      const responses = ['Good move!', 'Interesting...', 'I didn\'t see that coming', 'Nice one', 'Hmm, let me think...', 'GG', 'Well played'];
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { id: Date.now().toString(), content: responses[Math.floor(Math.random() * responses.length)], author: { username: opponent.username }, date: new Date().toISOString() }]);
      }, 1000 + Math.random() * 3000);
    }
  };

  if (phase === 'matchmaking') {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md }}>{'\u265A'}</div>
          <h2 style={{ color: colors.text, marginBottom: spacing.sm }}>Finding opponent...</h2>
          <p style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>Matching you with a player near your rating</p>
          <div style={{ width: 200, height: 4, backgroundColor: colors.bgDeep, borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '50%', height: '100%', backgroundColor: colors.accent, borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '8px 4px' }}>
            <Avatar username={opponent?.username || '?'} size={28} />
            <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{opponent?.username}</span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>({opponent?.elo})</span>
            {thinking && <span style={{ color: colors.accent, fontSize: 12, fontStyle: 'italic' }}>thinking...</span>}
          </div>
          <Board game={game} selectedSquare={selectedSquare} legalMoves={legalMoves} lastMove={lastMove} onSquareClick={handleSquareClick} flipped={false} />
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '8px 4px' }}>
            <Avatar username={currentUser?.username || 'You'} size={28} />
            <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{currentUser?.username || 'You'}</span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>({currentUser?.elo || 1200})</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: 260 }}>
          <MoveHistory history={moveHistory} />
          {status && <div style={{ backgroundColor: colors.bgCard, color: colors.warning, padding: '12px 16px', borderRadius: borderRadius.md, fontWeight: 600, textAlign: 'center', fontSize: 14 }}>{status}</div>}
          <div style={{ backgroundColor: colors.bgDeep, borderRadius: borderRadius.md, padding: spacing.sm, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>Chat</div>
            {chatMessages.map((msg) => (
              <div key={msg.id} style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: msg.author.username === 'System' ? colors.textMuted : colors.text }}>{msg.author.username}: </span>
                {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} style={{ display: 'flex', gap: 4 }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." style={{ ...commonStyles.input, fontSize: 13, padding: '8px 12px' }} />
            <button type="submit" style={{ ...commonStyles.button, padding: '8px 12px', fontSize: 13 }}>Send</button>
          </form>
          {gameOver && <button onClick={() => { setPhase('matchmaking'); setGame(new Chess()); setGameOver(false); setMoveHistory([]); setStatus(''); }} style={commonStyles.button}>Play Again</button>}
          <button onClick={() => { stop(); navigate('/play'); }} style={commonStyles.buttonSecondary}>Leave</button>
        </div>
      </div>
      {pendingPromotion && <PromotionModal color={playerColor} onSelect={handlePromotion} />}
    </div>
  );
}
