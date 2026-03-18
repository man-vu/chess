import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/common/Badge';
import { ACHIEVEMENTS, checkAchievements, getAchievement, RARITY_COLORS } from '../data/achievements';
import { getItem, setItem } from '../utils/storage';
import { colors, commonStyles, spacing, borderRadius, shadows, transitions } from '../theme';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'games', label: 'Games' },
  { key: 'rating', label: 'Rating' },
  { key: 'social', label: 'Social' },
  { key: 'special', label: 'Special' },
];

function buildStats(user) {
  const puzzlesSolved = getItem('chess_puzzles_solved', 0);
  return {
    wins: user.wins || 0,
    losses: user.losses || 0,
    draws: user.draws || 0,
    gamesPlayed: user.gamesPlayed || 0,
    elo: user.elo || 800,
    streak: user.streak || 0,
    consecutiveWinsMax: user.consecutiveWinsMax || 0,
    forumPosts: user.forumPosts || 0,
    chatMessages: user.chatMessages || 0,
    tournamentsJoined: user.tournamentsJoined || 0,
    puzzlesSolved,
    shortestWin: user.shortestWin || 0,
    longestGame: user.longestGame || 0,
    usedEditor: user.usedEditor || false,
    bulletWins: user.bulletWins || 0,
    rapidWins: user.rapidWins || 0,
  };
}

export default function Achievements() {
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);

  const stats = useMemo(() => {
    if (!currentUser) return null;
    return buildStats(currentUser);
  }, [currentUser]);

  const unlockedMap = useMemo(() => {
    const saved = getItem('chess_achievements', []);
    const map = {};
    saved.forEach((entry) => {
      map[entry.id] = entry.date;
    });
    return map;
  }, [currentUser]);

  // Check for newly unlocked achievements and persist them
  useEffect(() => {
    if (!stats) return;
    const newlyUnlocked = checkAchievements(stats);
    const saved = getItem('chess_achievements', []);
    const savedIds = new Set(saved.map((e) => e.id));
    let changed = false;
    const updated = [...saved];

    newlyUnlocked.forEach((id) => {
      if (!savedIds.has(id)) {
        updated.push({ id, date: new Date().toISOString() });
        changed = true;
      }
    });

    if (changed) {
      setItem('chess_achievements', updated);
    }
  }, [stats]);

  const unlockedIds = useMemo(() => {
    if (!stats) return new Set();
    const saved = getItem('chess_achievements', []);
    const ids = new Set(saved.map((e) => e.id));
    checkAchievements(stats).forEach((id) => ids.add(id));
    return ids;
  }, [stats, unlockedMap]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const totalUnlocked = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).length;
  }, [unlockedIds]);

  const progressPct = ACHIEVEMENTS.length > 0
    ? Math.round((totalUnlocked / ACHIEVEMENTS.length) * 100)
    : 0;

  if (!currentUser) {
    return (
      <div style={commonStyles.page}>
        <div style={{ ...commonStyles.card, textAlign: 'center', padding: spacing.xxl }}>
          <p style={{ color: colors.textSecondary, fontSize: 16 }}>
            Please log in to view your achievements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page}>
      <h1 style={{
        color: colors.text,
        marginBottom: spacing.lg,
        fontWeight: 800,
        letterSpacing: '-0.02em',
      }}>
        Achievements
      </h1>

      {/* Stats summary */}
      <div style={{
        ...commonStyles.card,
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: 700,
            marginBottom: spacing.xs,
          }}>
            {totalUnlocked}/{ACHIEVEMENTS.length} Unlocked
          </div>
          <div style={{
            width: '100%',
            height: 10,
            backgroundColor: colors.bgDeep,
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              backgroundColor: colors.accent,
              borderRadius: borderRadius.xl,
              transition: `width ${transitions.slow}`,
            }} />
          </div>
          <div style={{
            color: colors.textMuted,
            fontSize: 13,
            marginTop: spacing.xs,
          }}>
            {progressPct}% complete
          </div>
        </div>

        {/* Rarity breakdown */}
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          {Object.entries(RARITY_COLORS).map(([rarity, color]) => {
            const total = ACHIEVEMENTS.filter((a) => a.rarity === rarity).length;
            const unlocked = ACHIEVEMENTS.filter(
              (a) => a.rarity === rarity && unlockedIds.has(a.id)
            ).length;
            return (
              <div key={rarity} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color,
                }}>
                  {unlocked}/{total}
                </div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.textMuted,
                  textTransform: 'capitalize',
                }}>
                  {rarity}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: spacing.xs,
        marginBottom: spacing.lg,
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const isHovered = hoveredTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              onMouseEnter={() => setHoveredTab(cat.key)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: `background-color ${transitions.fast}, color ${transitions.fast}`,
                backgroundColor: isActive
                  ? colors.accent
                  : isHovered
                    ? colors.bgHover
                    : colors.bgCard,
                color: isActive ? colors.white : colors.textSecondary,
                outline: 'none',
              }}
              aria-pressed={isActive}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Achievement grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: spacing.md,
      }} role="list" aria-label="Achievements list">
        {filtered.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const rarityColor = RARITY_COLORS[achievement.rarity];
          const isHovered = hoveredCard === achievement.id;
          const saved = getItem('chess_achievements', []);
          const savedEntry = saved.find((e) => e.id === achievement.id);
          const unlockDate = savedEntry ? savedEntry.date : null;

          return (
            <div
              key={achievement.id}
              role="listitem"
              onMouseEnter={() => setHoveredCard(achievement.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...commonStyles.card,
                position: 'relative',
                borderColor: isUnlocked ? rarityColor : colors.border,
                borderWidth: isUnlocked ? 1 : 1,
                opacity: isUnlocked ? 1 : 0.55,
                filter: isUnlocked ? 'none' : 'grayscale(80%)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered && isUnlocked
                  ? `0 8px 24px ${rarityColor}22, ${shadows.md}`
                  : shadows.sm,
                transition: `transform ${transitions.fast}, box-shadow ${transitions.fast}, opacity ${transitions.fast}, border-color ${transitions.fast}`,
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}
            >
              {/* Lock overlay for locked achievements */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  fontSize: 16,
                  opacity: 0.6,
                }} aria-hidden="true">
                  {'\u{1F512}'}
                </div>
              )}

              {/* Icon and name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{ fontSize: 32, lineHeight: 1 }} aria-hidden="true">
                  {achievement.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {achievement.name}
                  </div>
                  <Badge
                    text={achievement.rarity}
                    color={rarityColor}
                    style={{ marginTop: 2, textTransform: 'capitalize' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {achievement.description}
              </div>

              {/* Unlock date */}
              {isUnlocked && unlockDate && (
                <div style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  marginTop: 'auto',
                  paddingTop: spacing.xs,
                  borderTop: `1px solid ${colors.border}`,
                }}>
                  Unlocked {new Date(unlockDate).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
