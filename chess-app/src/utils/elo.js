const K = 32;

export function calculateEloChange(playerElo, opponentElo, result) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(K * (result - expected));
}

export function getEloTier(elo) {
  if (elo >= 2400) return { name: 'Grandmaster', color: '#e74c3c' };
  if (elo >= 2200) return { name: 'Master', color: '#e67e22' };
  if (elo >= 2000) return { name: 'Expert', color: '#f1c40f' };
  if (elo >= 1800) return { name: 'Class A', color: '#81b64c' };
  if (elo >= 1600) return { name: 'Class B', color: '#3498db' };
  if (elo >= 1400) return { name: 'Class C', color: '#9b59b6' };
  if (elo >= 1200) return { name: 'Class D', color: '#95a5a6' };
  return { name: 'Beginner', color: '#7f8c8d' };
}
