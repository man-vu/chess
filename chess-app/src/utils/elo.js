/**
 * FIDE Elo Rating System
 * Implements the official FIDE rating calculation rules.
 */

/**
 * Get the K-factor based on FIDE rules:
 * - K=40 for new players (< 30 rated games) under 2300
 * - K=20 for players who have never reached 2400
 * - K=10 for players who have ever reached 2400+
 */
export function getKFactor(playerElo, gamesPlayed = 0, peakElo = 0) {
  if (peakElo >= 2400 || playerElo >= 2400) return 10;
  if (gamesPlayed < 30 && playerElo < 2300) return 40;
  return 20;
}

/**
 * Calculate Elo change after a game using FIDE formula.
 * @param {number} playerElo - Current player rating
 * @param {number} opponentElo - Opponent's rating
 * @param {number} result - 1 for win, 0.5 for draw, 0 for loss
 * @param {number} gamesPlayed - Total rated games played by this player
 * @param {number} peakElo - Highest rating ever achieved
 * @returns {number} Rating change (positive or negative)
 */
export function calculateEloChange(playerElo, opponentElo, result, gamesPlayed = 30, peakElo = 0) {
  const K = getKFactor(playerElo, gamesPlayed, peakElo);
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(K * (result - expected));
}

/**
 * FIDE Title thresholds (simplified for online play).
 * In real FIDE, titles require norms from OTB tournaments.
 * Here we use rating + minimum games as proxy.
 */
const FIDE_TITLES = [
  { code: 'GM',  name: 'Grandmaster',                    minElo: 2500, minGames: 100, color: '#e74c3c' },
  { code: 'IM',  name: 'International Master',           minElo: 2400, minGames: 75,  color: '#e67e22' },
  { code: 'FM',  name: 'FIDE Master',                    minElo: 2300, minGames: 50,  color: '#f39c12' },
  { code: 'CM',  name: 'Candidate Master',               minElo: 2200, minGames: 30,  color: '#f1c40f' },
  { code: 'WGM', name: 'Woman Grandmaster',              minElo: 2300, minGames: 75,  color: '#e74c3c' },
  { code: 'WIM', name: 'Woman International Master',     minElo: 2200, minGames: 50,  color: '#e67e22' },
  { code: 'WFM', name: 'Woman FIDE Master',              minElo: 2100, minGames: 30,  color: '#f39c12' },
  { code: 'WCM', name: 'Woman Candidate Master',         minElo: 2000, minGames: 20,  color: '#f1c40f' },
];

/**
 * Get FIDE title based on rating and games played.
 * Only checks non-gendered titles (GM, IM, FM, CM) by default.
 */
export function getFideTitle(elo, gamesPlayed = 0) {
  // Check open titles (GM > IM > FM > CM)
  for (const title of FIDE_TITLES.slice(0, 4)) {
    if (elo >= title.minElo && gamesPlayed >= title.minGames) {
      return title;
    }
  }
  return null;
}

/**
 * Get all available FIDE titles for display/reference.
 */
export function getAllFideTitles() {
  return FIDE_TITLES;
}

/**
 * Get Elo tier (rating class) — complementary to FIDE title.
 * Tiers describe skill level even for untitled players.
 */
export function getEloTier(elo) {
  if (elo >= 2500) return { name: 'Grandmaster', color: '#e74c3c' };
  if (elo >= 2400) return { name: 'International Master', color: '#e67e22' };
  if (elo >= 2300) return { name: 'FIDE Master', color: '#f39c12' };
  if (elo >= 2200) return { name: 'Candidate Master', color: '#f1c40f' };
  if (elo >= 2000) return { name: 'Expert', color: '#81b64c' };
  if (elo >= 1800) return { name: 'Class A', color: '#3498db' };
  if (elo >= 1600) return { name: 'Class B', color: '#2980b9' };
  if (elo >= 1400) return { name: 'Class C', color: '#9b59b6' };
  if (elo >= 1200) return { name: 'Class D', color: '#95a5a6' };
  return { name: 'Beginner', color: '#7f8c8d' };
}
