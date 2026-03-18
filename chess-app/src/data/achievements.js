export const RARITY_COLORS = {
  common: '#9e9ea7',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

export const ACHIEVEMENTS = [
  // Games category
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '\u{1F3C6}',
    category: 'games',
    rarity: 'common',
    check: (stats) => stats.wins >= 1,
  },
  {
    id: 'winning_streak',
    name: 'Winning Streak',
    description: 'Win 3 games in a row',
    icon: '\u{1F525}',
    category: 'games',
    rarity: 'uncommon',
    check: (stats) => stats.streak >= 3,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Play 100 games',
    icon: '\u{1F4AF}',
    category: 'games',
    rarity: 'rare',
    check: (stats) => stats.gamesPlayed >= 100,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Win 10 games without a loss',
    icon: '\u{2B50}',
    category: 'games',
    rarity: 'epic',
    check: (stats) => stats.consecutiveWinsMax >= 10,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win a bullet game',
    icon: '\u{26A1}',
    category: 'games',
    rarity: 'uncommon',
    check: (stats) => stats.bulletWins >= 1,
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Win a rapid game',
    icon: '\u{1F6E1}\u{FE0F}',
    category: 'games',
    rarity: 'uncommon',
    check: (stats) => stats.rapidWins >= 1,
  },

  // Rating category
  {
    id: 'beginner_no_more',
    name: 'Beginner No More',
    description: 'Reach 1000 ELO',
    icon: '\u{1F4C8}',
    category: 'rating',
    rarity: 'common',
    check: (stats) => stats.elo >= 1000,
  },
  {
    id: 'club_player',
    name: 'Club Player',
    description: 'Reach 1200 ELO',
    icon: '\u{265F}\u{FE0F}',
    category: 'rating',
    rarity: 'common',
    check: (stats) => stats.elo >= 1200,
  },
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Reach 1500 ELO',
    icon: '\u{1F31F}',
    category: 'rating',
    rarity: 'uncommon',
    check: (stats) => stats.elo >= 1500,
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Reach 1800 ELO',
    icon: '\u{1F9E0}',
    category: 'rating',
    rarity: 'rare',
    check: (stats) => stats.elo >= 1800,
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Reach 2000 ELO',
    icon: '\u{1F451}',
    category: 'rating',
    rarity: 'epic',
    check: (stats) => stats.elo >= 2000,
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    description: 'Reach 2200 ELO',
    icon: '\u{1F48E}',
    category: 'rating',
    rarity: 'legendary',
    check: (stats) => stats.elo >= 2200,
  },

  // Social category
  {
    id: 'first_post',
    name: 'First Post',
    description: 'Create a forum thread',
    icon: '\u{1F4DD}',
    category: 'social',
    rarity: 'common',
    check: (stats) => stats.forumPosts >= 1,
  },
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Send 10 chat messages',
    icon: '\u{1F4AC}',
    category: 'social',
    rarity: 'uncommon',
    check: (stats) => stats.chatMessages >= 10,
  },
  {
    id: 'tournament_player',
    name: 'Tournament Player',
    description: 'Register for a tournament',
    icon: '\u{1F3C5}',
    category: 'social',
    rarity: 'uncommon',
    check: (stats) => stats.tournamentsJoined >= 1,
  },

  // Special category
  {
    id: 'scholars_mate',
    name: "Scholar's Mate",
    description: 'Win in 4 moves or fewer',
    icon: '\u{1F393}',
    category: 'special',
    rarity: 'rare',
    check: (stats) => stats.shortestWin > 0 && stats.shortestWin <= 4,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Play a game with 100+ moves',
    icon: '\u{1F3C3}',
    category: 'special',
    rarity: 'rare',
    check: (stats) => stats.longestGame >= 100,
  },
  {
    id: 'puzzle_solver',
    name: 'Puzzle Solver',
    description: 'Solve 5 puzzles',
    icon: '\u{1F9E9}',
    category: 'special',
    rarity: 'common',
    check: (stats) => stats.puzzlesSolved >= 5,
  },
  {
    id: 'puzzle_master',
    name: 'Puzzle Master',
    description: 'Solve 20 puzzles',
    icon: '\u{1F9D9}',
    category: 'special',
    rarity: 'rare',
    check: (stats) => stats.puzzlesSolved >= 20,
  },
  {
    id: 'board_artist',
    name: 'Board Artist',
    description: 'Use the board editor',
    icon: '\u{1F3A8}',
    category: 'special',
    rarity: 'uncommon',
    check: (stats) => stats.usedEditor === true,
  },
];

export function checkAchievements(stats) {
  return ACHIEVEMENTS
    .filter((a) => a.check(stats))
    .map((a) => a.id);
}

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
