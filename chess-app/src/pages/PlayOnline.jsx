import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import Avatar from '../components/common/Avatar';
import useStockfish from '../hooks/useStockfish';
import usePremoves from '../hooks/usePremoves';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import { getItem } from '../utils/storage';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

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
  const chatEndRef = useRef(null);

  const playerColor = 'w';
  const { currentUser, refreshUser } = useAuth();
  const { saveGame } = useGameContext();
  const navigate = useNavigate();
  const gameRef = useRef(game);
  gameRef.current = game;

  const opponentElo = opponent?.elo || 1500;
  const skill = opponentElo < 1200 ? 3 : opponentElo < 1600 ? 8 : opponentElo < 2000 ? 14 : 20;
  const { isReady, getMove, stop } = useStockfish(skill);

  const {
    premoves, premoveSquares, premoveSelection,
    addPremove, setPremoveSelection, clearPremoves,
    executeNext, hasPremoves,
  } = usePremoves();

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Escape / right-click clears premoves
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') clearPremoves(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearPremoves]);

  const handleGameEnd = useCallback((g) => {
    let result = 'draw';
    if (g.isCheckmate()) result = g.turn() === playerColor ? 'loss' : 'win';
    if (currentUser && opponent) {
      saveGame({ userId: currentUser.id, playerColor, opponentName: opponent.username, opponentElo: opponent.elo, result, moves: g.history(), pgn: g.pgn(), mode: 'online' });
      refreshUser();
    }
    setGameOver(true);
    clearPremoves();
  }, [currentUser, opponent, playerColor, saveGame, refreshUser, clearPremoves]);

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) { setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`); handleGameEnd(g); }
    else if (g.isDraw()) { setStatus('Draw'); handleGameEnd(g); }
    else if (g.isCheck()) setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    else setStatus('');
  }, [handleGameEnd]);

  const executePlayerMove = useCallback((g, from, to, promotion) => {
    const move = g.move({ from, to, promotion });
    if (!move) return null;
    const history = g.history();
    const next = new Chess(g.fen());
    setGame(next); setLastMove({ from, to }); setMoveHistory(history);
    setSelectedSquare(null); setLegalMoves([]); updateStatus(next);
    return next;
  }, [updateStatus]);

  const makeOpponentMove = useCallback(async (g) => {
    if (g.isGameOver() || !isReady) return;
    setThinking(true);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 2000));
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
        setGame(next); setLastMove({ from, to }); setMoveHistory(history); updateStatus(next);

        // Auto-execute premoves
        if (!next.isGameOver()) {
          setTimeout(() => {
            const pm = executeNext(next);
            if (pm) {
              const afterPremove = executePlayerMove(next, pm.from, pm.to, pm.promotion);
              if (afterPremove && !afterPremove.isGameOver()) {
                setTimeout(() => makeOpponentMove(afterPremove), 200);
              }
            }
          }, 80);
          return;
        }
      }
    } finally { setThinking(false); }
  }, [isReady, getMove, updateStatus, executeNext, executePlayerMove]);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const isMyTurn = g.turn() === playerColor && !thinking;

    if (!isMyTurn) {
      if (premoveSelection) {
        if (premoveSelection !== sq) addPremove(premoveSelection, sq);
        else setPremoveSelection(null);
        return;
      }
      const piece = g.get(sq);
      if (piece && piece.color === playerColor) setPremoveSelection(sq);
      return;
    }

    if (selectedSquare && selectedSquare !== sq) {
      const targetPiece = g.get(sq);
      if (targetPiece && targetPiece.color === playerColor) {
        setSelectedSquare(sq); setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to)); return;
      }
      const piece = g.get(selectedSquare);
      const isPromotion = piece && piece.type === 'p' && sq[1] === '8';
      if (isPromotion && legalMoves.includes(sq)) { setPendingPromotion({ from: selectedSquare, to: sq }); setSelectedSquare(null); setLegalMoves([]); return; }
      const next = executePlayerMove(g, selectedSquare, sq);
      if (next) {
        if (!next.isGameOver()) setTimeout(() => makeOpponentMove(next), 300);
        return;
      }
      setSelectedSquare(null); setLegalMoves([]); return;
    }
    const piece = g.get(sq);
    if (piece && piece.color === playerColor) { setSelectedSquare(sq); setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to)); }
    else { setSelectedSquare(null); setLegalMoves([]); }
  }, [selectedSquare, legalMoves, playerColor, thinking, executePlayerMove, makeOpponentMove, premoveSelection, addPremove, setPremoveSelection]);

  const handleDragMove = useCallback((from, to) => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const piece = g.get(from);
    if (!piece || piece.color !== playerColor) return;
    const isMyTurn = g.turn() === playerColor && !thinking;
    if (!isMyTurn) { addPremove(from, to); return; }
    const isPromotion = piece.type === 'p' && to[1] === '8';
    if (isPromotion) { setPendingPromotion({ from, to }); setSelectedSquare(null); setLegalMoves([]); return; }
    const next = executePlayerMove(g, from, to);
    if (next && !next.isGameOver()) setTimeout(() => makeOpponentMove(next), 300);
    else { setSelectedSquare(null); setLegalMoves([]); }
  }, [playerColor, thinking, executePlayerMove, makeOpponentMove, addPremove]);

  const handleRightClick = useCallback(() => { clearPremoves(); }, [clearPremoves]);

  const handlePromotion = useCallback((p) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const next = executePlayerMove(g, from, to, p);
    if (next && !next.isGameOver()) setTimeout(() => makeOpponentMove(next), 300);
    setPendingPromotion(null);
  }, [pendingPromotion, executePlayerMove, makeOpponentMove]);

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
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, boxShadow: shadows.lg, animation: 'fadeInScale 400ms ease' }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md, animation: 'pulse 2s ease-in-out infinite' }}>{'\u265A'}</div>
          <h2 style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: 700 }}>Finding opponent...</h2>
          <p style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>Matching you with a player near your rating</p>
          <div style={{ width: 200, height: 4, backgroundColor: colors.bgDeep, borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', backgroundColor: colors.accent, borderRadius: 2, animation: 'matchmakingBar 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: spacing.sm, padding: '10px 12px',
            backgroundColor: colors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.xs,
            border: `1px solid ${colors.border}`,
          }}>
            <Avatar username={opponent?.username || '?'} size={28} />
            <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{opponent?.username}</span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>({opponent?.elo})</span>
            {thinking && <span style={{ color: colors.accent, fontSize: 12, fontStyle: 'italic', animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>}
          </div>
          <Board
            game={game} selectedSquare={selectedSquare} legalMoves={legalMoves} lastMove={lastMove}
            onSquareClick={handleSquareClick} onDragMove={handleDragMove} onRightClick={handleRightClick} flipped={false}
            premoves={premoves} premoveSquares={premoveSquares} premoveSelection={premoveSelection}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', backgroundColor: colors.bgCard, borderRadius: borderRadius.md, marginTop: spacing.xs,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Avatar username={currentUser?.username || 'You'} size={28} />
              <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{currentUser?.username || 'You'}</span>
              <span style={{ color: colors.textMuted, fontSize: 12 }}>({currentUser?.elo || 1200})</span>
            </div>
            {hasPremoves && (
              <span style={{ color: '#a855f7', fontSize: 11, fontWeight: 600 }}>
                {premoves.length} premove{premoves.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: 260 }}>
          <MoveHistory history={moveHistory} />
          {status && (
            <div style={{
              backgroundColor: colors.bgCard, color: colors.warning, padding: '12px 16px',
              borderRadius: borderRadius.md, fontWeight: 600, textAlign: 'center', fontSize: 14,
              border: `1px solid ${colors.warning}30`, animation: 'fadeIn 200ms ease',
            }}>{status}</div>
          )}
          <div style={{
            backgroundColor: colors.bgDeep, borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`, overflow: 'hidden',
          }}>
            <div style={{ padding: `${spacing.xs}px ${spacing.sm}px`, borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chat</span>
            </div>
            <div style={{ padding: spacing.sm, maxHeight: 180, overflowY: 'auto' }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: msg.author.username === 'System' ? colors.textDark : colors.text }}>{msg.author.username}: </span>
                  {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          <form onSubmit={sendChat} style={{ display: 'flex', gap: 4 }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." style={{ ...commonStyles.input, fontSize: 13, padding: '8px 12px' }}
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
            />
            <button type="submit" style={{ ...commonStyles.button, padding: '8px 14px', fontSize: 13 }}>Send</button>
          </form>
          {gameOver && (
            <button onClick={() => { setPhase('matchmaking'); setGame(new Chess()); setGameOver(false); setMoveHistory([]); setStatus(''); clearPremoves(); }} style={{
              ...commonStyles.button, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            }}>Play Again</button>
          )}
          <button onClick={() => { stop(); navigate('/play'); }} style={commonStyles.buttonSecondary}>Leave</button>
        </div>
      </div>
      {pendingPromotion && <PromotionModal color={playerColor} onSelect={handlePromotion} />}
    </div>
  );
}
