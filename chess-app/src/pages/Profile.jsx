import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import { getItem } from '../utils/storage';
import { getEloTier } from '../utils/elo';
import { formatDate, getWinRate } from '../utils/formatters';
import { colors, commonStyles, spacing, shadows, transitions } from '../theme';

export default function Profile() {
  const { userId } = useParams();
  const { currentUser, updateProfile } = useAuth();
  const { getGames } = useGameContext();
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');

  const user = useMemo(() => {
    if (currentUser && currentUser.id === userId) return currentUser;
    const users = getItem('chess_users', []);
    const found = users.find((u) => u.id === userId);
    if (found) return found;
    const players = getItem('chess_players', []);
    return players.find((p) => p.id === userId) || null;
  }, [userId, currentUser]);

  const games = useMemo(() => getGames(userId), [userId, getGames]);
  const isOwn = currentUser && currentUser.id === userId;

  if (!user) {
    return <div style={{ ...commonStyles.page, color: colors.textSecondary, textAlign: 'center', paddingTop: 80, fontSize: 16 }}>Player not found</div>;
  }

  const tier = getEloTier(user.elo);
  const totalGames = user.gamesPlayed || 0;
  const eloHistory = user.eloHistory || [];

  const startEditBio = () => { setBio(user.bio || ''); setEditingBio(true); };
  const saveBio = () => { updateProfile({ bio }); setEditingBio(false); };

  return (
    <div style={commonStyles.page}>
      <div style={{
        ...commonStyles.card, display: 'flex', gap: spacing.xl, alignItems: 'center', marginBottom: spacing.lg,
        background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgDeep} 100%)`,
        animation: 'fadeIn 400ms ease',
      }}>
        <Avatar username={user.username} size={80} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
            <h1 style={{ color: colors.text, fontSize: 28, margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>{user.username}</h1>
            <Badge text={tier.name} color={tier.color} />
          </div>
          <div style={{ color: colors.accent, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{user.elo} ELO</div>
          <div style={{ color: colors.textDark, fontSize: 13 }}>Member since {formatDate(user.joinedAt)}</div>
          {editingBio ? (
            <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.sm }}>
              <input value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...commonStyles.input, flex: 1 }} placeholder="Write something about yourself..."
                onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
                onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
              />
              <button onClick={saveBio} style={{ ...commonStyles.button, padding: '8px 16px' }}>Save</button>
            </div>
          ) : (
            <div style={{ marginTop: spacing.sm }}>
              <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{user.bio || 'No bio yet.'}</p>
              {isOwn && (
                <button onClick={startEditBio} style={{
                  ...commonStyles.buttonSecondary, padding: '4px 12px', fontSize: 12, marginTop: 6,
                }}>Edit Bio</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap', animation: 'fadeInUp 400ms ease 100ms both' }}>
        <StatCard label="Games Played" value={totalGames} />
        <StatCard label="Wins" value={user.wins || 0} color={colors.success} />
        <StatCard label="Losses" value={user.losses || 0} color={colors.error} />
        <StatCard label="Draws" value={user.draws || 0} color={colors.warning} />
        <StatCard label="Win Rate" value={getWinRate(user.wins || 0, totalGames)} color={colors.info} />
      </div>

      {eloHistory.length > 1 && (
        <div style={{ ...commonStyles.card, marginBottom: spacing.lg }}>
          <h3 style={{ color: colors.text, marginTop: 0, marginBottom: spacing.md, fontWeight: 600 }}>ELO History</h3>
          <EloChart history={eloHistory} />
        </div>
      )}

      {games.length > 0 && (
        <div style={commonStyles.card}>
          <h3 style={{ color: colors.text, marginTop: 0, marginBottom: spacing.md, fontWeight: 600 }}>Recent Games</h3>
          {games.slice(0, 10).map((g) => (
            <div key={g.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: `1px solid ${colors.border}`,
            }}>
              <div>
                <span style={{ color: colors.text, fontWeight: 500 }}>vs {g.opponentName}</span>
                <span style={{ color: colors.textDark, fontSize: 12, marginLeft: 8 }}>{g.mode}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{ color: g.result === 'win' ? colors.success : g.result === 'loss' ? colors.error : colors.warning, fontWeight: 600, fontSize: 14 }}>
                  {g.result === 'win' ? 'Won' : g.result === 'loss' ? 'Lost' : 'Draw'}
                </span>
                {g.eloChange != null && (
                  <span style={{ color: g.eloChange >= 0 ? colors.success : colors.error, fontSize: 12, fontWeight: 600 }}>
                    {g.eloChange >= 0 ? '+' : ''}{g.eloChange}
                  </span>
                )}
                <span style={{ color: colors.textDark, fontSize: 12 }}>{formatDate(g.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EloChart({ history }) {
  const width = 600;
  const height = 150;
  const padding = 30;
  const values = history.map((h) => h.elo);
  const min = Math.min(...values) - 50;
  const max = Math.max(...values) + 50;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((v - min) / (max - min)) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${padding + ((values.length - 1) / (values.length - 1)) * (width - 2 * padding)},${height - padding}`, `${padding},${height - padding}`].join(' ');

  return (
    <svg width={width} height={height} style={{ width: '100%', maxWidth: width }}>
      <defs>
        <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#eloGrad)" points={areaPoints} />
      <polyline fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
      {values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((v - min) / (max - min)) * (height - 2 * padding);
        return <circle key={i} cx={x} cy={y} r={4} fill={colors.bgCard} stroke={colors.accent} strokeWidth="2" />;
      })}
      <text x={padding} y={height - 5} fill={colors.textDark} fontSize={10} fontFamily="Inter, sans-serif">{min}</text>
      <text x={padding} y={15} fill={colors.textDark} fontSize={10} fontFamily="Inter, sans-serif">{max}</text>
    </svg>
  );
}
