import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { getItem } from '../utils/storage';
import { getEloTier } from '../utils/elo';
import { getWinRate } from '../utils/formatters';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

function getAllPlayers() {
  const players = getItem('chess_players', []);
  const users = getItem('chess_users', []);
  const map = new Map();
  players.forEach((p) => map.set(p.id, p));
  users.forEach((u) => {
    if (!map.has(u.id)) map.set(u.id, u);
  });
  return Array.from(map.values());
}

function StatBar({ label, value1, value2, format, higherIsBetter = true }) {
  const num1 = typeof value1 === 'number' ? value1 : parseFloat(value1) || 0;
  const num2 = typeof value2 === 'number' ? value2 : parseFloat(value2) || 0;
  const maxVal = Math.max(num1, num2, 1);
  const pct1 = (num1 / maxVal) * 100;
  const pct2 = (num2 / maxVal) * 100;

  const display1 = format ? format(value1) : String(value1);
  const display2 = format ? format(value2) : String(value2);

  let color1 = colors.textSecondary;
  let color2 = colors.textSecondary;
  if (num1 !== num2) {
    const winner = higherIsBetter ? (num1 > num2 ? 1 : 2) : (num1 < num2 ? 1 : 2);
    if (winner === 1) color1 = colors.accent;
    else color2 = colors.accent;
  }

  return (
    <div style={{ marginBottom: spacing.md }}>
      <div style={{
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        {/* Player 1 value */}
        <span style={{
          width: 60,
          textAlign: 'right',
          color: color1,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {display1}
        </span>
        {/* Player 1 bar (right-aligned) */}
        <div style={{
          flex: 1,
          height: 24,
          backgroundColor: colors.bgDeep,
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            width: `${pct1}%`,
            height: '100%',
            backgroundColor: color1 === colors.accent ? colors.accent : colors.borderLight,
            borderRadius: borderRadius.sm,
            transition: `width ${transitions.slow}`,
          }} />
        </div>
        {/* Divider */}
        <div style={{
          width: 2,
          height: 24,
          backgroundColor: colors.borderLight,
          flexShrink: 0,
        }} />
        {/* Player 2 bar (left-aligned) */}
        <div style={{
          flex: 1,
          height: 24,
          backgroundColor: colors.bgDeep,
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'flex-start',
        }}>
          <div style={{
            width: `${pct2}%`,
            height: '100%',
            backgroundColor: color2 === colors.accent ? colors.accent : colors.borderLight,
            borderRadius: borderRadius.sm,
            transition: `width ${transitions.slow}`,
          }} />
        </div>
        {/* Player 2 value */}
        <span style={{
          width: 60,
          textAlign: 'left',
          color: color2,
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {display2}
        </span>
      </div>
    </div>
  );
}

function PlayerSelector({ players, selectedId, onChange, label }) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <label style={{
        display: 'block',
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
      }}>
        {label}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...commonStyles.input,
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239e9ea7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
          paddingRight: 40,
        }}
        onFocus={(e) => { e.target.style.borderColor = colors.borderFocus; }}
        onBlur={(e) => { e.target.style.borderColor = colors.borderLight; }}
      >
        <option value="">Select a player...</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.username} ({p.elo || 1200} ELO)
          </option>
        ))}
      </select>
    </div>
  );
}

function PlayerCard({ player }) {
  if (!player) return null;
  const tier = getEloTier(player.elo || 1200);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
    }}>
      <Avatar username={player.username} size={64} />
      <div style={{
        color: colors.text,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}>
        {player.username}
      </div>
      <Badge text={tier.name} color={tier.color} />
      <div style={{
        color: colors.accent,
        fontSize: 24,
        fontWeight: 800,
      }}>
        {player.elo || 1200}
      </div>
    </div>
  );
}

