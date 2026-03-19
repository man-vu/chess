import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Board from '../components/Board';
import MoveHistory from '../components/MoveHistory';
import PromotionModal from '../components/PromotionModal';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import usePremoves from '../hooks/usePremoves';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const SOCKET_URL = 'http://localhost:3001';
const CONNECTION_TIMEOUT = 5000;

export default function PlayMultiplayer() {
  const [phase, setPhase] = useState('lobby');
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const [gameId, setGameId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [drawReceived, setDrawReceived] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);

  const socketRef = useRef(null);
  const gameRef = useRef(game);
  const chatEndRef = useRef(null);
  const connectionTimerRef = useRef(null);

  gameRef.current = game;

  const { currentUser, refreshUser } = useAuth();
  const { saveGame } = useGameContext();
  const navigate = useNavigate();

  const {
    premoves, premoveSquares, premoveSelection,
    addPremove, setPremoveSelection, clearPremoves,
    executeNext, hasPremoves,
  } = usePremoves();
  const premoveRef = useRef({ executeNext, clearPremoves });
  premoveRef.current = { executeNext, clearPremoves };

  // Escape key clears premoves
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') clearPremoves(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearPremoves]);

  // Socket connection and event listeners
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: CONNECTION_TIMEOUT,
    });
    socketRef.current = socket;

    connectionTimerRef.current = setTimeout(() => {
      if (!socket.connected) {
        setServerOffline(true);
      }
    }, CONNECTION_TIMEOUT);

    socket.on('connect', () => {
      clearTimeout(connectionTimerRef.current);
      setServerOffline(false);
      socket.emit('join-lobby', {
        username: currentUser?.username || 'Guest',
        elo: currentUser?.elo || 1200,
      });
    });

    socket.on('connect_error', () => {
      clearTimeout(connectionTimerRef.current);
      setServerOffline(true);
    });

    socket.on('match-found', (data) => {
      setGameId(data.gameId);
      setOpponent(data.opponent);
      setPlayerColor(data.playerColor === 'black' ? 'b' : 'w');
      setGame(new Chess());
      setMoveHistory([]);
      setLastMove(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatus('');
      setGameResult(null);
      setDrawOffered(false);
      setDrawReceived(false);
      setOpponentDisconnected(false);
      setChatMessages([{
        id: 'sys-start',
        content: 'Game started! Good luck!',
        author: { username: 'System' },
        date: new Date().toISOString(),
      }]);
      setPhase('playing');
    });

    socket.on('move-made', (data) => {
      const current = gameRef.current;
      const move = current.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion,
      });
      if (move) {
        const history = current.history();
        const next = new Chess(current.fen());
        setGame(next);
        setLastMove({ from: data.from, to: data.to });
        setMoveHistory(history);
        updateGameStatus(next);

        // Auto-execute queued premove
        if (!next.isGameOver()) {
          setTimeout(() => {
            const { executeNext: execPm } = premoveRef.current;
            const pm = execPm(next);
            if (pm) {
              const pmMove = next.move({ from: pm.from, to: pm.to, promotion: pm.promotion });
              if (pmMove) {
                const afterPm = new Chess(next.fen());
                setGame(afterPm);
                setLastMove({ from: pm.from, to: pm.to });
                setMoveHistory(afterPm.history());
                updateGameStatus(afterPm);
                setSelectedSquare(null);
                setLegalMoves([]);
                socket.emit('make-move', {
                  gameId: data.gameId || gameId,
                  from: pm.from,
                  to: pm.to,
                  promotion: pm.promotion,
                });
              }
            }
          }, 80);
        }
      }
    });

    socket.on('chat-message', (data) => {
      setChatMessages((prev) => [...prev, {
        id: Date.now().toString() + Math.random(),
        content: data.message,
        author: { username: data.username },
        date: new Date().toISOString(),
      }]);
    });

    socket.on('game-over', (data) => {
      handleGameOver(data.reason, data.winner);
    });

    socket.on('draw-offered', () => {
      setDrawReceived(true);
      setChatMessages((prev) => [...prev, {
        id: 'sys-draw-' + Date.now(),
        content: 'Your opponent offers a draw.',
        author: { username: 'System' },
        date: new Date().toISOString(),
      }]);
    });

    socket.on('draw-declined', () => {
      setDrawOffered(false);
      setChatMessages((prev) => [...prev, {
        id: 'sys-draw-dec-' + Date.now(),
        content: 'Draw offer declined.',
        author: { username: 'System' },
        date: new Date().toISOString(),
      }]);
    });

    socket.on('opponent-disconnected', () => {
      setOpponentDisconnected(true);
      setChatMessages((prev) => [...prev, {
        id: 'sys-dc-' + Date.now(),
        content: 'Opponent disconnected.',
        author: { username: 'System' },
        date: new Date().toISOString(),
      }]);
    });

    socket.on('opponent-reconnected', () => {
      setOpponentDisconnected(false);
      setChatMessages((prev) => [...prev, {
        id: 'sys-rc-' + Date.now(),
        content: 'Opponent reconnected.',
        author: { username: 'System' },
        date: new Date().toISOString(),
      }]);
    });

    return () => {
      clearTimeout(connectionTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateGameStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'black' : 'white';
      setStatus(`Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`);
    } else if (g.isStalemate()) {
      setStatus('Stalemate! Draw.');
    } else if (g.isDraw()) {
      setStatus('Draw!');
    } else if (g.isCheck()) {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setStatus('');
    }
  }, []);

  const handleGameOver = useCallback((reason, winner) => {
    let result = 'draw';
    if (winner) {
      const winnerColor = winner === 'white' ? 'w' : 'b';
      result = winnerColor === playerColor ? 'win' : 'loss';
    }

    let resultLabel;
    if (result === 'win') resultLabel = 'Victory';
    else if (result === 'loss') resultLabel = 'Defeat';
    else resultLabel = 'Draw';

    setGameResult({ result, resultLabel, reason });

    if (currentUser && opponent) {
      saveGame({
        userId: currentUser.id,
        playerColor,
        opponentName: opponent.username,
        opponentElo: opponent.elo,
        result,
        moves: gameRef.current.history(),
        pgn: gameRef.current.pgn(),
        mode: 'multiplayer',
      });
      refreshUser();
    }

    setPhase('gameover');
  }, [playerColor, currentUser, opponent, saveGame, refreshUser]);

  const handleSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver() || phase !== 'playing') return;

    const isMyTurn = g.turn() === playerColor;

    // ── PREMOVE MODE ──
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

    // ── NORMAL MODE ──
    if (selectedSquare && selectedSquare !== sq) {
      const targetPiece = g.get(sq);
      if (targetPiece && targetPiece.color === playerColor) {
        setSelectedSquare(sq);
        setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to));
        return;
      }
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
        const history = g.history();
        const next = new Chess(g.fen());
        setGame(next);
        setLastMove({ from: selectedSquare, to: sq });
        setMoveHistory(history);
        setSelectedSquare(null);
        setLegalMoves([]);
        updateGameStatus(next);
        socketRef.current?.emit('make-move', {
          gameId,
          from: selectedSquare,
          to: sq,
        });
        return;
      }
      setSelectedSquare(null); setLegalMoves([]); return;
    }

    const piece = g.get(sq);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(sq);
      setLegalMoves(g.moves({ square: sq, verbose: true }).map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [selectedSquare, legalMoves, playerColor, phase, gameId, updateGameStatus, premoveSelection, addPremove, setPremoveSelection]);

  const handlePromotion = useCallback((p) => {
    const g = gameRef.current;
    const { from, to } = pendingPromotion;
    const move = g.move({ from, to, promotion: p });
    if (move) {
      const history = g.history();
      const next = new Chess(g.fen());
      setGame(next);
      setLastMove({ from, to });
      setMoveHistory(history);
      updateGameStatus(next);
      socketRef.current?.emit('make-move', {
        gameId,
        from,
        to,
        promotion: p,
      });
    }
    setPendingPromotion(null);
  }, [pendingPromotion, gameId, updateGameStatus]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const message = chatInput.trim();
    setChatMessages((prev) => [...prev, {
      id: Date.now().toString(),
      content: message,
      author: { username: currentUser?.username || 'You' },
      date: new Date().toISOString(),
    }]);
    socketRef.current?.emit('game-chat', { gameId, message });
    setChatInput('');
  };

  const handleResign = () => {
    socketRef.current?.emit('resign', { gameId });
    const winner = playerColor === 'w' ? 'black' : 'white';
    handleGameOver('resignation', winner);
  };

  const handleOfferDraw = () => {
    setDrawOffered(true);
    socketRef.current?.emit('offer-draw', { gameId });
    setChatMessages((prev) => [...prev, {
      id: 'sys-draw-sent-' + Date.now(),
      content: 'You offered a draw.',
      author: { username: 'System' },
      date: new Date().toISOString(),
    }]);
  };

  const handleAcceptDraw = () => {
    setDrawReceived(false);
    socketRef.current?.emit('accept-draw', { gameId });
    handleGameOver('agreement', null);
  };

  const handleDeclineDraw = () => {
    setDrawReceived(false);
    socketRef.current?.emit('decline-draw', { gameId });
  };

  const handlePlayAgain = () => {
    setPhase('lobby');
    setGame(new Chess());
    setMoveHistory([]);
    setLastMove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setStatus('');
    setGameResult(null);
    setDrawOffered(false);
    setDrawReceived(false);
    setOpponentDisconnected(false);
    setChatMessages([]);
    socketRef.current?.emit('join-lobby', {
      username: currentUser?.username || 'Guest',
      elo: currentUser?.elo || 1200,
    });
  };

  const isFlipped = playerColor === 'b';
  const isMyTurn = game.turn() === playerColor;

  // Server offline screen
  if (serverOffline) {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, boxShadow: shadows.lg, maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md, opacity: 0.5 }}>{'\u26A0'}</div>
          <h2 style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: 700 }}>Server Offline</h2>
          <p style={{ color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 1.6 }}>
            Unable to connect to the multiplayer server. Make sure the server is running at {SOCKET_URL} and try again.
          </p>
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
            <button
              onClick={() => {
                setServerOffline(false);
                socketRef.current?.connect();
                connectionTimerRef.current = setTimeout(() => {
                  if (!socketRef.current?.connected) setServerOffline(true);
                }, CONNECTION_TIMEOUT);
              }}
              style={commonStyles.button}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/play')}
              style={commonStyles.buttonSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.textSecondary; e.currentTarget.style.color = colors.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby / matchmaking phase
  if (phase === 'lobby') {
    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, boxShadow: shadows.lg, animation: 'fadeInScale 400ms ease', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md, animation: 'pulse 2s ease-in-out infinite' }}>{'\u265A'}</div>
          <h2 style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: 700 }}>Finding a real opponent...</h2>
          <p style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
            Matching you with a player near your rating ({currentUser?.elo || 1200})
          </p>
          <div style={{ width: 200, height: 4, backgroundColor: colors.bgDeep, borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', backgroundColor: colors.accent, borderRadius: 2, animation: 'matchmakingBar 1.5s ease-in-out infinite' }} />
          </div>
          <button
            onClick={() => navigate('/play')}
            style={{ ...commonStyles.buttonSecondary, marginTop: spacing.lg }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.textSecondary; e.currentTarget.style.color = colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Game over phase
  if (phase === 'gameover') {
    const resultColor = gameResult?.result === 'win' ? colors.success
      : gameResult?.result === 'loss' ? colors.error
      : colors.warning;

    return (
      <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          ...commonStyles.card,
          textAlign: 'center',
          padding: spacing.xxl,
          boxShadow: shadows.lg,
          animation: 'fadeInScale 400ms ease',
          maxWidth: 420,
          borderColor: resultColor + '40',
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 800,
            color: resultColor,
            marginBottom: spacing.sm,
            letterSpacing: '-0.02em',
          }}>
            {gameResult?.resultLabel}
          </div>
          {gameResult?.reason && (
            <p style={{ color: colors.textSecondary, marginBottom: spacing.md, fontSize: 14 }}>
              by {gameResult.reason}
            </p>
          )}
          {opponent && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
              padding: spacing.sm,
              backgroundColor: colors.bgDeep,
              borderRadius: borderRadius.md,
            }}>
              <Avatar username={currentUser?.username || 'You'} size={24} />
              <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{currentUser?.username || 'You'}</span>
              <span style={{ color: colors.textMuted, fontSize: 13 }}>vs</span>
              <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{opponent.username}</span>
              <Avatar username={opponent.username} size={24} />
            </div>
          )}
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
            <button
              onClick={handlePlayAgain}
              style={{
                ...commonStyles.button,
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = shadows.md; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/play')}
              style={commonStyles.buttonSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.textSecondary; e.currentTarget.style.color = colors.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const topPlayer = isFlipped
    ? { username: currentUser?.username || 'You', elo: currentUser?.elo || 1200 }
    : { username: opponent?.username || 'Opponent', elo: opponent?.elo || 1500 };
  const bottomPlayer = isFlipped
    ? { username: opponent?.username || 'Opponent', elo: opponent?.elo || 1500 }
    : { username: currentUser?.username || 'You', elo: currentUser?.elo || 1200 };

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {opponentDisconnected && (
        <div style={{
          backgroundColor: colors.warning + '18',
          color: colors.warning,
          padding: '8px 16px',
          borderRadius: borderRadius.md,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: spacing.sm,
          border: `1px solid ${colors.warning}30`,
          animation: 'fadeIn 200ms ease',
        }}>
          Opponent disconnected. Waiting for reconnection...
        </div>
      )}
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          {/* Top player bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: '10px 12px',
            backgroundColor: colors.bgCard,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xs,
            border: `1px solid ${colors.border}`,
          }}>
            <Avatar username={topPlayer.username} size={28} />
            <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{topPlayer.username}</span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>({topPlayer.elo})</span>
            {!isFlipped && !isMyTurn && (
              <span style={{ color: colors.accent, fontSize: 12, fontStyle: 'italic', marginLeft: 'auto', animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>
            )}
            {isFlipped && isMyTurn && (
              <span style={{ color: colors.accent, fontSize: 12, fontWeight: 500, marginLeft: 'auto' }}>Your turn</span>
            )}
          </div>

          <Board
            game={game}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            onDragMove={(from, to) => {
              const g = gameRef.current;
              if (g.isGameOver() || phase !== 'playing') return;
              const piece = g.get(from);
              if (!piece || piece.color !== playerColor) return;
              if (g.turn() !== playerColor) { addPremove(from, to); return; }
              handleSquareClick(from);
              handleSquareClick(to);
            }}
            onRightClick={() => clearPremoves()}
            flipped={isFlipped}
            premoves={premoves}
            premoveSquares={premoveSquares}
            premoveSelection={premoveSelection}
          />

          {/* Bottom player bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: '10px 12px',
            backgroundColor: colors.bgCard,
            borderRadius: borderRadius.md,
            marginTop: spacing.xs,
            border: `1px solid ${colors.border}`,
          }}>
            <Avatar username={bottomPlayer.username} size={28} />
            <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>{bottomPlayer.username}</span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>({bottomPlayer.elo})</span>
            {!isFlipped && isMyTurn && (
              <span style={{ color: colors.accent, fontSize: 12, fontWeight: 500, marginLeft: 'auto' }}>Your turn</span>
            )}
            {isFlipped && !isMyTurn && (
              <span style={{ color: colors.accent, fontSize: 12, fontStyle: 'italic', marginLeft: 'auto', animation: 'pulse 1.5s ease-in-out infinite' }}>thinking...</span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: 260 }}>
          <MoveHistory history={moveHistory} />

          {status && (
            <div style={{
              backgroundColor: colors.bgCard,
              color: colors.warning,
              padding: '12px 16px',
              borderRadius: borderRadius.md,
              fontWeight: 600,
              textAlign: 'center',
              fontSize: 14,
              border: `1px solid ${colors.warning}30`,
              animation: 'fadeIn 200ms ease',
            }}>
              {status}
            </div>
          )}

          {drawReceived && (
            <div style={{
              backgroundColor: colors.bgCard,
              padding: '12px 16px',
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.info}30`,
              animation: 'fadeIn 200ms ease',
            }}>
              <p style={{ color: colors.text, fontSize: 13, fontWeight: 600, margin: 0, marginBottom: spacing.sm }}>
                Opponent offers a draw
              </p>
              <div style={{ display: 'flex', gap: spacing.xs }}>
                <button
                  onClick={handleAcceptDraw}
                  style={{ ...commonStyles.button, padding: '6px 14px', fontSize: 13, flex: 1 }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.accentHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.accent; }}
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineDraw}
                  style={{ ...commonStyles.buttonSecondary, padding: '6px 14px', fontSize: 13, flex: 1 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.textSecondary; e.currentTarget.style.color = colors.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Chat panel */}
          <div style={{
            backgroundColor: colors.bgDeep,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
          }}>
            <div style={{ padding: `${spacing.xs}px ${spacing.sm}px`, borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chat</span>
            </div>
            <div style={{ padding: spacing.sm, maxHeight: 180, overflowY: 'auto' }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                  <span style={{
                    fontWeight: 600,
                    color: msg.author.username === 'System' ? colors.textDark : colors.text,
                  }}>
                    {msg.author.username}:{' '}
                  </span>
                  {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <form onSubmit={sendChat} style={{ display: 'flex', gap: 4 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              style={{ ...commonStyles.input, fontSize: 13, padding: '8px 12px' }}
              onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
              onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
            />
            <button type="submit" style={{ ...commonStyles.button, padding: '8px 14px', fontSize: 13 }}>Send</button>
          </form>

          {/* Game action buttons */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <button
              onClick={handleOfferDraw}
              disabled={drawOffered || game.isGameOver()}
              style={{
                ...commonStyles.buttonSecondary,
                flex: 1,
                fontSize: 13,
                padding: '8px 12px',
                opacity: drawOffered || game.isGameOver() ? 0.5 : 1,
                cursor: drawOffered || game.isGameOver() ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!drawOffered && !game.isGameOver()) {
                  e.currentTarget.style.borderColor = colors.textSecondary;
                  e.currentTarget.style.color = colors.text;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.borderLight;
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              {drawOffered ? 'Draw Offered' : 'Offer Draw'}
            </button>
            <button
              onClick={handleResign}
              disabled={game.isGameOver()}
              style={{
                ...commonStyles.buttonSecondary,
                flex: 1,
                fontSize: 13,
                padding: '8px 12px',
                color: colors.error,
                borderColor: colors.error + '40',
                opacity: game.isGameOver() ? 0.5 : 1,
                cursor: game.isGameOver() ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!game.isGameOver()) {
                  e.currentTarget.style.backgroundColor = colors.error + '12';
                  e.currentTarget.style.borderColor = colors.error;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = colors.error + '40';
              }}
            >
              Resign
            </button>
          </div>

          <button
            onClick={() => navigate('/play')}
            style={commonStyles.buttonSecondary}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.textSecondary; e.currentTarget.style.color = colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.color = colors.textSecondary; }}
          >
            Leave
          </button>
        </div>
      </div>

      {pendingPromotion && <PromotionModal color={playerColor} onSelect={handlePromotion} />}
    </div>
  );
}
