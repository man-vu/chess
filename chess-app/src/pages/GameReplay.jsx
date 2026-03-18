import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import Board from '../components/Board';
import { useGameContext } from '../contexts/GameContext';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

export default function GameReplay() {
  const { gameId } = useParams();
  const { getGame } = useGameContext();
  const navigate = useNavigate();
  const game = useMemo(() => getGame(gameId), [gameId, getGame]);
  const [moveIndex, setMoveIndex] = useState(0);

  if (!game) {
    return <div style={{ ...commonStyles.page, color: colors.textSecondary, textAlign: 'center', paddingTop: 80 }}>Game not found</div>;
  }

  const moves = game.moves || [];
  const positions = useMemo(() => {
    const chess = new Chess();
    const fens = [chess.fen()];
    for (const move of moves) {
      chess.move(move);
      fens.push(chess.fen());
    }
    return fens;
  }, [moves]);

  const currentChess = useMemo(() => new Chess(positions[moveIndex]), [positions, moveIndex]);

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ color: colors.text, marginBottom: spacing.md }}>
        Game Replay: vs {game.opponentName}
      </h2>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <Board game={currentChess} selectedSquare={null} legalMoves={[]} lastMove={null} onSquareClick={() => {}} flipped={game.playerColor === 'b'} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md }}>
            <button onClick={() => setMoveIndex(0)} disabled={moveIndex === 0} style={{ ...commonStyles.buttonSecondary, padding: '8px 16px' }}>
              {'|<'}
            </button>
            <button onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))} disabled={moveIndex === 0} style={{ ...commonStyles.buttonSecondary, padding: '8px 16px' }}>
              {'<'}
            </button>
            <span style={{ color: colors.textSecondary, display: 'flex', alignItems: 'center', fontSize: 14, padding: '0 8px' }}>
              {moveIndex} / {moves.length}
            </span>
            <button onClick={() => setMoveIndex(Math.min(moves.length, moveIndex + 1))} disabled={moveIndex === moves.length} style={{ ...commonStyles.buttonSecondary, padding: '8px 16px' }}>
              {'>'}
            </button>
            <button onClick={() => setMoveIndex(moves.length)} disabled={moveIndex === moves.length} style={{ ...commonStyles.buttonSecondary, padding: '8px 16px' }}>
              {'>|'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: 220 }}>
          <div style={commonStyles.card}>
            <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Result</div>
            <div style={{ color: game.result === 'win' ? colors.success : game.result === 'loss' ? colors.error : colors.warning, fontWeight: 700, fontSize: 18 }}>
              {game.result === 'win' ? 'Victory' : game.result === 'loss' ? 'Defeat' : 'Draw'}
            </div>
          </div>
          <div style={{ ...commonStyles.card, maxHeight: 400, overflowY: 'auto' }}>
            <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm }}>Moves</div>
            {moves.map((move, i) => (
              <span
                key={i}
                onClick={() => setMoveIndex(i + 1)}
                style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  margin: 1,
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  backgroundColor: moveIndex === i + 1 ? colors.accent : 'transparent',
                  color: moveIndex === i + 1 ? colors.white : colors.textSecondary,
                }}
              >
                {i % 2 === 0 && <span style={{ color: colors.textMuted }}>{Math.floor(i / 2) + 1}. </span>}
                {move}
              </span>
            ))}
          </div>
          <button onClick={() => navigate('/history')} style={commonStyles.buttonSecondary}>Back to History</button>
        </div>
      </div>
    </div>
  );
}
