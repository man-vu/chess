import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { getItem } from '../utils/storage';
import { getEloTier } from '../utils/elo';
import { getWinRate } from '../utils/formatters';
import { colors, commonStyles, spacing, transitions } from '../theme';

const medalColors = [colors.gold, colors.silver, colors.bronze];

export default function Leaderboard() {
  const { currentUser } = useAuth();

  const players = useMemo(() => {
    const bots = getItem('chess_players', []);
    const users = getItem('chess_users', []);
    return [...bots, ...users].sort((a, b) => b.elo - a.elo);
  }, [currentUser]);

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg, fontWeight: 800, letterSpacing: '-0.02em' }}>Leaderboard</h1>
      <div style={{ ...commonStyles.card, overflow: 'hidden', padding: 0 }}>
        <div style={{
          display: 'flex', padding: '14px 20px',
          borderBottom: `2px solid ${colors.border}`,
          color: colors.textDark, fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          backgroundColor: colors.bgDeep,
        }}>
          <div style={{ width: 50 }}>#</div>
          <div style={{ flex: 1 }}>Player</div>
          <div style={{ width: 100, textAlign: 'right' }}>ELO</div>
          <div style={{ width: 80, textAlign: 'right' }}>W/L/D</div>
          <div style={{ width: 80, textAlign: 'right' }}>Games</div>
          <div style={{ width: 80, textAlign: 'right' }}>Win Rate</div>
        </div>
        {players.map((player, idx) => {
          const tier = getEloTier(player.elo);
          const isCurrentUser = currentUser && player.id === currentUser.id;
          return (
            <div
              key={player.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px',
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isCurrentUser ? colors.accentSoft : idx % 2 === 0 ? 'transparent' : colors.bgDeep,
                transition: `background-color ${transitions.fast}`,
              }}
              onMouseEnter={(e) => { if (!isCurrentUser) e.currentTarget.style.backgroundColor = colors.bgHover; }}
              onMouseLeave={(e) => { if (!isCurrentUser) e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : colors.bgDeep; }}
            >
              <div style={{ width: 50, fontWeight: 700, color: idx < 3 ? medalColors[idx] : colors.textDark, fontSize: idx < 3 ? 18 : 14 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Avatar username={player.username} size={32} />
                <Link to={`/profile/${player.id}`} style={{ color: colors.text, textDecoration: 'none', fontWeight: 500, fontSize: 15, transition: `color ${transitions.fast}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.text; }}
                >
                  {player.username}
                </Link>
                <Badge text={tier.name} color={tier.color} style={{ fontSize: 10 }} />
                {isCurrentUser && <span style={{ fontSize: 11, color: colors.accent, fontWeight: 700, padding: '2px 6px', backgroundColor: colors.accentLight, borderRadius: 4 }}>YOU</span>}
              </div>
              <div style={{ width: 100, textAlign: 'right', color: colors.accent, fontWeight: 700 }}>{player.elo}</div>
              <div style={{ width: 80, textAlign: 'right', color: colors.textSecondary, fontSize: 13 }}>{player.wins || 0}/{player.losses || 0}/{player.draws || 0}</div>
              <div style={{ width: 80, textAlign: 'right', color: colors.textSecondary, fontSize: 13 }}>{player.gamesPlayed || 0}</div>
              <div style={{ width: 80, textAlign: 'right', color: colors.textSecondary, fontSize: 13 }}>{getWinRate(player.wins || 0, player.gamesPlayed || 0)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
