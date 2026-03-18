import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import Board from '../components/Board';
import PgnPanel from '../components/PgnPanel';
import ShareButton from '../components/ShareButton';
import { useGameContext } from '../contexts/GameContext';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

export default function GameReplay() {
  const { gameId } = useParams();
  const { getGame } = useGameContext();
  const navigate = useNavigate();
  const game = useMemo(() => getGame(gameId), [gameId, getGame]);
  const [moveIndex, setMoveIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!game) return;
    const moves = game.moves || [];
    const handler = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setMoveIndex(i => Math.max(0, i - 1)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setMoveIndex(i => Math.min(moves.length, i + 1)); }
      else if (e.key === 'Home') { e.preventDefault(); setMoveIndex(0); }
      else if (e.key === 'End') { e.preventDefault(); setMoveIndex(moves.length); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [game]);

  if (!game) {
    return <div style={{ ...commonStyles.page, color: colors.textSecondary, textAlign: 'center', paddingTop: 80 }}>Game not found</div>;
  }

  const moves = game.moves || [];
  const positions = useMemo(() => {
    const chess = new Chess();
    const fens = [chess.fen()];
    for (const move of moves) { chess.move(move); fens.push(chess.fen()); }
    return fens;
  }, [moves]);

  const currentChess = useMemo(() => new Chess(positions[moveIndex]), [positions, moveIndex]);

  const NavBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...commonStyles.buttonSecondary,
        padding: '8px 16px',
        opacity: disabled ? 0.3 : 1,
        fontSize: 14,
        fontWeight: 600,
        transition: `all ${transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = colors.bgHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ ...commonStyles.page, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ color: colors.text, marginBottom: spacing.md, fontWeight: 600, letterSpacing: '-0.01em' }}>
        Game Replay: vs {game.opponentName}
      </h2>
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        <div>
          <Board game={currentChess} selectedSquare={null} legalMoves={[]} lastMove={null} onSquareClick={() => {}} onDragMove={() => {}} flipped={game.playerColor === 'b'} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md }}>
            <NavBtn onClick={() => setMoveIndex(0)} disabled={moveIndex === 0}>{'|<'}</NavBtn>
            <NavBtn onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))} disabled={moveIndex === 0}>{'<'}</NavBtn>
            <span style={{
              color: colors.textSecondary, display: 'flex', alignItems: 'center',
              fontSize: 14, padding: '0 12px', fontWeight: 500,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {moveIndex} / {moves.length}
            </span>
            <NavBtn onClick={() => setMoveIndex(Math.min(moves.length, moveIndex + 1))} disabled={moveIndex === moves.length}>{'>'}</NavBtn>
            <NavBtn onClick={() => setMoveIndex(moves.length)} disabled={moveIndex === moves.length}>{'>|'}</NavBtn>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: 240 }}>
          <div style={{
            ...commonStyles.card,
            background: `linear-gradient(135deg, ${colors.bgCard}, ${colors.bgDeep})`,
            textAlign: 'center',
          }}>
            <div style={{ color: colors.textDark, fontSize: 12, marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Result</div>
            <div style={{
              color: game.result === 'win' ? colors.success : game.result === 'loss' ? colors.error : colors.warning,
              fontWeight: 700, fontSize: 20,
            }}>
              {game.result === 'win' ? 'Victory' : game.result === 'loss' ? 'Defeat' : 'Draw'}
            </div>
          </div>
          <div style={{ ...commonStyles.card, maxHeight: 400, overflowY: 'auto', padding: spacing.sm }}>
            <div style={{ color: colors.textDark, fontSize: 11, marginBottom: spacing.sm, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', padding: `0 ${spacing.xs}px` }}>Moves</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {moves.map((move, i) => (
                <span
                  key={i}
                  onClick={() => setMoveIndex(i + 1)}
                  style={{
                    display: 'inline-block',
                    padding: '3px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: '"JetBrains Mono", monospace',
                    backgroundColor: moveIndex === i + 1 ? colors.accent : 'transparent',
                    color: moveIndex === i + 1 ? colors.white : colors.textSecondary,
                    transition: `all ${transitions.fast}`,
                    fontWeight: moveIndex === i + 1 ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (moveIndex !== i + 1) e.currentTarget.style.backgroundColor = colors.bgHover; }}
                  onMouseLeave={(e) => { if (moveIndex !== i + 1) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {i % 2 === 0 && <span style={{ color: colors.textDark, marginRight: 2 }}>{Math.floor(i / 2) + 1}.</span>}
                  {move}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => {
            localStorage.setItem('chess_analysis_pgn', game.pgn || '');
            navigate('/analysis');
          }} style={{
            ...commonStyles.button,
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
          }}>Analyze Game</button>
          <button onClick={() => navigate('/history')} style={commonStyles.buttonSecondary}>Back to History</button>
          <PgnPanel
            game={game}
            pgn={game.pgn}
            gameResult={game.result}
            opponentName={game.opponentName}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ShareButton
              gameId={gameId}
              pgn={game.pgn}
              result={game.result}
              opponentName={game.opponentName}
              moveCount={moves.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