export default function PlayerCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const players = useMemo(() => getAllPlayers(), []);

  const [p1Id, setP1Id] = useState(searchParams.get('p1') || '');
  const [p2Id, setP2Id] = useState(searchParams.get('p2') || '');

  const player1 = useMemo(() => players.find((p) => p.id === p1Id) || null, [players, p1Id]);
  const player2 = useMemo(() => players.find((p) => p.id === p2Id) || null, [players, p2Id]);

  const handleP1Change = (id) => {
    setP1Id(id);
    const params = new URLSearchParams(searchParams);
    if (id) params.set('p1', id); else params.delete('p1');
    setSearchParams(params, { replace: true });
  };

  const handleP2Change = (id) => {
    setP2Id(id);
    const params = new URLSearchParams(searchParams);
    if (id) params.set('p2', id); else params.delete('p2');
    setSearchParams(params, { replace: true });
  };

  // Head-to-head from game history
  const h2h = useMemo(() => {
    if (!player1 || !player2) return null;
    const games = getItem('chess_games', []);
    let p1Wins = 0;
    let p2Wins = 0;
    let draws = 0;
    games.forEach((g) => {
      const isP1White = g.whiteId === player1.id && g.blackId === player2.id;
      const isP1Black = g.blackId === player1.id && g.whiteId === player2.id;
      if (!isP1White && !isP1Black) return;
      if (g.result === 'draw') { draws++; return; }
      const winnerId = g.winnerId || (g.result === '1-0' ? g.whiteId : g.result === '0-1' ? g.blackId : null);
      if (winnerId === player1.id) p1Wins++;
      else if (winnerId === player2.id) p2Wins++;
      else draws++;
    });
    return { p1Wins, p2Wins, draws, total: p1Wins + p2Wins + draws };
  }, [player1, player2]);

  const bothSelected = player1 && player2;

  return (
    <div style={commonStyles.page}>
      {/* Header */}
      <div style={{ marginBottom: spacing.xl, animation: 'fadeIn 400ms ease' }}>
        <h1 style={{
          color: colors.text,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: spacing.xs,
        }}>
          Player Comparison
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: 15, margin: 0 }}>
          Compare stats and performance between two players
        </p>
      </div>

      {/* Player Selectors */}
      <div style={{
        ...commonStyles.card,
        marginBottom: spacing.lg,
        animation: 'fadeIn 400ms ease 50ms both',
      }}>
        <div style={{
          display: 'flex',
          gap: spacing.lg,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}>
          <PlayerSelector
            players={players.filter((p) => p.id !== p2Id)}
            selectedId={p1Id}
            onChange={handleP1Change}
            label="Player 1"
          />
          <div style={{
            color: colors.textMuted,
            fontSize: 16,
            fontWeight: 700,
            padding: '12px 0',
            flexShrink: 0,
          }}>
            VS
          </div>
          <PlayerSelector
            players={players.filter((p) => p.id !== p1Id)}
            selectedId={p2Id}
            onChange={handleP2Change}
            label="Player 2"
          />
        </div>
      </div>

      {bothSelected && (
        <>
          {/* Player Cards Side by Side */}
          <div style={{
            display: 'flex',
            gap: spacing.lg,
            marginBottom: spacing.lg,
            animation: 'fadeInUp 400ms ease 100ms both',
          }}>
            <div style={{ ...commonStyles.card, flex: 1, textAlign: 'center' }}>
              <PlayerCard player={player1} />
            </div>
            <div style={{ ...commonStyles.card, flex: 1, textAlign: 'center' }}>
              <PlayerCard player={player2} />
            </div>
          </div>

          {/* Stat Comparison Bars */}
          <div style={{
            ...commonStyles.card,
            marginBottom: spacing.lg,
            animation: 'fadeInUp 400ms ease 180ms both',
          }}>
            <h3 style={{
              color: colors.text,
              margin: 0,
              marginBottom: spacing.lg,
              fontWeight: 600,
              textAlign: 'center',
            }}>
              Stats Comparison
            </h3>
            <StatBar
              label="ELO Rating"
              value1={player1.elo || 1200}
              value2={player2.elo || 1200}
              higherIsBetter={true}
            />
            <StatBar
              label="Games Played"
              value1={player1.gamesPlayed || 0}
              value2={player2.gamesPlayed || 0}
              higherIsBetter={true}
            />
            <StatBar
              label="Wins"
              value1={player1.wins || 0}
              value2={player2.wins || 0}
              higherIsBetter={true}
            />
            <StatBar
              label="Losses"
              value1={player1.losses || 0}
              value2={player2.losses || 0}
              higherIsBetter={false}
            />
            <StatBar
              label="Draws"
              value1={player1.draws || 0}
              value2={player2.draws || 0}
              higherIsBetter={true}
            />
            <StatBar
              label="Win Rate"
              value1={player1.gamesPlayed ? Math.round(((player1.wins || 0) / player1.gamesPlayed) * 100) : 0}
              value2={player2.gamesPlayed ? Math.round(((player2.wins || 0) / player2.gamesPlayed) * 100) : 0}
              format={(v) => `${v}%`}
              higherIsBetter={true}
            />
          </div>

          {/* Head to Head */}
          {h2h && h2h.total > 0 && (
            <div style={{
              ...commonStyles.card,
              animation: 'fadeInUp 400ms ease 260ms both',
            }}>
              <h3 style={{
                color: colors.text,
                margin: 0,
                marginBottom: spacing.lg,
                fontWeight: 600,
                textAlign: 'center',
              }}>
                Head-to-Head Record
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xl,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: h2h.p1Wins > h2h.p2Wins ? colors.accent : colors.text,
                    fontSize: 36,
                    fontWeight: 800,
                  }}>
                    {h2h.p1Wins}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
                    {player1.username}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: colors.textMuted,
                    fontSize: 24,
                    fontWeight: 700,
                  }}>
                    {h2h.draws}
                  </div>
                  <div style={{ color: colors.textDark, fontSize: 12 }}>Draws</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: h2h.p2Wins > h2h.p1Wins ? colors.accent : colors.text,
                    fontSize: 36,
                    fontWeight: 800,
                  }}>
                    {h2h.p2Wins}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
                    {player2.username}
                  </div>
                </div>
              </div>
              {/* Visual bar for H2H */}
              <div style={{
                marginTop: spacing.lg,
                height: 8,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.bgDeep,
                overflow: 'hidden',
                display: 'flex',
              }}>
                {h2h.p1Wins > 0 && (
                  <div style={{
                    flex: h2h.p1Wins,
                    backgroundColor: colors.accent,
                    transition: `flex ${transitions.slow}`,
                  }} />
                )}
                {h2h.draws > 0 && (
                  <div style={{
                    flex: h2h.draws,
                    backgroundColor: colors.warning,
                    transition: `flex ${transitions.slow}`,
                  }} />
                )}
                {h2h.p2Wins > 0 && (
                  <div style={{
                    flex: h2h.p2Wins,
                    backgroundColor: colors.info,
                    transition: `flex ${transitions.slow}`,
                  }} />
                )}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: spacing.xs,
              }}>
                <span style={{ color: colors.textDark, fontSize: 11 }}>{h2h.total} game{h2h.total !== 1 ? 's' : ''} played</span>
              </div>
            </div>
          )}

          {h2h && h2h.total === 0 && (
            <div style={{
              ...commonStyles.card,
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: 14,
              animation: 'fadeInUp 400ms ease 260ms both',
            }}>
              No head-to-head games found between these players.
            </div>
          )}
        </>
      )}

      {!bothSelected && (
        <div style={{
          ...commonStyles.card,
          textAlign: 'center',
          padding: spacing.xxxl,
          color: colors.textMuted,
          animation: 'fadeIn 400ms ease 100ms both',
        }}>
          <div style={{ fontSize: 48, marginBottom: spacing.md, opacity: 0.5 }}>&#9878;</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: spacing.xs }}>
            Select two players to compare
          </div>
          <div style={{ fontSize: 14 }}>
            Choose players from the dropdowns above to see a detailed comparison.
          </div>
        </div>
      )}
    </div>
  );
}
