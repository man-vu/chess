export const CHALLENGES = [
  { id: 'c01', name: 'Speed Win', description: 'Win a game in under 20 moves', check: (game) => game.result === 'win' && game.moves.length <= 40, reward: 50, icon: '\u26A1' },
  { id: 'c02', name: 'Pawn Promotion', description: 'Promote a pawn in any game', check: (game) => game.pgn?.includes('='), reward: 30, icon: '\uD83D\uDC51' },
  { id: 'c03', name: 'Checkmate Artist', description: 'Win by checkmate (not resignation)', check: (game) => game.result === 'win' && game.pgn?.includes('#'), reward: 40, icon: '\uD83C\uDFAF' },
  { id: 'c04', name: 'Castle Master', description: 'Castle in a game', check: (game) => game.pgn?.includes('O-O'), reward: 20, icon: '\uD83C\uDFF0' },
  { id: 'c05', name: 'Puzzle Solver', description: 'Solve 3 puzzles today', check: (_, stats) => (stats.puzzlesToday || 0) >= 3, reward: 60, icon: '\uD83E\uDDE9' },
  { id: 'c06', name: 'Endurance', description: 'Play a game with 50+ moves', check: (game) => game.moves.length >= 100, reward: 35, icon: '\uD83C\uDFCB\uFE0F' },
  { id: 'c07', name: 'Social Butterfly', description: 'Send 5 messages in chat', check: (_, stats) => (stats.chatToday || 0) >= 5, reward: 25, icon: '\uD83D\uDCAC' },
  { id: 'c08', name: 'Streak Builder', description: 'Win 2 games in a row', check: (_, stats) => (stats.winStreak || 0) >= 2, reward: 45, icon: '\uD83D\uDD25' },
  { id: 'c09', name: 'Early Bird', description: 'Play a game before noon', check: (game) => new Date(game.date).getHours() < 12, reward: 20, icon: '\uD83C\uDF05' },
  { id: 'c10', name: 'Explorer', description: 'Try a new opening', check: () => false, reward: 30, icon: '\uD83D\uDDFA\uFE0F' }, // manual tracking
];

export function getDailyChallenges(date) {
  // Returns 3 challenges for the given date (deterministic based on date)
  const seed = Math.floor(date.getTime() / 86400000);
  const indices = [];
  for (let i = 0; i < 3; i++) {
    indices.push((seed * 7 + i * 13) % CHALLENGES.length);
  }
  return indices.map(i => CHALLENGES[i]);
}
