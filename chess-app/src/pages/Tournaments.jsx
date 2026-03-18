import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/common/Badge';
import { getItem, setItem } from '../utils/storage';
import { formatDate } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius } from '../theme';

const STATUS_COLORS = { upcoming: '#3498db', active: '#81b64c', completed: '#888' };
const STATUS_LABELS = { upcoming: 'Upcoming', active: 'Live', completed: 'Completed' };

export default function Tournaments() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('upcoming');
  const [refresh, setRefresh] = useState(0);

  const tournaments = useMemo(() => getItem('chess_tournaments', []), [refresh]);
  const filtered = tournaments.filter((t) => t.status === tab);

  const register = (tourneyId) => {
    if (!currentUser) return;
    const all = getItem('chess_tournaments', []);
    const idx = all.findIndex((t) => t.id === tourneyId);
    if (idx === -1) return;
    if (all[idx].registeredIds.includes(currentUser.id)) return;
    if (all[idx].participants >= all[idx].maxParticipants) return;
    all[idx].registeredIds.push(currentUser.id);
    all[idx].participants += 1;
    setItem('chess_tournaments', all);
    setRefresh((r) => r + 1);
  };

  const players = useMemo(() => getItem('chess_players', []), []);

  return (
    <div style={commonStyles.page}>
      <h1 style={{ color: colors.text, marginBottom: spacing.lg }}>Tournaments</h1>
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg }}>
        {['upcoming', 'active', 'completed'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...commonStyles.button, backgroundColor: tab === t ? colors.accent : 'transparent', border: `2px solid ${tab === t ? colors.accent : colors.borderLight}`, color: tab === t ? colors.white : colors.textSecondary }}>
            {STATUS_LABELS[t]}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl, color: colors.textSecondary }}>
          No {tab} tournaments
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {filtered.map((tourney) => {
            const isRegistered = currentUser && tourney.registeredIds.includes(currentUser.id);
            const isFull = tourney.participants >= tourney.maxParticipants;
            const eloInRange = !currentUser || (currentUser.elo >= tourney.eloRange[0] && currentUser.elo <= tourney.eloRange[1]);
            return (
              <div key={tourney.id} style={commonStyles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                      <h3 style={{ color: colors.text, margin: 0 }}>{tourney.name}</h3>
                      <Badge text={STATUS_LABELS[tourney.status]} color={STATUS_COLORS[tourney.status]} />
                    </div>
                    <p style={{ color: colors.textSecondary, margin: 0, fontSize: 14 }}>{tourney.description}</p>
                  </div>
                  {tourney.status === 'upcoming' && currentUser && (
                    <button
                      onClick={() => register(tourney.id)}
                      disabled={isRegistered || isFull || !eloInRange}
                      style={{
                        ...commonStyles.button,
                        opacity: isRegistered || isFull || !eloInRange ? 0.5 : 1,
                        backgroundColor: isRegistered ? colors.bgDeep : colors.accent,
                        color: isRegistered ? colors.textSecondary : colors.white,
                      }}
                    >
                      {isRegistered ? 'Registered' : isFull ? 'Full' : !eloInRange ? 'ELO Out of Range' : 'Register'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: spacing.xl, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Format', value: tourney.format },
                    { label: 'Rounds', value: tourney.rounds || 'Arena' },
                    { label: 'Dates', value: `${formatDate(tourney.startDate)} - ${formatDate(tourney.endDate)}` },
                    { label: 'Players', value: `${tourney.participants}/${tourney.maxParticipants}` },
                    { label: 'ELO Range', value: tourney.eloRange[1] === 9999 ? `${tourney.eloRange[0]}+` : `${tourney.eloRange[0]}-${tourney.eloRange[1]}` },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                      <div style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {tourney.standings && (
                  <div style={{ marginTop: spacing.md, borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
                    <h4 style={{ color: colors.textSecondary, marginTop: 0, marginBottom: spacing.sm }}>Standings</h4>
                    {tourney.standings.map((s, idx) => {
                      const player = players.find((p) => p.id === s.playerId);
                      return (
                        <div key={s.playerId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                          <span style={{ color: colors.text, fontSize: 14 }}>{idx + 1}. {player?.username || 'Unknown'}</span>
                          <span style={{ color: colors.accent, fontSize: 14, fontWeight: 600 }}>{s.points}/{s.played}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
