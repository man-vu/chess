import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameContext } from '../contexts/GameContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import { getItem } from '../utils/storage';
import { getEloTier } from '../utils/elo';
import { formatDate, formatTimeAgo, getWinRate } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

export default function Dashboard() {
  const { currentUser, isAuthenticated } = useAuth();
  const { getGames } = useGameContext();

  const news = useMemo(() => getItem('chess_news', []).slice(0, 3), []);
  const tournaments = useMemo(() => getItem('chess_tournaments', []).filter((t) => t.status === 'active' || t.status === 'upcoming').slice(0, 3), []);
  const topPlayers = useMemo(() => {
    const all = [...getItem('chess_players', []), ...getItem('chess_users', [])];
    return all.sort((a, b) => b.elo - a.elo).slice(0, 5);
  }, [currentUser]);
  const recentGames = useMemo(() => (isAuthenticated ? getGames(currentUser.id).slice(0, 5) : []), [isAuthenticated, currentUser, getGames]);

  return (
    <div style={commonStyles.page}>
      {/* Hero */}
      <div style={{
        ...commonStyles.card,
        textAlign: 'center',
        padding: `${spacing.xxxl}px ${spacing.xl}px`,
        marginBottom: spacing.xl,
        background: `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgDeep} 100%)`,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accentLight} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 56,
          marginBottom: spacing.md,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
          animation: 'fadeInScale 500ms ease',
        }}>{'\u265A'}</div>
        <h1 style={{
          color: colors.text,
          fontSize: 36,
          margin: `0 0 ${spacing.sm}px`,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          animation: 'fadeIn 400ms ease 100ms both',
        }}>
          {isAuthenticated ? `Welcome back, ${currentUser.username}` : 'Welcome to ChessArena'}
        </h1>
        <p style={{
          color: colors.textSecondary,
          fontSize: 16,
          margin: `0 0 ${spacing.lg}px`,
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
          animation: 'fadeIn 400ms ease 200ms both',
        }}>
          Play chess against AI or other players, join tournaments, and climb the rankings
        </p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', animation: 'fadeIn 400ms ease 300ms both' }}>
          <Link to="/play" style={{
            ...commonStyles.button,
            textDecoration: 'none',
            fontSize: 16,
            padding: '14px 36px',
            display: 'inline-block',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            boxShadow: `${shadows.md}, 0 0 20px ${colors.accentLight}`,
          }}>
            Play Now
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" style={{
              ...commonStyles.buttonSecondary,
              textDecoration: 'none',
              fontSize: 16,
              padding: '14px 36px',
              display: 'inline-block',
            }}>
              Create Account
            </Link>
          )}
        </div>
      </div>

      {/* User stats */}
      {isAuthenticated && (
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap', animation: 'fadeInUp 400ms ease' }}>
          <StatCard label="Your ELO" value={currentUser.elo} color={colors.accent} />
          <StatCard label="Games" value={currentUser.gamesPlayed} />
          <StatCard label="Wins" value={currentUser.wins} color={colors.success} />
          <StatCard label="Win Rate" value={getWinRate(currentUser.wins, currentUser.gamesPlayed)} color={colors.info} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.lg }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Recent games */}
          {isAuthenticated && recentGames.length > 0 && (
            <div style={commonStyles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <h3 style={{ color: colors.text, margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Games</h3>
                <Link to="/history" style={{ ...commonStyles.link, fontSize: 13, fontWeight: 500 }}>View all</Link>
              </div>
              {recentGames.map((g) => (
                <Link key={g.id} to={`/history/${g.id}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${colors.border}`,
                  textDecoration: 'none',
                  transition: `background-color ${transitions.fast}`,
                }}>
                  <span style={{ color: colors.text, fontWeight: 500 }}>vs {g.opponentName}</span>
                  <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                    <span style={{
                      color: g.result === 'win' ? colors.success : g.result === 'loss' ? colors.error : colors.warning,
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {g.result === 'win' ? 'Won' : g.result === 'loss' ? 'Lost' : 'Draw'}
                    </span>
                    <span style={{ color: colors.textDark, fontSize: 12 }}>{formatTimeAgo(g.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* News */}
          <div style={commonStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <h3 style={{ color: colors.text, margin: 0, fontSize: 16, fontWeight: 600 }}>Latest News</h3>
              <Link to="/news" style={{ ...commonStyles.link, fontSize: 13, fontWeight: 500 }}>View all</Link>
            </div>
            {news.map((article) => (
              <div key={article.id} style={{ padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
                <Link to="/news" style={{ color: colors.text, textDecoration: 'none', fontWeight: 500, fontSize: 15, lineHeight: 1.4 }}>{article.title}</Link>
                <div style={{ color: colors.textDark, fontSize: 12, marginTop: 4 }}>{formatDate(article.date)} &middot; {article.author}</div>
              </div>
            ))}
          </div>

          {/* Tournaments */}
          <div style={commonStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <h3 style={{ color: colors.text, margin: 0, fontSize: 16, fontWeight: 600 }}>Tournaments</h3>
              <Link to="/tournaments" style={{ ...commonStyles.link, fontSize: 13, fontWeight: 500 }}>View all</Link>
            </div>
            {tournaments.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ color: colors.text, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ color: colors.textDark, fontSize: 12, marginTop: 2 }}>{formatDate(t.startDate)} &middot; {t.format}</div>
                </div>
                <Badge text={t.status === 'active' ? 'Live' : 'Upcoming'} color={t.status === 'active' ? colors.success : colors.info} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Leaderboard */}
        <div style={commonStyles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <h3 style={{ color: colors.text, margin: 0, fontSize: 16, fontWeight: 600 }}>Top Players</h3>
            <Link to="/leaderboard" style={{ ...commonStyles.link, fontSize: 13, fontWeight: 500 }}>View all</Link>
          </div>
          {topPlayers.map((player, idx) => {
            const tier = getEloTier(player.elo);
            return (
              <Link key={player.id} to={`/profile/${player.id}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: '10px 0',
                borderBottom: `1px solid ${colors.border}`,
                textDecoration: 'none',
                transition: `background-color ${transitions.fast}`,
              }}>
                <span style={{
                  color: idx < 3 ? [colors.gold, colors.silver, colors.bronze][idx] : colors.textDark,
                  fontWeight: 700,
                  width: 24,
                  fontSize: idx < 3 ? 16 : 14,
                }}>{idx + 1}</span>
                <Avatar username={player.username} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}>{player.username}</div>
                  <div style={{ fontSize: 11, color: tier.color }}>{tier.name}</div>
                </div>
                <span style={{ color: colors.accent, fontWeight: 700, fontSize: 14 }}>{player.elo}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
