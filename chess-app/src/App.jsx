import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import Board from './components/Board';
import MoveHistory from './components/MoveHistory';
import PromotionModal from './components/PromotionModal';
import useStockfish from './hooks/useStockfish';

const DIFFICULTY = {
  Easy: 3,
  Medium: 10,
  Hard: 20,
};

export default function App() {
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

  const skillLevel = DIFFICULTY[difficulty];
  const { isReady, getMove, stop } = useStockfish(skillLevel);
  const gameRef = useRef(game);
  gameRef.current = game;

  const updateStatus = useCallback((g) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      setStatus(`Checkmate! ${winner} wins!`);
    } else if (g.isDraw()) {
      if (g.isStalemate()) setStatus('Draw by stalemate');
      else if (g.isThreefoldRepetition()) setStatus('Draw by repetition');
      else if (g.isInsufficientMaterial()) setStatus('Draw — insufficient material');
      else setStatus('Draw by 50-move rule');
    } else if (g.isCheck()) {
      setStatus(g.turn() === 'w' ? 'White is in check!' : 'Black is in check!');
    } else {
      setStatus('');
    }
  }, []);

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
      const isPromotion =
        piece &&
        piece.type === 'p' &&
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
      const moves = g.moves({ square: sq, verbose: true }).map((m) => m.to);
      setLegalMoves(moves);
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
    if (playerColor === 'b') {
      setTimeout(() => makeStockfishMove(g), 300);
    }
  }, [playerColor, makeStockfishMove]);

  const isGameOver = game.isGameOver();

  if (!gameStarted) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Chess vs Stockfish</h1>
        <div style={styles.setupPanel}>
          <div style={styles.optionGroup}>
            <label style={styles.label}>Play as</label>
            <div style={styles.btnGroup}>
              {['w', 'b'].map((c) => (
                <button
                  key={c}
                  onClick={() => setPlayerColor(c)}
                  style={{
                    ...styles.optionBtn,
                    ...(playerColor === c ? styles.optionBtnActive : {}),
                  }}
                >
                  {c === 'w' ? 'White' : 'Black'}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.optionGroup}>
            <label style={styles.label}>Difficulty</label>
            <div style={styles.btnGroup}>
              {Object.keys(DIFFICULTY).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    ...styles.optionBtn,
                    ...(difficulty === d ? styles.optionBtnActive : {}),
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={startGame}
            disabled={!isReady}
            style={{
              ...styles.startBtn,
              opacity: isReady ? 1 : 0.5,
            }}
          >
            {isReady ? 'Start Game' : 'Loading Stockfish...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Chess vs Stockfish ({difficulty})</h1>
      <div style={styles.gameArea}>
        <div>
          <div style={styles.playerBar}>
            {playerColor === 'w' ? 'Stockfish (Black)' : 'You (Black)'}
            {thinking && game.turn() !== playerColor && (
              <span style={styles.thinkingDot}> thinking...</span>
            )}
          </div>
          <Board
            game={game}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
            flipped={playerColor === 'b'}
          />
          <div style={styles.playerBar}>
            {playerColor === 'w' ? 'You (White)' : 'Stockfish (White)'}
          </div>
        </div>
        <div style={styles.sidebar}>
          <MoveHistory history={moveHistory} />
          {status && (
            <div style={styles.statusBox}>
              {status}
            </div>
          )}
          {isGameOver && (
            <button onClick={startGame} style={styles.newGameBtn}>
              New Game
            </button>
          )}
          <button
            onClick={() => { stop(); setGameStarted(false); }}
            style={styles.backBtn}
          >
            Back to Menu
          </button>
        </div>
      </div>
      {pendingPromotion && (
        <PromotionModal color={playerColor} onSelect={handlePromotion} />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#312e2b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    color: '#e8e6e3',
    marginBottom: 24,
    fontSize: 28,
    fontWeight: 600,
  },
  setupPanel: {
    backgroundColor: '#272522',
    borderRadius: 12,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minWidth: 320,
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    color: '#a0a0a0',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    padding: '10px 16px',
    border: '2px solid #444',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 500,
  },
  optionBtnActive: {
    borderColor: '#81b64c',
    backgroundColor: '#81b64c',
    color: '#fff',
  },
  startBtn: {
    padding: '14px 24px',
    backgroundColor: '#81b64c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  gameArea: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  },
  playerBar: {
    color: '#ccc',
    padding: '8px 4px',
    fontSize: 15,
    fontWeight: 500,
  },
  thinkingDot: {
    color: '#81b64c',
    fontStyle: 'italic',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statusBox: {
    backgroundColor: '#272522',
    color: '#f5c518',
    padding: '12px 16px',
    borderRadius: 8,
    fontWeight: 600,
    textAlign: 'center',
  },
  newGameBtn: {
    padding: '12px 20px',
    backgroundColor: '#81b64c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #555',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
  },
};
