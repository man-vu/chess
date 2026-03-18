import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import { formatDate } from '../utils/formatters';
import { colors, commonStyles, spacing } from '../theme';

export default function GameHistory() {
  const { currentUser } = useAuth();
  const { getGames } = useGameContext();
  const games = useMemo(() => getGames(currentUser?.id), [currentUser, getGames]);

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg }}>Game History</h1>
      {games.length === 0 ? (
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl }}>
          <p style={{ color: colors.textSecondary, fontSize: 16 }}>No games played yet.</p>
          <Link to="/play" style={{ ...commonStyles.link, fontSize: 16, fontWeight: 600 }}>Play your first game</Link>
        </div>
      ) : (
        <div style={commonStyles.card}>
          <div style={{ display: 'flex', padding: '12px 16px', borderBottom: `2px solid ${colors.border}`, color: colors.textMuted, fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>Opponent</div>
            <div style={{ width: 80 }}>Mode</div>
            <div style={{ width: 80, textAlign: 'center' }}>Result</div>
            <div style={{ width: 80, textAlign: 'center' }}>ELO +/-</div>
            <div style={{ width: 80, textAlign: 'center' }}>Moves</div>
            <div style={{ width: 120, textAlign: 'right' }}>Date</div>
          </div>
          {games.map((g) => (
            <Link key={g.id} to={`/history/${g.id}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, textDecoration: 'none', color: colors.text }}>
              <div style={{ flex: 1, fontWeight: 500 }}>{g.opponentName}</div>
              <div style={{ width: 80, color: colors.textMuted, fontSize: 13 }}>{g.mode}</div>
              <div style={{ width: 80, textAlign: 'center', fontWeight: 600, color: g.result === 'win' ? colors.success : g.result === 'loss' ? colors.error : colors.warning }}>
                {g.result === 'win' ? 'Won' : g.result === 'loss' ? 'Lost' : 'Draw'}
              </div>
              <div style={{ width: 80, textAlign: 'center', color: (g.eloChange || 0) >= 0 ? colors.success : colors.error, fontSize: 13 }}>
                {g.eloChange != null ? ((g.eloChange >= 0 ? '+' : '') + g.eloChange) : '-'}
              </div>
              <div style={{ width: 80, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>{g.moves?.length || 0}</div>
              <div style={{ width: 120, textAlign: 'right', color: colors.textMuted, fontSize: 13 }}>{formatDate(g.date)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
